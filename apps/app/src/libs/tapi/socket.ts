import Taro, { type UDPSocket } from '@tarojs/taro';

import { randId } from '../plink/shared';
import { Emitter } from '../shared/emitter';

const udp = Taro.createUDPSocket();

const CHUNK_SIZE = 1024;

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
    // wx.packetBufferMap = packetBufferMap;

    udp.onMessage((e) => {
      const message = e.message;
      const packet = unwrapSubPacket(message);

      const packetBuffers = packetBufferMap.has(packet.id)
        ? (packetBufferMap.get(packet.id) as ArrayBuffer[])
        : [];
      packetBufferMap.set(packet.id, packetBuffers);

      packetBuffers.push(packet.message);
      // console.log('onMessage', packetBufferMap);

      if (packetBuffers.length === packet.length) {
        const message = mergePacket(packetBuffers);
        this.receiver.emitSync({ ...e, message });
        packetBufferMap.delete(packet.id);
      }
    });
    udp.onError((e) => {
      this.errorEmitter.emit(e);
    });
    this.sender.on((option) => {
      const message = option.message;
      // console.log('send', option, !(message instanceof ArrayBuffer));

      if (typeof message === 'string') {
        udp.send(option);
        return this;
      }
      const id = randId();
      const packets = splitPacket(message, CHUNK_SIZE);
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
  const packet = new Uint8Array([
    ...u32ToU8(id),
    ...u32ToU8(length),
    ...u32ToU8(index),
    ...data,
  ]);
  return packet;
}

type Packet = {
  id: number;
  index: number;
  length: number;
  message: ArrayBuffer;
};

function unwrapSubPacket(packet: ArrayBuffer): Packet {
  const data = new Uint8Array(packet);
  const id = u8ToU32(data.slice(0, 4));
  const length = u8ToU32(data.slice(4, 8));
  const index = u8ToU32(data.slice(8, 12));
  const message = data.slice(12).buffer;
  return { id, length, index, message };
}

function u32ToU8(value: number): Uint8Array {
  return new Uint8Array([
    (value >> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ]);
}

function u8ToU32(value: Uint8Array): number {
  return (value[0] << 24) | (value[1] << 16) | (value[2] << 8) | value[3];
}
