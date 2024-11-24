import { BinaryReader, BinaryWriter } from '@protobuf-ts/runtime';

import type { Constructor } from '../shared/type-tools';

export function toBinary<T>(Context: any, message: Partial<T>): ArrayBuffer {
  return Context.toBinary(message, {
    writeUnknownFields: false,
    writerFactory: () => {
      return new BinaryWriter({
        encode: encodeUTF8,
      });
    },
  });
}

export function fromBinary<T>(Context: any, buffer: ArrayBuffer): T {
  return (Context as any).fromBinary(new Uint8Array(buffer), {
    readUnknownField: false,
    readerFactory: (bytes) => {
      return new BinaryReader(bytes, {
        decode: decodeUTF8,
      });
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

// 简单的 TextEncoder polyfill
export function encodeUTF8(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(
        0xe0 | (charCode >> 12),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    } else {
      i++;
      charCode =
        0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

// 简单的 TextDecoder polyfill
export function decodeUTF8(bytes: Uint8Array): string {
  let str = '';
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];
    if (byte < 0x80) {
      str += String.fromCharCode(byte);
      i++;
    } else if (byte < 0xe0) {
      str += String.fromCharCode(((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f));
      i += 2;
    } else if (byte < 0xf0) {
      str += String.fromCharCode(
        ((byte & 0x0f) << 12) |
          ((bytes[i + 1] & 0x3f) << 6) |
          (bytes[i + 2] & 0x3f),
      );
      i += 3;
    } else {
      const codePoint =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1] & 0x3f) << 12) |
        ((bytes[i + 2] & 0x3f) << 6) |
        (bytes[i + 3] & 0x3f);
      str += String.fromCodePoint(codePoint);
      i += 4;
    }
  }
  return str;
}
