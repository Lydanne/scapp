import loadWasm from './wasm/index';

export class Base64 {
  static isReady = false;
  static wasm = loadWasm();

  static async init(wasmPath = '/base64_rs_bg.wasm') {
    if (this.isReady) return;
    await Base64.wasm.init(wasmPath);
    this.isReady = true;
  }

  static async encode(input: string): Promise<Uint8Array> {
    await this.init();
    return await Base64.wasm.encode(input);
  }

  static async decode(input: Uint8Array): Promise<string> {
    await this.init();
    return await Base64.wasm.decode(input);
  }

  static async strEncode(input: string): Promise<string> {
    await this.init();
    return await Base64.wasm.str_encode(input);
  }

  static async strDecode(input: string): Promise<string> {
    await this.init();
    return await Base64.wasm.str_decode(input);
  }
}
