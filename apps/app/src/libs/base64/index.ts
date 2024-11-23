import { decode, encode, init, str_decode, str_encode } from './base64_rs';

export default async function () {
  const mod = await init('/base64_rs_bg.wasm');
  const res = str_encode('🤣');
  console.log(res);
  console.log(str_decode(res));
}
