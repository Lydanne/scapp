import { Base64 } from '../shared/base64';
import { bufferMd5 } from '../shared/bufferMd5';
import { Emitter } from '../shared/emitter';
import { StringBuffer } from '../shared/stringbuffer';
import { FS, type FSOpen } from '../tapi/fs';
import { UdpSocket } from '../tapi/socket';
import {
  Channel,
  type DataAction,
  DataType,
  FinishStatus,
  type SynReadySignal,
  type SyncAction,
} from './payload';
import { fromBinary, toBinary } from './shared';

const BLOCK_SIZE = 2048;

const socket = new UdpSocket();

export type SocketIP = `${string}:${number}`;

export enum ChannelStatus {
  connecting = 'connecting',
  connected = 'connected',
  disconnecting = 'disconnecting',
  disconnected = 'disconnected',
}

export type ConnectionProps = {
  id: number;
  status: ChannelStatus;
  socketIP: SocketIP;
  seq: number;
};

export type OnData = {
  id: number; // 消息 id
  index: number; // 块序号
  type: DataType;
  progress: number; // 0-100, 0 表示准备好，100 表示完成
  head: SynReadySignal;
  body: string;
};

export type SendData = {
  type: DataType;
  head: Partial<SynReadySignal>;
  body: string;
};

class Connection {
  id: number;
  status: ChannelStatus;
  socketIP: SocketIP;
  seq: number;

  sender = new Emitter<(data: DataAction) => any>();
  receiver = new Emitter<(data: DataAction) => any>();

  signalSender = new Emitter<(data: SyncAction) => any>();
  signalReceiver = new Emitter<(data: SyncAction) => any>();

  constructor(data: ConnectionProps) {
    this.id = data.id;
    this.status = data.status;
    this.socketIP = data.socketIP;
    this.seq = data.seq;
  }

