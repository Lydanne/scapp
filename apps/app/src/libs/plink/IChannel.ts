import { Emitter } from '../shared/emitter';
import type { AboutStatus } from './payload';
import {
  ChannelStatus,
  type ConnectionProps,
  type OnData,
  type SendData,
  type SocketIP,
} from './types';

export enum OnDisconnectCode {
  SUCCESS = 0,
  ERROR = 1, // 未知错误
  DETECT_ERROR = 2, // 探测错误
}

export type OnDisconnect<C> = {
  connection: C;
  code: OnDisconnectCode;
};

export abstract class IConnection {
  id: number;
  status: ChannelStatus = ChannelStatus.init;
  socketIP: SocketIP;
  seq: number = 0;

  constructor(data: ConnectionProps) {
    this.id = data.id;
    this.status = data.status;
    this.socketIP = data.socketIP;
    this.seq = data.seq;
  }

  abstract send(data: SendData, cb?: (onData: OnData) => any): Promise<void>;
  abstract on(cb: (data: OnData) => any): void;
  abstract about(sendId: number, about: AboutStatus): Promise<boolean>;
}

export abstract class IChannel<C extends IConnection> {
  emListen = new Emitter<(port: number) => any>();
  emClose = new Emitter<() => any>();
  emConnection = new Emitter<(connection: C) => any>();
  emDisconnect = new Emitter<(connection: OnDisconnect<C>) => any>();

  abstract connect(socketIP: SocketIP): Promise<C>;
  abstract disconnect(connection: C): Promise<boolean>;
  abstract listen(): Promise<number>;
  abstract close(): Promise<void>;
}
