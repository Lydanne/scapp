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

export enum AboutStatus {
  RESUME = 0, // 恢复
  PAUSE = 1, // 暂停
  STOP = 2, // 停止
}

export enum From {
  LOCAL = 'local',
  REMOTE = 'remote',
}

export type OnData = {
  channelId?: number; // 通道 id
  id: number; // 消息 id
  index: number; // 块序号
  about: AboutStatus; // 是否在暂停
  status: OnDataStatus;
  type: DataType;
  progress: number; // 0-100, 0 表示准备好，100 表示完成
  speed: number; // 速度 字节/秒
  head: SynReadySignal;
  body: string;
  from: From;
};

export type SendData = {
  id: number;
  type: DataType;
  head: Partial<SynReadySignal>;
  body: string;
};
