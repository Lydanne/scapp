import { Channel, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import { IChannel } from '../IChannel';
import { randId } from '../shared';
import { ChannelStatus, type SocketIP } from '../types';
import { NativeConnection } from './NativeConnection';

export class NativeChannel extends IChannel<NativeConnection> {
  static listened: number = 0;
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
    listen('em_connection', (event) => {
      console.log('em_connection', event);
      this.emConnection.emit(new NativeConnection(event.payload));
    });
    let port = await invoke('native_channel_listen');
    this.emListen.emitLifeCycle(port as number);
    NativeChannel.listened = port as number;
    return port as number;
  }
  async close(): Promise<void> {
    return Promise.resolve();
  }
}
