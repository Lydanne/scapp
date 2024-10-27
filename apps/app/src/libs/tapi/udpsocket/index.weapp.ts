import Taro, { type UDPSocket } from '@tarojs/taro';

import { Emitter } from 'src/libs/shared/emitter';

export class UdpSocket {
  udp = Taro.createUDPSocket();

  sender = new Emitter<(e: UDPSocket.send.Option) => any>();
  receiver = new Emitter<(e: UDPSocket.onMessage.CallbackResult) => any>();
  errorEmitter = new Emitter<(e: any) => any>();

  listen(cb: (port: number) => void) {
    const port = this.udp.bind(undefined as unknown as number);
    this.udp.onMessage((e) => {
      this.receiver.emitSync(e);
    });
    this.sender.on((e) => {
      this.udp.send(e);
    });
    this.udp.onError((e) => {
      this.errorEmitter.emitSync(e);
    });
    cb(port);
    return this;
  }
}
