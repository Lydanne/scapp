import { Channel, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import { IChannel, type OnDisconnect } from '../IChannel';
import { DataType } from '../payload';
import { rand, randId } from '../shared';
import { ChannelStatus, type OnData, type SocketIP } from '../types';
import { NativeConnection } from './NativeConnection';

export class NativeChannel extends IChannel<NativeConnection> {
  static listened: number = 0;
  private connections: Map<number, NativeConnection> = new Map();
  async connect(socketIp: SocketIP): Promise<NativeConnection> {
    const id = randId();
    // const seq = rand(1, 100);
    // const connection = new NativeConnection({
    //   id,
    //   status: ChannelStatus.init,
    //   socketIP,
    //   seq,
    // });
    // this.connections.set(id, connection);
    // this.emConnection.emitLifeCycle(connection);
    invoke('native_channel_connect', {
      socketId: 'default',
      channelId: id,
      socketIp,
    });
    const [conn] = await this.emConnection.waitTimeout(5000);
    return conn;
  }
  async disconnect(connection: NativeConnection): Promise<boolean> {
    invoke('native_channel_disconnect', {
      socketId: 'default',
      channelId: connection.id,
    });
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
          cb?.(event);
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
            },
            body: data.body,
          },
          cbEvent,
        }).then((res) => {
          console.log('native_channel_send success', res);
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
    listen<OnDisconnect<NativeConnection>>('on_disconnect', (event) => {
      console.log('on_disconnect', event);
      const connection = this.connections.get(event.payload.connection.id!);
      if (connection) {
        connection.status = ChannelStatus.disconnected;
        this.emDisconnect.emitLifeCycle(event.payload);
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
