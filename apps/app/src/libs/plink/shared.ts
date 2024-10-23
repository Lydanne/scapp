import { TextDecoder } from '@polkadot/x-textdecoder';
import { TextEncoder } from '@polkadot/x-textencoder';
import { BinaryReader, BinaryWriter } from '@protobuf-ts/runtime';

import type { Constructor } from '../shared/type-tools';

export function toBinary<T>(Context: any, message: Partial<T>): ArrayBuffer {
  return Context.toBinary(message, {
    writeUnknownFields: false,
    writerFactory: () => {
      return new BinaryWriter(new TextEncoder());
    },
  });
}

export function fromBinary<T>(Context: any, buffer: ArrayBuffer): T {
  return (Context as any).fromBinary(new Uint8Array(buffer), {
    readUnknownField: false,
    readerFactory: (bytes) => {
      return new BinaryReader(bytes, new TextDecoder('utf-8'));
    },
  });
}

export function randId(): number {
  const id = (Date.now() % 1000000) * 1000 + Math.floor(Math.random() * 1000);
  return id;
}

export function rand(begin: number, end: number) {
  return Math.floor(Math.random() * (end - begin)) + begin;
}

export function mergeArrayBuffer(buffers: ArrayBufferLike[]): ArrayBuffer {
  if (buffers.length === 0) {
    return new ArrayBuffer(0);
  }

  const length = buffers.reduce((prev, curr) => prev + curr.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  for (const buffer of buffers) {
    result.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return result.buffer;
}
