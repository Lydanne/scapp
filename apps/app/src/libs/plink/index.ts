import { decode, encode } from 'base64-arraybuffer';

import { TextDecoder } from '@polkadot/x-textdecoder';
import { BinaryReader } from '@protobuf-ts/runtime';

import { getCurrentPlink } from './getCurrentPlink';
import { Plink } from './payload';

export async function getPlinkCode() {
  const data = await getCurrentPlink();
  const base64 = encode(data);
  return base64;
}

export function parsePlinkCode(base64: string): Plink {
  const plink = Plink.fromBinary(new Uint8Array(decode(base64)), {
    readUnknownField: false,
    readerFactory: (bytes) => {
      return new BinaryReader(bytes, new TextDecoder('utf-8'));
    },
  });

  return plink;
}
