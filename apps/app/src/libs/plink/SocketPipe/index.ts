import { type UDPSocket } from '@tarojs/taro';

import { Emitter } from '../../shared/emitter';
import { UdpSocket } from '../../tapi/udpsocket/index';

const CHUNK_SIZE = 1300;

export class SocketPipe {
  sender = new Emitter<(e: UDPSocket.send.Option) => any>();
  receiver = new Emitter<(e: UDPSocket.onMessage.CallbackResult) => any>();

  errorEmitter = new Emitter<(e: any) => any>();

  port: number;

  udp: UdpSocket = new UdpSocket();

  listen(cb: any) {
    if (this.port) {
      cb(this.port);
      return this;
    }
    this.udp.listen((port) => {
      this.port = port;

      let packets: Packet[] = [];
      // wx.packets = packets;

      this.udp.receiver.on(async (e) => {
        const message = e.message;
        const packet = unwrapSubPacket(message);

        packets.push(packet);

        if (packets.length >= packet.length) {
          const filterPacketBuffers: ArrayBuffer[] = [];
          let filterCount = 0;
          for (let i = 0; i < packets.length; i++) {
            const pack = packets[i];
            if (pack.id === packet.id) {
              filterPacketBuffers[pack.index] = pack.message;
              filterCount++;
            }
          }
          if (filterCount !== packet.length) {
            // console.log(
            //   'onMessage Error',
            //   filterPacketBuffers.length,
            //   packet.length,
            //   packets,
            // );
            return;
          }
          try {
            const message = mergePacket(filterPacketBuffers);
            // console.log('[UdpSocket]', 'receiver', packet);
            await this.receiver.emit({ ...e, message });
            packets = [];
          } catch (error) {
            console.log(
              'onMessage mergePacket Error',
              String(error),
              filterPacketBuffers,
              packets,
            );
          }
        }
      });
      this.udp.errorEmitter.on((e) => {
        this.errorEmitter.emitSync(e);
      });
      let uniseq = 0;
      this.sender.on(async (option) => {
        const message = option.message;
        // console.log('[UdpSocket]', 'sender', option);

        if (typeof message === 'string') {
          await this.udp.sender.emit(option);
          return;
        }
        const id = uniseq++;
        const packets = splitPacket(message, CHUNK_SIZE);
        for (let i = 0; i < packets.length; i++) {
          const subPacket = wrapSubPacket(id, i, packets.length, packets[i]);
          // console.log('[UdpSocket]', 'udpSend', id, i, packets.length);
          await this.udp.sender.emit({ ...option, message: subPacket });
        }
        if (uniseq > Number.MAX_SAFE_INTEGER) {
          uniseq = 0;
        }
      });
      cb(port);
    });

    return this;
  }

  close(cb: () => any) {
    // this.udp.close(cb);
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
