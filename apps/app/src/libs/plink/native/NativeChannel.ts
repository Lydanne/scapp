import { Channel, invoke } from '@tauri-apps/api/core';

import { IChannel } from '../IChannel';
import { randId } from '../shared';
import { ChannelStatus, type SocketIP } from '../types';
import { NativeConnection } from './NativeConnection';

export class NativeChannel extends IChannel<NativeConnection> {
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
    const emConnection = new Channel<any>();
    emConnection.onmessage((data) => {
      console.log('emConnection', data);
    });
    let port = await invoke('native_channel_listen', {
      emConnection: emConnection,
    });
    this.emListen.emitLifeCycle(port as number);
    return port as number;
  }
  async close(): Promise<void> {
    return Promise.resolve();
  }
}
