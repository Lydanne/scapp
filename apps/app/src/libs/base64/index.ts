import * as wasm from './wasm';

export class Base64 {
  static isReady = false;

  static async init() {
    if (this.isReady) return;
    await wasm.init('/base64_rs_bg.wasm');
    this.isReady = true;
  }

  static async encode(input: string): Promise<Uint8Array> {
    await this.init();
    return await wasm.encode(input);
  }

  static async decode(input: Uint8Array): Promise<string> {
    await this.init();
    return await wasm.decode(input);
  }

  static async str_encode(input: string): Promise<string> {
    await this.init();
    return await wasm.str_encode(input);
  }

  static async str_decode(input: string): Promise<string> {
    await this.init();
    return await wasm.str_decode(input);
  }
}
