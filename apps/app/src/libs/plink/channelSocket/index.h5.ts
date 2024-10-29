import { type UDPSocket } from '@tarojs/taro';
import { Channel, invoke } from '@tauri-apps/api/core';

import { Emitter } from '../../shared/emitter';

export class ChannelSocket {
  sender = new Emitter<(e: UDPSocket.send.Option) => any>();
  receiver = new Emitter<(e: UDPSocket.onMessage.CallbackResult) => any>();

  errorEmitter = new Emitter<(e: any) => any>();

  port: number;

  listen(cb: any) {
    if (this.port) {
      cb(this.port);
      return this;
    }

    invoke<any>('channel_socket_bind').then((res) => {
      console.log('[ChannelSocket] listen native', res);
      let [_, port] = res.split(':');
      this.sender.on((e) => {
        invoke('channel_socket_send', {
          socketIp: `${e.address}:${e.port}`,
          message: e.message,
        });
      });

      const onEvent = new Channel<any>();
      onEvent.onmessage = (ev) => {
        // console.log(`got event`, Date.now() - ev.ts);
        const message = ev.message;
        const [address, port] = ev.remoteInfo.split(':');
        const remoteInfo = {
          address: address,
          port: Number(port),
          family: 'IPv4',
        };
        this.receiver.emit({
          message: message,
          remoteInfo: remoteInfo,
          localInfo: {
            address: '127.0.0.1',
            port: Number(port),
            family: 'IPv4',
            size: 1400,
          },
          errMsg: '',
        });
      };
      invoke('channel_socket_receive', {
        onEvent: onEvent,
      });
      cb(Number(port));
    });

    return this;
  }
}
