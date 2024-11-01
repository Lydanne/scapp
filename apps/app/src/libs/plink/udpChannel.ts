import { Emitter } from '../shared/emitter';
import { ChannelStatus, Connection, type SocketIP } from './Connection';
import { ChannelSocket } from './channelSocket';
import {
  Channel,
  type ConnectAction,
  DataType,
  type SynReadySignal,
} from './payload';
import { fromBinary, rand, randId, toBinary } from './shared';

export * from './Connection';

export const BLOCK_SIZE = 1024 * 128;

const socket = new ChannelSocket();

export enum OnDisconnectCode {
  SUCCESS = 0,
  ERROR = 1, // 未知错误
  DETECT_ERROR = 2, // 探测错误
}

export type OnDisconnect = {
  connection: Connection;
  code: OnDisconnectCode;
};

export class UdpChannel {
  static listened = 0;

  connectionClient = new Map<number, Connection>();

  listenEmitter = new Emitter<(port: number) => any>();
  connectionEmitter = new Emitter<(connection: Connection) => any>();
  disconnectEmitter = new Emitter<(connection: OnDisconnect) => any>();

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

      socket.receiver.on((ev) => {
        const data = fromBinary<Channel>(Channel, ev.message);
        const client = this.connectionClient.get(data.id);
        // console.log('[UdpChannel]', 'receiver', data, client);

        switch (data.action.oneofKind) {
          case 'connect':
            if (client) {
              // 验证连接
              if (client.seq + 1 === data.action.connect.ack) {
                if (client.status !== ChannelStatus.connecting) {
                  return;
                }

                if (data.action.connect.seq != 0) {
                  // 最后发送确认连接
                  socket.sender.emitSync({
                    address: ev.remoteInfo.address,
                    port: ev.remoteInfo.port,
                    message: toBinary(Channel, {
                      version: 1,
                      id: data.id,
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

                client.status = ChannelStatus.connected;
                this.connectionClient.set(data.id, client);
                this.connectionEmitter.emitLifeCycle(client);

                client.dataMpsc.tx.on((data) => {
                  socket.sender.emit({
                    address: ev.remoteInfo.address,
                    port: ev.remoteInfo.port,
                    message: toBinary(Channel, {
                      version: 1,
                      id: client.id,
                      ts: BigInt(Date.now()),
                      action: {
                        oneofKind: 'data',
                        data: data,
                      },
                    }),
                  });
                });
                client.syncMpsc.tx.on((data) => {
                  socket.sender.emit({
                    address: ev.remoteInfo.address,
                    port: ev.remoteInfo.port,
                    message: toBinary(Channel, {
                      version: 1,
                      id: client.id,
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
                  address: ev.remoteInfo.address,
                  port: ev.remoteInfo.port,
                  message: toBinary(Channel, {
                    version: 1,
                    id: client.id,
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
                data.id,
                new Connection({
                  id: data.id,
                  status: ChannelStatus.connecting,
                  seq,
                  socketIP: `${ev.remoteInfo.address}:${ev.remoteInfo.port}`,
                }),
              );
              socket.sender.emit({
                address: ev.remoteInfo.address,
                port: ev.remoteInfo.port,
                message: toBinary(Channel, {
                  version: 1,
                  id: data.id,
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
            break;
          case 'disconnect':
            if (client) {
              if (client.status === ChannelStatus.connected) {
                // 客户端请求断开连接
                socket.sender.emitSync({
                  address: ev.remoteInfo.address,
                  port: ev.remoteInfo.port,
                  message: toBinary(Channel, {
                    version: 1,
                    id: client.id,
                    ts: BigInt(Date.now()),
                    action: {
                      oneofKind: 'disconnect',
                      disconnect: {
                        seq: client.seq,
                        ack: data.action.disconnect.seq + 1,
                      },
                    },
                  }),
                });
                client.status = ChannelStatus.disconnecting;
              } else if (client.status === ChannelStatus.disconnecting) {
                if (client.seq + 1 === data.action.disconnect.ack) {
                  this.disconnectEmitter.emitLifeCycle({
                    connection: client,
                    code: OnDisconnectCode.SUCCESS,
                  });
                  client.status = ChannelStatus.disconnected;
                  client.close();
                  this.connectionClient.delete(data.id);
                } else {
                  client.status = ChannelStatus.connected;
                }
              }
            }
            break;
          case 'data':
            client?.dataMpsc.rx.emitSync(data.action.data);
            break;
          case 'sync':
            client?.syncMpsc.rx.emitSync(data.action.sync);
            break;
          case 'detect':
            // client?.signalSender.emitSync(data.action.detect);
            break;
          default:
            break;
        }
      });

      socket.errorEmitter.on((err) => {
        console.log('[UdpChannel]', 'onError', err);
      });
      if (false)
        setInterval(() => {
          for (const connection of this.connectionClient.values()) {
            if (
              connection.status === ChannelStatus.connected &&
              Date.now() - connection.detectAt > 5000
            ) {
              setTimeout(async () => {
                console.log('[UdpChannel]', 'detect', connection.id);

                const now = Date.now();
                connection.detectAt = now;
                connection.detectErrorCount = 0;
                const [ip, port] = connection.socketIP.split(':');
                const seq = rand(1, 100);
                socket.sender.emit({
                  address: ip,
                  port: parseInt(port),
                  message: toBinary(Channel, {
                    version: 1,
                    id: connection.id,
                    ts: BigInt(Date.now()),
                    action: {
                      oneofKind: 'detect',
                      detect: {
                        seq,
                        ack: 0,
                        rtt: 0,
                      },
                    },
                  }),
                });
                while (true) {
                  try {
                    const [ev] = await socket.receiver.waitTimeout(1000);
                    const data = fromBinary<Channel>(Channel, ev.message);
                    if (
                      data.action?.oneofKind === 'detect' &&
                      data.action.detect.ack === seq + 1
                    ) {
                      break;
                    }
                  } catch (error) {
                    connection.detectErrorCount++;
                    console.log('[UdpChannel]', 'detect timeout', error);
                    if (connection.detectErrorCount > 3) {
                      connection.status = ChannelStatus.disconnected;
                      connection.close();
                      this.disconnectEmitter.emitLifeCycle({
                        connection,
                        code: OnDisconnectCode.DETECT_ERROR,
                      });
                      this.connectionClient.delete(connection.id);
                      break;
                    }
                  }
                }

                console.log(
                  '[UdpChannel]',
                  'detect done',
                  connection.id,
                  Date.now() - now,
                );
              });
            }
          }
        }, 1000);
    });

    return this;
  }

  connect(socketIP: SocketIP) {
    const [ip, port] = socketIP.split(':');
    const id = randId();
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

  async disconnect(id: number) {
    console.log('[UdpChannel]', 'disconnect', id);
    const connection = this.connectionClient.get(id);
    if (!connection) {
      console.warn('[UdpChannel]', 'disconnect', 'connection not found', id);
      return false;
    }
    const [ip, port] = connection.socketIP.split(':');
    const seq = rand(1, 100);
    socket.sender.emit({
      address: ip,
      port: parseInt(port),
      message: toBinary(Channel, {
        version: 1,
        id,
        ts: BigInt(Date.now()),
        action: {
          oneofKind: 'disconnect',
          disconnect: {
            seq,
            ack: 0,
          },
        },
      }),
    });
    return true;
  }
}

const udpChannel = new UdpChannel().listen();

export default udpChannel;
