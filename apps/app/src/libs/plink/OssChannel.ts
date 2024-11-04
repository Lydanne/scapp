import { IChannel } from './IChannel';
import { OssConnection } from './OssConnection';
import { randId } from './shared';
import { ChannelStatus, type SocketIP } from './types';

export class OssChannel extends IChannel<OssConnection> {
  async connect(socketIP: SocketIP): Promise<OssConnection> {
    const id = randId();
    const connection = new OssConnection({
      id: 0,
      status: ChannelStatus.init,
      socketIP,
      seq: 0,
    });
    return connection;
  }
  async disconnect(connection: OssConnection): Promise<boolean> {
    return Promise.resolve(true);
  }
  async listen(): Promise<number> {
    fetch('');
    return Promise.resolve(0);
  }
  async close(): Promise<void> {
    return Promise.resolve();
  }
}
