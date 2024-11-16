import { IConnection } from '../IChannel';
import type { OnData, SendData } from '../types';

export class OssConnection extends IConnection {
  send(data: SendData, cb?: (onData: OnData) => any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  on(cb: (data: OnData) => any): void {
    throw new Error('Method not implemented.');
  }
}
