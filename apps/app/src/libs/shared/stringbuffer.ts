/// js 实现字符串转 Uint8Array

export class StringBuffer {
  static encode(str: string): Uint8Array {
    const buf = new ArrayBuffer(str.length * 2); // 每个字符使用2字节
    const bufView = new Uint16Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return new Uint8Array(buf);
  }

  static decode(buf: Uint8Array): string {
    const uint16Array = new Uint16Array(buf.buffer);
    return String.fromCharCode.apply(null, uint16Array);
  }
}
