import { type UDPSocket } from '@tarojs/taro';

import { Emitter } from 'src/libs/shared/emitter';

export class UdpSocket {
  sender = new Emitter<(e: UDPSocket.send.Option) => any>();
  receiver = new Emitter<(e: UDPSocket.onMessage.CallbackResult) => any>();
  errorEmitter = new Emitter<(e: any) => any>();
  native = new UdpSocketNative();

  listen(cb: (port: number) => void) {
    this.native.listen((port) => {
      cb(port);
    });
    return this;
  }
}

export class UdpSocketNative {
  sender = new Emitter<(e: UDPSocket.send.Option) => any>();
  receiver = new Emitter<(e: UDPSocket.onMessage.CallbackResult) => any>();
  errorEmitter = new Emitter<(e: any) => any>();

  listen(cb: (port: number) => void) {
    window.invoke('socket_bind').then((res) => {
      console.log('[UdpSocket] listen native', res);
      let [_, port] = res.split(':');
      cb(Number(port));
    });
    return this;
  }
}
