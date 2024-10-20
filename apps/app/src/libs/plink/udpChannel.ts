import Taro from '@tarojs/taro';

import { Base64 } from '../shared/base64';
import { Emitter } from '../shared/emitter';
import { UdpSocket } from '../tapi/socket';
import {
  type AckReadySignal,
  Channel,
  type DataAction,
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

        this.signalSender.emitSync({
          id,
          signal: {
            oneofKind: 'synReady',
            synReady: {
              size: text.length,
              length,
              sign: '',
              name: '',
              type: 'text',
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
        const fd: string = await new Promise((resolve, reject) => {
          fsm.open({
            filePath: path,
            success: async ({ fd }) => {
              resolve(fd);
            },
            fail: reject,
          });
        });
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
        this.signalSender.emitSync({
          id,
          signal: {
            oneofKind: 'synReady',
            synReady: {
              size,
              length,
              sign,
              name,
              type: 'file',
            },
          },
        });
        const ackReady = await this.signalReceiver.first();
        if (ackReady.signal.oneofKind !== 'ackReady') {
          throw new Error('ackReady error');
        }

        let index = 0;
        while (1) {
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
          this.sender.emitSync({
            id,
            index,
            data: {
              oneofKind: type,
              file: new Uint8Array(buffer),
            },
          });
          try {
            const [ackDataStatus] = await this.signalReceiver.waitTimeout(1000);
            if (
              ackDataStatus.id === id &&
              ackDataStatus.signal.oneofKind === 'ackDataFinish' &&
              ackDataStatus.signal.ackDataFinish.index === index &&
              ackDataStatus.signal.ackDataFinish.status === FinishStatus.Ok
            ) {
              index++;
            } else {
              console.log('send file resend', ackDataStatus);
            }
          } catch (error) {
            console.log('send file error', error);
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }

          if (index === length) {
            break;
          }
        }

        console.log('send file done', [id, length], Date.now() - ts);
        break;
      }
    }
  }

  on(cb: (data: any) => any) {
    const pipeMap = new Map<
      number,
      {
        buffer: any[];
        info: SynReadySignal;
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
        pipe.buffer[data.index] = data.data.file;
        this.signalSender.emitSync({
          id: data.id,
          signal: {
            oneofKind: 'ackDataFinish',
            ackDataFinish: {
              index: data.index,
              status: FinishStatus.Ok,
            },
          },
        });
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
            cb(data.data);
          } else if (data.data.oneofKind === 'file') {
            const filename = decodeURIComponent(pipe.info.name);
            const filePath = `${Taro.env.USER_DATA_PATH}/${filename}`;
            const fsm = Taro.getFileSystemManager();
            await new Promise((resolve) => {
              fsm.removeSavedFile({
                filePath,
                success: resolve,
                fail: resolve,
              });
            });
            const fd: string = await new Promise((resolve, reject) => {
              fsm.open({
                filePath: filePath,
                flag: 'w+',
                success: async ({ fd }) => {
                  resolve(fd);
                },
                fail: reject,
              });
            });

            for (let index = 0; index < pipe.info.length; index++) {
              const buffer = pipe.buffer[index];
              const offset = index * BLOCK_SIZE;
              const offsetLen = Math.min(pipe.info.size - offset, BLOCK_SIZE);
              const arrayBuffer = new ArrayBuffer(offsetLen);
              const uint8Array = new Uint8Array(arrayBuffer);
              for (let i = 0; i < offsetLen; i++) {
                uint8Array[i] = buffer[i];
              }
              fsm.write({
                fd,
                data: arrayBuffer,
                position: offset,
                success(res) {
                  console.log(res.bytesWritten);
                },
              });
            }
            console.log('receive file done', data.id, data, filePath);
            cb({
              oneofKind: data.data.oneofKind,
              name: filename,
              path: filePath,
              size: pipe.info.size,
            });
          }
          pipeMap.delete(data.id);
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

export default new UdpChannel().listen();