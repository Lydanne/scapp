// uuid.ts

// 生成随机数的函数
function getRandomValues(buf: Uint8Array) {
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

// 生成 UUID v4 的函数
export function uuidv4(): string {
  const buf = new Uint8Array(16);
  getRandomValues(buf);

  // 设置版本号和变种
  buf[6] = (buf[6] & 0x0f) | 0x40; // 设置版本号为 4
  buf[8] = (buf[8] & 0x3f) | 0x80; // 设置变种为 10

  const hex = Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16,
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// 导出生成 UUID 的函数
export function uuid(): string {
  return uuidv4();
}
