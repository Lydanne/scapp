import Taro, { type UDPSocket } from '@tarojs/taro';

import { randId } from '../plink/shared';
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

    const packetBufferMap = new Map<number, ArrayBuffer[]>();
    udp.onMessage((e) => {
      console.log('onMessage', e);

      const message = e.message;
      const packet = unwrapSubPacket(message);
      const buffer = packetBufferMap.get(packet.id) || [];
      buffer[packet.index] = packet.message;
      packetBufferMap.set(packet.id, buffer);
      if (buffer.length === packet.length) {
        const message = mergePacket(buffer);
        this.receiver.emitSync({ ...e, message });
        packetBufferMap.delete(packet.id);
      }
    });
    udp.onError((e) => {
      this.errorEmitter.emit(e);
    });
    this.sender.on((option) => {
      const message = option.message;
      console.log('send', option, !(message instanceof ArrayBuffer));

      if (typeof message === 'string') {
        udp.send(option);
        return this;
      }
      const id = randId();
      const packets = splitPacket(message, 1024);
      for (let i = 0; i < packets.length; i++) {
        const subPacket = wrapSubPacket(id, i, packets.length, packets[i]);
        udp.send({ ...option, message: subPacket });
      }
    });
    cb(port);
    return this;
  }
}

function splitPacket(message: ArrayBuffer, size: number): ArrayBuffer[] {
  const packets: ArrayBuffer[] = [];
  const data = new Uint8Array(message);
  let offset = 0;

  while (offset < data.length) {
    const chunk = data.slice(offset, offset + size);
    packets.push(chunk.buffer);
    offset += size;
  }

  return packets;
}

function mergePacket(packets: ArrayBuffer[]): ArrayBuffer {
  const totalLength = packets.reduce(
    (acc, packet) => acc + packet.byteLength,
    0,
  );
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const packet of packets) {
    result.set(new Uint8Array(packet), offset);
    offset += packet.byteLength;
  }

  return result.buffer;
}

function wrapSubPacket(
  id: number,
  index: number,
  length: number,
  message: ArrayBuffer,
): ArrayBuffer {
  const data = new Uint8Array(message);
  const packet = new Uint8Array([id, length, index, ...data]);
  return packet;
}

function unwrapSubPacket(packet: ArrayBuffer): {
  id: number;
  index: number;
  length: number;
  message: ArrayBuffer;
} {
  const data = new Uint8Array(packet);
  const id = data[0];
  const length = data[1];
  const index = data[2];
  const message = data.slice(3).buffer;
  return { id, length, index, message };
}
