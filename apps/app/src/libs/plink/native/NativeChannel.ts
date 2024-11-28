import { Channel, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import { IChannel } from '../IChannel';
import { DataType } from '../payload';
import { randId } from '../shared';
import { ChannelStatus, type OnData, type SocketIP } from '../types';
import { NativeConnection } from './NativeConnection';

export class NativeChannel extends IChannel<NativeConnection> {
  static listened: number = 0;
  private connections: Map<number, NativeConnection> = new Map();
  async connect(socketIP: SocketIP): Promise<NativeConnection> {
    const id = randId();
    const connection = new NativeConnection({
      id: 0,
      status: ChannelStatus.init,
      socketIP,
      seq: 0,
    });
    return connection;
  }
  async disconnect(connection: NativeConnection): Promise<boolean> {
    return Promise.resolve(true);
  }
  async listen(): Promise<number> {
    if (NativeChannel.listened) {
      return NativeChannel.listened;
    }
    listen<NativeConnection>('on_connection', (event) => {
      console.log('on_connection', event);
      const connection = new NativeConnection(event.payload);
      this.connections.set(event.payload.id, connection);
      this.emConnection.emitLifeCycle(connection);
      connection.emSend.on((data, cb) => {
        console.log('emSend', data);
        const cbEvent = new Channel<any>();
        cbEvent.onmessage = (event) => {
          console.log('cbEvent', event);
          cb?.(event.payload);
        };
        invoke('native_channel_send', {
          socketId: 'default',
          channelId: connection.id,
          data: {
            id: data.id,
            type: data.type,
            head: {
              length: data.head.length ?? 0,
              size: data.head.size ?? 0,
              sign: data.head.sign ?? '',
              name: data.head.name ?? '',
              type: data.head.type ?? data.type,
            },
            body: data.body,
          },
          cbEvent,
        });
      });
    });
    listen<OnData>('on_data', (event) => {
      // console.log('on_data', event);
      const connection = this.connections.get(event.payload.channelId!);
      if (connection) {
        connection.emData.emit(event.payload);
      }
    });
    let port = await invoke('native_channel_listen', { socketId: 'default' });
    this.emListen.emitLifeCycle(port as number);
    NativeChannel.listened = port as number;
    return port as number;
  }
  async close(): Promise<void> {
    return Promise.resolve();
  }
}
