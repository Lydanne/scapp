import Taro from '@tarojs/taro';

import { Base64 } from '../shared/base64';
import { Emitter } from '../shared/emitter';
import { uuid } from '../shared/uuid';
import { Channel, type DataAction } from './payload';
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

  constructor(data: ConnectionProps) {
    this.id = data.id;
    this.status = data.status;
    this.socketIP = data.socketIP;
    this.seq = data.seq;
  }

  send(type: DataAction['data']['oneofKind'], data: any) {
    const id = Date.now() % 1000000000;
    switch (type) {
      case 'text': {
        const text = Base64.encode(data);
        const length = Math.ceil(text.length / BLOCK_SIZE);
        for (let index = 0; index < length; index++) {
          this.sender.emitSync({
            id,
            index,
            length,
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
        const name = data.name;
        const size = data.size; // B

        const length = Math.ceil(size / BLOCK_SIZE);

        const fsm = Taro.getFileSystemManager();
        fsm.open({
          filePath: path,
          success: async ({ fd }) => {
            const buffer = new ArrayBuffer(size);
            for (let index = 0; index < length; index++) {
              const offset = index * BLOCK_SIZE;
              const length = Math.min(size - offset, BLOCK_SIZE);
              fsm.read({
                fd,
                arrayBuffer: buffer,
                position: offset,
                length,
                success: (res) => {
                  this.sender.emit({
                    id,
                    index,
                    length,
                    data: {
                      oneofKind: type,
                      file: {
                        name,
                        type: 'application/octet-stream',
                        data: new Uint8Array(buffer),
                      },
                    },
                  });
                },
              });
            }
          },
        });
        break;
      }
    }
  }

  on(cb: (data: DataAction['data']) => any) {
    const buffersMap = new Map<string, any>();
    this.receiver.on(async (data) => {
      buffersMap.set(data.id + ':length', data.length.toString());
      if (data.data.oneofKind === 'text') {
        buffersMap.set(data.id + ':' + data.index, data.data.text);
      } else if (data.data.oneofKind === 'file') {
        const file = data.data.file;
        buffersMap.set(data.id + ':' + data.index, file.data);
        buffersMap.set(data.id + ':name', file.name);
        buffersMap.set(data.id + ':type', file.type);
      }
      if (data.index + 1 === data.length) {
        setTimeout(async () => {
          const length = buffersMap.get(data.id + ':length') || 0;
          for (let c = 0; c < 100; c++) {
            let isEnd = false;
            for (let i = 0; i < parseInt(length); i++) {
              if (!buffersMap.has(data.id + ':' + i)) {
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
            for (let i = 0; i < parseInt(length); i++) {
              buffers.push(buffersMap.get(data.id + ':' + i) || '');
              buffersMap.delete(data.id + ':' + i);
            }
            buffersMap.delete(data.id + ':length');
            const buffer = buffers.join('');
            data.data.text = Base64.decode(buffer);
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
