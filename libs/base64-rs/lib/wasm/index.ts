import * as wasm from './index.h5';
import * as weapp from './index.weapp';

export default function loadWasm() {
  if (!globalThis || 'wx' in globalThis) {
    return weapp;
  }
  return wasm;
}
