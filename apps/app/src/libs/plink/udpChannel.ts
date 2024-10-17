import Taro from '@tarojs/taro';

import { Base64 } from '../shared/base64';
import { Emitter } from '../shared/emitter';
import { uuid } from '../shared/uuid';
import {
  type AckReadySignal,
  Channel,
  type DataAction,
  type SyncAction,
} from './payload';
import { fromBinary, toBinary } from './shared';

const BLOCK_SIZE = 2048;

const udp = Taro.createUDPSocket();

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

  async send(type: DataAction['data']['oneofKind'], data: any) {
    const id = Date.now() % 1000000000;
    switch (type) {
      case 'text': {
        const text = Base64.encode(data);
        const length = Math.ceil(text.length / BLOCK_SIZE);

        this.signalSender.emit({
          id,
          signal: {
            oneofKind: 'synReady',
            synReady: {
              size: text.length,
              length,
              sign: '',
            },
          },
        });
        const ackReady = await this.signalReceiver.first();
        if (ackReady.signal.oneofKind !== 'ackReady') {
          throw new Error('ackReady error');
        }

        for (let index = 0; index < length; index++) {
          this.sender.emitSync({
            id,
            index,
            data: {
              oneofKind: type,
              text: text.slice(index * BLOCK_SIZE, (index + 1) * BLOCK_SIZE),
            },
          });
        }
        break;
      }
      case 'file': {
        const path = data.path;
        const name = encodeURIComponent(data.name);
        const size = data.size; // B

        const length = Math.ceil(size / BLOCK_SIZE);

        const fsm = Taro.getFileSystemManager();
        fsm.open({
          filePath: path,
          success: async ({ fd }) => {
            const ts = Date.now();
            const sign = await new Promise<string>((resolve, reject) => {
              fsm.getFileInfo({
                filePath: path,
                digestAlgorithm: 'md5',
                success: ({ digest }) => {
                  resolve(digest as string);
                },
                fail: reject,
              });
            });
            this.signalSender.emit({
              id,
              signal: {
                oneofKind: 'synReady',
                synReady: {
                  size,
                  length,
                  sign,
                },
              },
            });
            const ackReady = await this.signalReceiver.first();
            if (ackReady.signal.oneofKind !== 'ackReady') {
              throw new Error('ackReady error');
            }

            for (let index = 0; index < length; index++) {
              const offset = index * BLOCK_SIZE;
              const offsetLen = Math.min(size - offset, BLOCK_SIZE);
              const buffer = new ArrayBuffer(offsetLen);

              await new Promise((resolve) => {
                fsm.read({
                  fd,
                  arrayBuffer: buffer,
                  position: offset,
                  length: offsetLen,
                  success: resolve,
                });
              });
              // console.log(offset, offsetLen, buffer);
              this.sender.emit({
                id,
                index,
                data: {
                  oneofKind: type,
                  file: {
                    name,
                    type: 'application/octet-stream',
                    data: new Uint8Array(buffer),
                  },
                },
              });
            }
            console.log('send file done', [id, length], Date.now() - ts);
          },
        });
        break;
      }
    }
  }

  on(cb: (data: DataAction['data']) => any) {
    const pipeMap = new Map<
      number,
      {
        buffer: any[];
        info: AckReadySignal;
      }
    >();
    this.signalReceiver.on(async (data) => {
      if (data.signal.oneofKind === 'synReady') {
        pipeMap.set(data.id, {
          buffer: new Array(data.signal.synReady.length),
          info: data.signal.synReady,
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
      }
    });
    this.receiver.on(async (data) => {
      const pipe = pipeMap.get(data.id);
      if (!pipe) {
        console.warn('pipe not found', data.id);
        return;
      }
      if (data.data.oneofKind === 'text') {
        pipe.buffer[data.index] = data.data.text;
      } else if (data.data.oneofKind === 'file') {
      }
      if (data.index + 1 === pipe.info.length) {
        setTimeout(async () => {
          const length = pipe.info.length;
          for (let c = 0; c < 100; c++) {
            let isEnd = false;
            for (let i = 0; i < length; i++) {
              if (!pipe.buffer[i]) {
                isEnd = true;
                break;
              }
            }
            if (!isEnd) {
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          if (data.data.oneofKind === 'text') {
            const buffers: string[] = [];
            for (let i = 0; i < length; i++) {
              buffers.push(pipe.buffer[i]);
            }
            const buffer = buffers.join('');
            data.data.text = Base64.decode(buffer);
            pipeMap.delete(data.id);
            cb(data.data);
          } else if (data.data.oneofKind === 'file') {
          }
        }, 100);
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
    setTimeout(() => {
      const port = udp.bind(undefined as unknown as number);
      UdpChannel.listened = port;
      console.log('[UdpChannel]', 'listen', port);
      this.listenEmitter.emitLifeCycle(port);
      // udp.onListening(() => {
      //   console.log('[UdpChannel]', 'onListening');
      // });

      udp.onMessage((res) => {
        const data = fromBinary<Channel>(Channel, res.message);
        console.log('[UdpChannel]', 'onMessage', data);
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
                udp.send({
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
                udp.send({
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
                udp.send({
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
              udp.send({
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
            udp.send({
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

      udp.onError((err) => {
        console.log('[UdpChannel]', 'onError', err);
      });
    }, 1000);

    return this;
  }

  connect(socketIP: SocketIP) {
    const [ip, port] = socketIP.split(':');
    const id = rand(1, 10000);
    const seq = rand(1, 100);
    udp.send({
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

export default new UdpChannel().listen();
