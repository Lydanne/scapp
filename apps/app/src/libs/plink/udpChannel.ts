import Taro from '@tarojs/taro';

import { Emitter } from '../shared/emitter';
import { uuid } from '../shared/uuid';
import { Channel } from './payload';
import { fromBinary, toBinary } from './shared';

const udp = Taro.createUDPSocket();

export type ListenEmitter = (port: number) => any;
export type EventEmitter = (channel: Channel) => any;

export type SocketIP = `${string}:${number}`;

export enum ChannelStatus {
  connecting = 'connecting',
  connected = 'connected',
  disconnecting = 'disconnecting',
  disconnected = 'disconnected',
}

export class UdpChannel {
  static listened = 0;

  connectionClient = new Map<number, any>();

  listenEmitter = new Emitter<ListenEmitter>();
  connectionEmitter = new Emitter<EventEmitter>();
  eventEmitter = new Emitter<EventEmitter>();
  rawEmitter = new Emitter<any>();

  constructor() {}
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
        console.log('[UdpChannel]', 'onMessage', res, data);
        if (data.action?.oneofKind === 'connect') {
          const id = data.id;
          if (this.connectionClient.has(id)) {
            const client = this.connectionClient.get(id);

            if (client.seq + 1 === data.action.connect.ack) {
              this.connectionClient.set(id, {
                ...client,
                status: ChannelStatus.connected,
              });
              this.connectionEmitter.emitLifeCycle(data);
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
            const seq = rand(1, 100);
            this.connectionClient.set(id, {
              status: ChannelStatus.connecting,
              seq,
              clientIP: `${res.remoteInfo.address}:${res.remoteInfo.port}`,
            });
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

    this.connectionClient.set(id, {
      status: ChannelStatus.connecting,
      clientIP: socketIP,
      seq,
    });

    return this;
  }

  send(data: any, ip: string, port: number) {
    udp.send({
      address: ip,
      port: port,
      message: data,
    });
  }
}

function rand(begin, end) {
  return Math.floor(Math.random() * (end - begin)) + begin;
}

export default new UdpChannel().listen();
