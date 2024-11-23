import * as wasm from './wasm';

export function encode(input: string): Uint8Array {
  return wasm.encode(input);
}

export function decode(input: Uint8Array): string {
  return wasm.decode(input);
}
