export type Plink = {
  version?: number; // 2 Byte
  uuid: string; // 36 Byte offset 2
  inip: string; // 32 Byte offset 38
  ts: number; // 8 Byte offset 70
};
export function encode(plink: Plink): string {
  return JSON.stringify(['Plink', 1, plink.uuid, plink.inip, plink.ts]);
}

export function decode(buffer: string): Plink {
  const [_, version, uuid, inip, ts] = JSON.parse(buffer);
  return { version, uuid, inip, ts };
}
