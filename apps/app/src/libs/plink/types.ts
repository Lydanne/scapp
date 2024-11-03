import type { AnyObject } from '../shared/type-tools';
import type { DataType, SynReadySignal } from './payload';

export type SocketIP = `${string}:${number}`;

export enum OnDataStatus {
  READY = 0,
  SENDING = 1,
  DONE = 2,
}

export enum ChannelStatus {
  init = 0,
  connecting = 1,
  connected = 2,
  disconnecting = 3,
  disconnected = 4,
}

export type ConnectionProps<O extends AnyObject = {}> = {
  id: number;
  status: ChannelStatus;
  socketIP: SocketIP;
  seq: number;
  options?: O;
};

export type OnData = {
  id: number; // 消息 id
  index: number; // 块序号
  status: OnDataStatus;
  type: DataType;
  progress: number; // 0-100, 0 表示准备好，100 表示完成
  speed: number; // 速度 字节/秒
  head: SynReadySignal;
  body: string;
};

export type SendData = {
  id: number;
  type: DataType;
  head: Partial<SynReadySignal>;
  body: string;
};
