/// js 实现字符串转 Uint8Array

export class StringBuffer {
  static encode(str: string): Uint8Array {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return bufView;
  }

  static decode(buf: Uint8Array): string {
    return String.fromCharCode.apply(null, buf);
  }
}
