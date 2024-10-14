import { TextEncoder } from '@polkadot/x-textencoder';
import { BinaryWriter } from '@protobuf-ts/runtime';

import { uuid } from '../shared/uuid';
import { getLocalIPAddress } from '../tapi/net';
import { Plink } from './payload';

export async function getCurrentPlink(): Promise {
  const ip = await getLocalIPAddress();
  const inip = `${ip}:12305`;
  const uid = uuid();
  const ts = BigInt(Date.now());
  return Plink.toBinary(
    {
      version: 1,
      uuid: uid,
      inip,
      ts,
    },
    {
      writeUnknownFields: false,
      writerFactory: () => {
        return new BinaryWriter(new TextEncoder());
      },
    },
  );
}