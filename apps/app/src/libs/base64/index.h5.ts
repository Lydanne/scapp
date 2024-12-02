export class Base64 {
  static async init() {
    // 在H5环境下不需要初始化
  }

  static async encode(input: string): Promise<Uint8Array> {
    // 将字符串转换为Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    // 转换为base64字符串
    const base64 = btoa(String.fromCharCode(...data));
    // 将base64字符串转回Uint8Array
    return Uint8Array.from(base64.split('').map((c) => c.charCodeAt(0)));
  }

  static async decode(input: Uint8Array): Promise<string> {
    // 将Uint8Array转换为base64字符串
    const base64 = String.fromCharCode(...input);
    // 解码base64
    const decoded = atob(base64);
    // 转换为原始字符串
    return new TextDecoder().decode(
      Uint8Array.from(decoded.split('').map((c) => c.charCodeAt(0))),
    );
  }

  static async strEncode(input: string): Promise<string> {
    // 直接使用btoa进行base64编码
    return btoa(input);
  }

  static async strDecode(input: string): Promise<string> {
    // 直接使用atob进行base64解码
    return atob(input);
  }
}
