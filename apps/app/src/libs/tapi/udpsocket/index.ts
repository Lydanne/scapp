import Taro, { type UDPSocket } from '@tarojs/taro';

import { Emitter } from 'src/libs/shared/emitter';

export class UdpSocket {
  sender = new Emitter<(e: UDPSocket.send.Option) => any>();
  receiver = new Emitter<(e: UDPSocket.onMessage.CallbackResult) => any>();
  errorEmitter = new Emitter<(e: any) => any>();

  listen(cb: (port: number) => void) {
    console.log('[UdpSocket] listen not supported');
    return this;
  }
}
