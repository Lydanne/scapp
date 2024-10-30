import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import { Emitter } from '../../shared/emitter';
import {
  Channel,
  type DataAction,
  DataType,
  type DetectAction,
  type SyncAction,
} from '../payload';
import { fromBinary, toBinary } from '../shared';

export type SocketIP = `${string}:${number}`;

export enum ChannelStatus {
  init = 0,
  connecting = 1,
  connected = 2,
  disconnecting = 3,
  disconnected = 4,
}

export type ConnectionProps = {
  id: number;
  status: ChannelStatus;
  socketIP: SocketIP;
  seq: number;
};

export type OnData = {
  id: number;
  index: number;
  status: OnDataStatus;
  type: DataType;
  progress: number;
  speed: number;
  head: any;
  body: string;
};

export enum OnDataStatus {
  READY = 0,
  SENDING = 1,
  DONE = 2,
}

export type SendData = {
  id: number;
  type: DataType;
  head: any;
  body: string;
};

export enum OnDisconnectCode {
  SUCCESS = 0,
  ERROR = 1,
  DETECT_ERROR = 2,
}

export type OnDisconnect = {
  connection: Connection;
  code: OnDisconnectCode;
};

export class MpscChannel<T> {
  tx = new Emitter<(data: T) => any>();
  rx = new Emitter<(data: T) => any>();
}

export class Connection {
  id: number;
  status: ChannelStatus;
  socketIP: SocketIP;
  seq: number;

  dataMpsc = new MpscChannel<DataAction>();
  syncMpsc = new MpscChannel<SyncAction>();
  detectMpsc = new MpscChannel<DetectAction>();

  constructor(data: ConnectionProps) {
    this.id = data.id;
    this.status = data.status;
    this.socketIP = data.socketIP;
    this.seq = data.seq;
  }

  async send(data: SendData, cb?: (onData: OnData) => any) {
    const ts = Date.now();
    const message = toBinary(Channel, data);

    // 发送准备信号
    cb?.({
      id: data.id,
      index: 0,
      status: OnDataStatus.READY,
      type: data.type,
      progress: 0,
      speed: 0,
      head: data.head,
      body: '',
    });

    // 发送数据
    await invoke('udp_channel_send', {
      connectionId: this.id,
      data: {
        ...data,
        message,
      },
    });

    // 发送完成信号
    cb?.({
      id: data.id,
      index: 1,
      status: OnDataStatus.DONE,
      type: data.type,
      progress: 100,
      speed: message.byteLength / ((Date.now() - ts) / 1000),
      head: data.head,
      body: data.body,
    });
  }

  async on(cb: (data: OnData) => any) {
    // 监听来自 Rust 的数据事件
    await listen(`udp://connection/${this.id}/data`, (event: any) => {
      const data = fromBinary(Channel, event.payload.message);
      cb(data as OnData);
    });
  }

  async close() {
    await invoke('udp_channel_close_connection', {
      connectionId: this.id,
    });
  }
}

export class UdpChannel {
  static listened = 0;

  listenEmitter = new Emitter<(port: number) => any>();
  connectionEmitter = new Emitter<(connection: Connection) => any>();
  disconnectEmitter = new Emitter<(connection: OnDisconnect) => any>();

  constructor() {
    this.setupEventListeners();
  }

  private async setupEventListeners() {
    // 监听连接事件
    await listen('udp://connection', (event: any) => {
      const connection = new Connection(event.payload);
      this.connectionEmitter.emit(connection);
    });

    // 监听断开连接事件
    await listen('udp://disconnect', (event: any) => {
      this.disconnectEmitter.emit(event.payload);
    });
  }

  async listen() {
    if (UdpChannel.listened) {
      return this;
    }

    try {
      // 调用 Rust 实现的监听功能
      const port = await invoke<number>('udp_channel_listen');
      UdpChannel.listened = port;

      // 使用 emitLifeCycle 替代直接 emit
      this.listenEmitter.emitLifeCycle(port);

      return this;
    } catch (error) {
      throw new UdpChannelError(`Failed to listen: ${error}`);
    }
  }

  async connect(socketIP: SocketIP) {
    try {
      await invoke('udp_channel_connect', { socketIP });
    } catch (error) {
      throw new UdpChannelError(`Failed to connect: ${error}`);
    }
    return this;
  }

  async disconnect(id: number) {
    try {
      return await invoke<boolean>('udp_channel_disconnect', {
        connectionId: id,
      });
    } catch (error) {
      throw new UdpChannelError(`Failed to disconnect: ${error}`);
    }
  }
}

export class UdpChannelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UdpChannelError';
  }
}

// 创建单例实例
const udpChannel = new UdpChannel();

// 确保只调用一次 listen
const instance = udpChannel.listen();

export default instance;
