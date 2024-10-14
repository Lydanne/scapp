import Taro from '@tarojs/taro';

export class UdpChannel {
  constructor() {}
  listen(callback: Function) {
    console.log('listen');
    const udp = Taro.createUDPSocket();
    const port = udp.bind(12305);
    console.log('port', port);
    udp.onMessage((res) => {
      console.log('onMessage', res);
    });
  }

  send(data: ArrayBuffer, ip: string, port: number) {
    const udp = Taro.createUDPSocket();
    udp.send({
      address: ip,
      port: port,
      message: data,
    });
  }
}

function parseMsg(msg: ArrayBuffer) {
  const dv = new DataView(msg);
  const len = dv.getUint32(0);
  const data = new Uint8Array(msg, 4, len);
  return data;
}
