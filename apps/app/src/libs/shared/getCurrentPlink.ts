import { Plink } from '../plink/payload';
import { getLocalIPAddress } from '../tapi/net';
import { uuid } from './uuid';

export async function getCurrentPlink(): Promise {
  const ip = await getLocalIPAddress();
  const inip = `${ip}:12305`;
  return Plink.toBinary({
    version: 1,
    uuid: uuid(),
    inip,
    ts: BigInt(Date.now()),
  });
}
