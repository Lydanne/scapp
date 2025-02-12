import { Emitter } from 'src/libs/shared/emitter';

import { IConnection } from '../IChannel';
import { Mpsc } from '../Mpsc';
import type { OnData, SendData } from '../types';

export class NativeConnection extends IConnection {
  emData = new Emitter<(onData: OnData) => void>();
  emSend = new Emitter<
    (sendData: SendData, cb?: (onData: OnData) => void) => void
  >();
  constructor(data: any) {
    super(data);
  }
  send(data: SendData, cb?: (onData: OnData) => void): Promise<void> {
    this.emSend.emit(data, cb);
    return Promise.resolve();
  }
  on(cb: (data: OnData) => void): void {
    this.emData.on(cb);
  }
  close(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  about(msgId: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
