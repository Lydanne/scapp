import Taro, { type UDPSocket } from '@tarojs/taro';

import { toBinary } from '../plink/shared';
import { Emitter } from '../shared/emitter';

const udp = Taro.createUDPSocket();

export class UdpSocket {
  sender = new Emitter<(e: UDPSocket.send.Option) => any>();
  receiver = new Emitter<(e: UDPSocket.onMessage.CallbackResult) => any>();

  errorEmitter = new Emitter<(e: any) => any>();

  port: number;

  listen(cb: any) {
    if (this.port) {
      cb(this.port);
      return this;
    }
    const port = udp.bind(undefined as unknown as number);
    this.port = port;
    udp.onMessage((e) => {
      this.receiver.emitSync(e);
    });
    udp.onError((e) => {
      this.errorEmitter.emit(e);
    });
    this.sender.on((option) => {
      udp.send(option);
    });
    cb(port);
    return this;
  }
}
