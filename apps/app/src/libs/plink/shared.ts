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
