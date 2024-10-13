import type { Plink } from '../plink';
import { getLocalIPAddress } from '../tapi/net';
import { uuid } from './uuid';

export async function getCurrentPlink(): Promise {
  const ip = await getLocalIPAddress();
  const inip = `${ip}:12305`;
  return {
    uuid: uuid(),
    inip,
    ts: Date.now(),
  };
}
