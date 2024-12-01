import { Emitter } from '../../shared/emitter';
import { IChannel } from '../IChannel';
import { SocketPipe } from '../SocketPipe';
import {
  AboutStatus,
  Channel,
  type ConnectAction,
  DataType,
  type SynReadySignal,
} from '../payload';
import { fromBinary, rand, randId, toBinary } from '../shared';
import { ChannelStatus, type SocketIP } from '../types';
import { LocalConnection } from './LocalConnection';

export * from './LocalConnection';

export const BLOCK_SIZE = 1024 * 256;

const socket = new SocketPipe();

export enum OnDisconnectCode {
  SUCCESS = 0,
  ERROR = 1, // 未知错误
  DETECT_ERROR = 2, // 探测错误
}

export type OnDisconnect = {
  connection: LocalConnection;
  code: OnDisconnectCode;
};

export class LocalChannel extends IChannel<LocalConnection> {
  static listened = 0;

  connectionClient = new Map<number, LocalConnection>();

  constructor() {
    super();
    this.emConnection.on((data) => {
      console.log('[LocalChannel]', 'connectionEmitter', data);
    });
    this.emDisconnect.on((data) => {
      console.log('[LocalChannel]', 'disconnectEmitter', data);
      data.connection.about(0, AboutStatus.Stop);
    });
  }

  listen() {
    return new Promise<number>((resolve) => {
      if (LocalChannel.listened) {
        return resolve(LocalChannel.listened);
      }
      socket.listen((port) => {
        LocalChannel.listened = port;
        resolve(port);
        console.log('[LocalChannel]', 'listen', port);
        this.emListen.emitLifeCycle(port);

        socket.receiver.on((ev) => {
          const data = fromBinary<Channel>(Channel, ev.message);
          const client = this.connectionClient.get(data.id);
          console.log('[LocalChannel]', 'receiver', data);

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
                  this.emConnection.emitLifeCycle(client);

                  client.dataMpsc.tx.on((data) => {
                    // console.log('[LocalChannel]', 'emit dataMpsc', data);

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
                    console.log('[LocalChannel]', 'emit syncMpsc', data);

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
                  console.log(
                    '[LocalChannel]',
                    'onMessage',
                    'seq error',
                    client,
                  );
                  socket.sender.emit({
                    address: ev.remoteInfo.address,
                    port: ev.remoteInfo.port,
                    message: toBinary(Channel, {
                      version: 1,
                      id: client.id,
                      ts: BigInt(Date.now()),
                      action: {
                        oneofKind: 'disconnect',
                        disconnect: {
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
                  new LocalConnection({
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
                    this.emDisconnect.emitLifeCycle({
                      connection: client,
                      code: OnDisconnectCode.SUCCESS,
                    });
                    client.status = ChannelStatus.disconnected;
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
          console.log('[LocalChannel]', 'onError', err);
        });
        // if (false)
        //   setInterval(() => {
        //     for (const connection of this.connectionClient.values()) {
        //       if (
        //         connection.status === ChannelStatus.connected &&
        //         Date.now() - connection.detectAt > 5000
        //       ) {
        //         setTimeout(async () => {
        //           console.log('[LocalChannel]', 'detect', connection.id);

        //           const now = Date.now();
        //           connection.detectAt = now;
        //           connection.detectErrorCount = 0;
        //           const [ip, port] = connection.socketIP.split(':');
        //           const seq = rand(1, 100);
        //           socket.sender.emit({
        //             address: ip,
        //             port: parseInt(port),
        //             message: toBinary(Channel, {
        //               version: 1,
        //               id: connection.id,
        //               ts: BigInt(Date.now()),
        //               action: {
        //                 oneofKind: 'detect',
        //                 detect: {
        //                   seq,
        //                   ack: 0,
        //                   rtt: 0,
        //                 },
        //               },
        //             }),
        //           });
        //           while (true) {
        //             try {
        //               const [ev] = await socket.receiver.waitTimeout(1000);
        //               const data = fromBinary<Channel>(Channel, ev.message);
        //               if (
        //                 data.action?.oneofKind === 'detect' &&
        //                 data.action.detect.ack === seq + 1
        //               ) {
        //                 break;
        //               }
        //             } catch (error) {
        //               connection.detectErrorCount++;
        //               console.log('[LocalChannel]', 'detect timeout', error);
        //               if (connection.detectErrorCount > 3) {
        //                 connection.status = ChannelStatus.disconnected;
        //                 connection.close();
        //                 this.emDisconnect.emitLifeCycle({
        //                   connection,
        //                   code: OnDisconnectCode.DETECT_ERROR,
        //                 });
        //                 this.connectionClient.delete(connection.id);
        //                 break;
        //               }
        //             }
        //           }

        //           console.log(
        //             '[LocalChannel]',
        //             'detect done',
        //             connection.id,
        //             Date.now() - now,
        //           );
        //         });
        //       }
        //     }
        //   }, 1000);
      });
    });
  }

  async close() {
    socket.close(async () => {
      console.log('[LocalChannel]', 'close');
      this.emClose.emit();
      this.emConnection.destroy();
      // this.disconnectEmitter.destroy();
      // this.listenEmitter.destroy();
    });
  }

  async connect(socketIP: SocketIP) {
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
    const connection = new LocalConnection({
      id,
      status: ChannelStatus.connecting,
      socketIP: socketIP,
      seq,
    });
    this.connectionClient.set(id, connection);

    await this.emConnection.waitTimeout(5000);

    return connection;
  }

  async disconnect(connection: LocalConnection) {
    console.log('[LocalChannel]', 'disconnect', connection);
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
