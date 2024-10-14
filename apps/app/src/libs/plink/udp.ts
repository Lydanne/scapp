import Taro from '@tarojs/taro';

const udp = Taro.createUDPSocket();

export class UdpChannel {
  constructor() {}
  listen(callback: Function) {
    console.log('listen');
    const port = udp.bind(undefined as any);
    console.log('port', port);
    udp.onMessage((res) => {
      console.log('onMessage', res);
      callback(res);
    });
    udp.onError((err) => {
      console.log('onError', err);
    });
    return port;
  }

  send(data: any, ip: string, port: number) {
    udp.send({
      address: ip,
      port: port,
      message: data,
    });
  }
}