  async send(data: SendData) {
    console.log('send', data);
    const { type, head, body } = data;

    const id = Date.now() % 1000000000;
    const name = encodeURIComponent(head.name ?? '');
    let size: number;
    let sign: string;
    let fd: FSOpen | undefined;
    let getDataChunk: (offset: number, length: number) => Promise<ArrayBuffer>;
    const ts = Date.now();

    if (type === DataType.FILE) {
      const path = head.name ?? '';
      size = head.size ?? 0;
      console.log('send file', [path, size]);

      sign = await FS.sign(path, 'md5');
      fd = await FS.open(path, 'r');
      getDataChunk = async (offset, length) => await fd!.read(offset, length);
    } else {
      const text = body;
      const base64Text = Base64.encode(text);
      const buffer = StringBuffer.encode(base64Text);
      size = buffer.byteLength;
      sign = bufferMd5(buffer);
      getDataChunk = async (offset, length) => {
        const chunk = buffer.slice(offset, offset + length);
        return chunk;
      };
    }

    const length = Math.ceil(size / BLOCK_SIZE);

    this.signalSender.emitSync({
      id,
      signal: {
        oneofKind: 'synReady',
        synReady: {
          size,
          length,
          sign,
          name,
          type,
        },
      },
    });
    const [ackReady] = await this.signalReceiver.wait();
    if (ackReady.signal.oneofKind !== 'ackReady') {
      throw new Error('ackReady error');
    }

    let index = 0;
    while (1) {
      const offset = index * BLOCK_SIZE;
      const offsetLen = Math.min(size - offset, BLOCK_SIZE);
      const buffer = await getDataChunk(offset, offsetLen);
      this.sender.emitSync({
        id,
        index,
        body: new Uint8Array(buffer),
      });
      try {
        const [ackDataStatus] = await this.signalReceiver.waitTimeout(1000);
        if (
          ackDataStatus.id === id &&
          ackDataStatus.signal.oneofKind === 'ackChunkFinish' &&
          ackDataStatus.signal.ackChunkFinish.index === index &&
          ackDataStatus.signal.ackChunkFinish.status === FinishStatus.Ok
        ) {
          index++;
        } else {
          console.log('发送重试', ackDataStatus);
        }
      } catch (error) {
        console.log('发送错误', error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (index === length) {
        break;
      }
    }

    if (type === DataType.FILE && fd) {
      await fd.close();
    }

    console.log('发送完成', [id, length], Date.now() - ts);
  }

  on(cb: (data: OnData) => any) {
    const pipeMap = new Map<
      number,
      {
        buffers: Uint8Array[];
        head: SynReadySignal;
        received: number;
        progress: number;
      }
    >();

    this.signalReceiver.on(async (data) => {
      if (data.signal.oneofKind === 'synReady') {
        pipeMap.set(data.id, {
          buffers: new Array(data.signal.synReady.length),
          head: data.signal.synReady,
          received: 0,
          progress: 0,
        });
        this.signalSender.emitSync({
          id: data.id,
          signal: {
            oneofKind: 'ackReady',
            ackReady: {
              length: data.signal.synReady.length,
              sign: data.signal.synReady.sign,
              size: data.signal.synReady.size,
            },
          },
        });
        cb({
          id: data.id,
          index: 0,
          type: data.signal.synReady.type as DataType,
          progress: 0,
          head: data.signal.synReady,
          body: '',
        });
      }
    });

    this.receiver.on(async (data) => {
      const pipe = pipeMap.get(data.id);
      if (!pipe) {
        console.warn('pipe not found', data.id);
        return;
      }

      if (pipe.buffers[data.index]) {
        console.warn('chunk already received', data.id, data.index);
        return;
      }
      this.signalSender.emitSync({
        id: data.id,
        signal: {
          oneofKind: 'ackChunkFinish',
          ackChunkFinish: {
            index: data.index,
            status: FinishStatus.Ok,
          },
        },
      });
      pipe.received += 1;
      pipe.progress = Math.floor((pipe.received / pipe.head.length) * 100);
      pipe.buffers[data.index] = data.body;

      cb({
        id: data.id,
        index: data.index,
        type: pipe.head.type as DataType,
        progress: pipe.progress,
        head: pipe.head,
        body: '',
      });

      if (pipe.received === pipe.head.length) {
        try {
          const buffer = mergeArrayBuffer(pipe.buffers);
          if (pipe.head.type === DataType.TEXT) {
            const base64Text = StringBuffer.decode(new Uint8Array(buffer));
            const body = Base64.decode(base64Text);
            cb({
              id: data.id,
              index: data.index,
              type: DataType.TEXT,
              progress: 100,
              head: pipe.head,
              body: body,
            });
          } else if (pipe.head.type === DataType.FILE) {
            const filename = decodeURIComponent(pipe.head.name);
            await FS.remove(filename);
            const fd = await FS.open(filename, 'w+');

            for (let index = 0; index < pipe.head.length; index++) {
              const chunk = pipe.buffers[index];
              const offset = index * BLOCK_SIZE;
              const offsetLen = Math.min(pipe.head.size - offset, BLOCK_SIZE);
              const arrayBuffer = new ArrayBuffer(offsetLen);
              const uint8Array = new Uint8Array(arrayBuffer);
              uint8Array.set(chunk.slice(0, offsetLen));
              await fd.write(offset, arrayBuffer);
            }

            console.log('receive file done', data.id, filename);
            cb({
              id: data.id,
              index: data.index,
              type: DataType.FILE,
              progress: 100,
              head: {
                ...pipe.head,
                name: filename,
              },
              body: fd.filePath,
            });
          }
          pipeMap.delete(data.id);
        } catch (error) {
          console.error('Error processing received data:', error);
        }
      }
    });
  }
}

export class UdpChannel {
  static listened = 0;

  connectionClient = new Map<number, Connection>();

  listenEmitter = new Emitter<(port: number) => any>();
  connectionEmitter = new Emitter<(connection: Connection) => any>();
  rawEmitter = new Emitter<() => Connection>();

  constructor() {
    this.connectionEmitter.on((data) => {
      console.log('[UdpChannel]', 'connectionEmitter', data);
    });
  }
  listen() {
    if (UdpChannel.listened) {
      return this;
    }

    socket.listen((port) => {
      UdpChannel.listened = port;
      console.log('[UdpChannel]', 'listen', port);
      this.listenEmitter.emitLifeCycle(port);

      socket.receiver.on((res) => {
        const data = fromBinary<Channel>(Channel, res.message);
        console.log('[UdpChannel]', 'receiver', data);
        if (data.action?.oneofKind === 'connect') {
          const id = data.id;
          if (this.connectionClient.has(id)) {
            // 验证连接
            const client = this.connectionClient.get(id) as Connection;
            if (client.seq + 1 === data.action.connect.ack) {
              if (client.status !== ChannelStatus.connecting) {
                return;
              }
              const connection = new Connection({
                ...client,
                status: ChannelStatus.connected,
              });
              this.connectionClient.set(id, connection);
              this.connectionEmitter.emitLifeCycle(connection);
              if (data.action.connect.seq != 0) {
                socket.sender.emit({
                  address: res.remoteInfo.address,
                  port: res.remoteInfo.port,
                  message: toBinary(Channel, {
                    version: 1,
                    id: id,
                    ts: BigInt(Date.now()),
                    action: {
                      oneofKind: 'connect',
                      connect: {
                        seq: 0,
                        ack: data.action.connect.seq + 1,
                      },
                    },
                  }),
                });
              }

              connection.sender.on((data) => {
                socket.sender.emit({
                  address: res.remoteInfo.address,
                  port: res.remoteInfo.port,
                  message: toBinary(Channel, {
                    version: 1,
                    id: id,
                    ts: BigInt(Date.now()),
                    action: {
                      oneofKind: 'data',
                      data: data,
                    },
                  }),
                });
              });
              connection.signalSender.on((data) => {
                socket.sender.emit({
                  address: res.remoteInfo.address,
                  port: res.remoteInfo.port,
                  message: toBinary(Channel, {
                    version: 1,
                    id: id,
                    ts: BigInt(Date.now()),
                    action: {
                      oneofKind: 'sync',
                      sync: data,
                    },
                  }),
                });
              });
            } else {
              console.log('[UdpChannel]', 'onMessage', 'seq error');
              socket.sender.emit({
                address: res.remoteInfo.address,
                port: res.remoteInfo.port,
                message: toBinary(Channel, {
                  version: 1,
                  id: id,
                  ts: BigInt(Date.now()),
                  action: {
                    oneofKind: 'disconnect',
                    connect: {
                      seq: 0,
                      ack: 0,
                    },
                  },
                }),
              });
            }
          } else {
            // 请求连接
            const seq = rand(1, 100);
            this.connectionClient.set(
              id,
              new Connection({
                id,
                status: ChannelStatus.connecting,
                seq,
                socketIP: `${res.remoteInfo.address}:${res.remoteInfo.port}`,
              }),
            );
            socket.sender.emit({
              address: res.remoteInfo.address,
              port: res.remoteInfo.port,
              message: toBinary(Channel, {
                version: 1,
                id: id,
                ts: BigInt(Date.now()),
                action: {
                  oneofKind: 'connect',
                  connect: {
                    seq: seq,
                    ack: data.action.connect.seq + 1,
                  },
                },
              }),
            });
          }
        } else if (data.action?.oneofKind === 'data') {
          const id = data.id;
          if (this.connectionClient.has(id)) {
            const client = this.connectionClient.get(id) as Connection;
            client.receiver.emitSync(data.action.data);
          }
        } else if (data.action.oneofKind === 'sync') {
          const id = data.id;
          if (this.connectionClient.has(id)) {
            const client = this.connectionClient.get(id) as Connection;
            client.signalReceiver.emitSync(data.action.sync);
          }
        }
      });

      socket.errorEmitter.on((err) => {
        console.log('[UdpChannel]', 'onError', err);
      });
    });

    return this;
  }

  connect(socketIP: SocketIP) {
    const [ip, port] = socketIP.split(':');
    const id = rand(1, 10000);
    const seq = rand(1, 100);
    socket.sender.emit({
      address: ip,
      port: parseInt(port),
      message: toBinary(Channel, {
        version: 1,
        id,
        ts: BigInt(Date.now()),
        action: {
          oneofKind: 'connect',
          connect: {
            seq,
            ack: 0,
          },
        },
      }),
    });

    this.connectionClient.set(
      id,
      new Connection({
        id,
        status: ChannelStatus.connecting,
        socketIP: socketIP,
        seq,
      }),
    );

    return this;
  }
}

function rand(begin, end) {
  return Math.floor(Math.random() * (end - begin)) + begin;
}

function mergeArrayBuffer(buffers: ArrayBufferLike[]): ArrayBuffer {
  if (buffers.length === 0) {
    return new ArrayBuffer(0);
  }

  const length = buffers.reduce((prev, curr) => prev + curr.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return result.buffer;
}

export default new UdpChannel().listen();
