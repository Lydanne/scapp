interface WasmInstance {
  memory: WebAssembly.Memory;
  __wbindgen_malloc: (size: number, align: number) => number;
  __wbindgen_realloc: (
    ptr: number,
    oldSize: number,
    newSize: number,
    align: number,
  ) => number;
  __wbindgen_free: (ptr: number, size: number, align: number) => void;
  __wbindgen_export_0: WebAssembly.Table;
  __wbindgen_start?: () => void;
  decode: (ptr: number, len: number) => [number, number];
  encode: (ptr: number, len: number) => [number, number];
  str_encode: (ptr: number, len: number) => [number, number];
  str_decode: (ptr: number, len: number) => [number, number];
}

interface GlobalObject {
  wasm?: WasmInstance;
}

const g: GlobalObject = {};

let cachedUint8ArrayMemory0: Uint8Array | null = null;

function getUint8ArrayMemory0(): Uint8Array {
  if (
    cachedUint8ArrayMemory0 === null ||
    cachedUint8ArrayMemory0.byteLength === 0
  ) {
    if (!g.wasm) throw new Error('WASM module not initialized');
    cachedUint8ArrayMemory0 = new Uint8Array(g.wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(
  arg: Uint8Array,
  malloc: (size: number, align: number) => number,
): number {
  if (!g.wasm) throw new Error('WASM module not initialized');
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

const cachedTextDecoder = new TextDecoder('utf-8', {
  ignoreBOM: true,
  fatal: true,
});

cachedTextDecoder.decode();

function getStringFromWasm0(ptr: number, len: number): string {
  if (!g.wasm) throw new Error('WASM module not initialized');
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  );
}

/**
 * @param {Uint8Array} body
 * @returns {string}
 */
export function decode(body: Uint8Array): string {
  if (!g.wasm) throw new Error('WASM module not initialized');
  let deferred2_0: number = 0;
  let deferred2_1: number = 0;
  try {
    const ptr0 = passArray8ToWasm0(body, g.wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = g.wasm.decode(ptr0, len0);
    deferred2_0 = ret[0];
    deferred2_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    g.wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
  }
}

// 简单的 TextEncoder polyfill
function encodeUTF8(str: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let charCode = str.charCodeAt(i);
    if (charCode < 0x80) {
      bytes.push(charCode);
    } else if (charCode < 0x800) {
      bytes.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
    } else if (charCode < 0xd800 || charCode >= 0xe000) {
      bytes.push(
        0xe0 | (charCode >> 12),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    } else {
      i++;
      charCode =
        0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (charCode >> 18),
        0x80 | ((charCode >> 12) & 0x3f),
        0x80 | ((charCode >> 6) & 0x3f),
        0x80 | (charCode & 0x3f),
      );
    }
  }
  return new Uint8Array(bytes);
}

interface EncodeStringResult {
  read: number;
  written: number;
}

const encodeString = function (
  arg: string,
  view: Uint8Array,
): EncodeStringResult {
  const buf = encodeUTF8(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length,
  };
};

function passStringToWasm0(
  arg: string,
  malloc: (size: number, align: number) => number,
  realloc?: (
    ptr: number,
    oldSize: number,
    newSize: number,
    align: number,
  ) => number,
): number {
  if (!g.wasm) throw new Error('WASM module not initialized');
  if (realloc === undefined) {
    const buf = encodeUTF8(arg);
    const ptr = malloc(buf.length, 1) >>> 0;
    getUint8ArrayMemory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr;
  }

  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;

  const mem = getUint8ArrayMemory0();

  let offset = 0;

  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 0x7f) break;
    mem[ptr + offset] = code;
  }

  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, (len = offset + arg.length * 3), 1) >>> 0;
    const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    offset += ret.written;
    ptr = realloc(ptr, len, offset, 1) >>> 0;
  }

  WASM_VECTOR_LEN = offset;
  return ptr;
}

function getArrayU8FromWasm0(ptr: number, len: number): Uint8Array {
  if (!g.wasm) throw new Error('WASM module not initialized');
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

/**
 * @param {string} body
 * @returns {Uint8Array}
 */
export function encode(body: string): Uint8Array {
  if (!g.wasm) throw new Error('WASM module not initialized');
  const ptr0 = passStringToWasm0(
    body,
    g.wasm.__wbindgen_malloc,
    g.wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = g.wasm.encode(ptr0, len0);
  const v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
  g.wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
  return v2;
}

/**
 * @param {string} body
 * @returns {string}
 */
export function str_encode(body: string): string {
  if (!g.wasm) throw new Error('WASM module not initialized');
  let deferred2_0: number = 0;
  let deferred2_1: number = 0;
  try {
    const ptr0 = passStringToWasm0(
      body,
      g.wasm.__wbindgen_malloc,
      g.wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = g.wasm.str_encode(ptr0, len0);
    deferred2_0 = ret[0];
    deferred2_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    g.wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
  }
}

/**
 * @param {string} body
 * @returns {string}
 */
export function str_decode(body: string): string {
  if (!g.wasm) throw new Error('WASM module not initialized');
  let deferred2_0: number = 0;
  let deferred2_1: number = 0;
  try {
    const ptr0 = passStringToWasm0(
      body,
      g.wasm.__wbindgen_malloc,
      g.wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = g.wasm.str_decode(ptr0, len0);
    deferred2_0 = ret[0];
    deferred2_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    g.wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
  }
}

interface WasmImports {
  wbg: {
    __wbindgen_init_externref_table: () => void;
  };
}

function __wbg_get_imports(): WasmImports {
  const imports: WasmImports = {
    wbg: {
      __wbindgen_init_externref_table: function () {
        if (!g.wasm) throw new Error('WASM module not initialized');
        const table = g.wasm.__wbindgen_export_0;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
      },
    },
  };
  return imports;
}

function __wbg_init_memory(
  imports: WasmImports,
  memory?: WebAssembly.Memory,
): void {}

interface WasmInstanceWithExports {
  instance: {
    exports: WasmInstance;
  };
}

function __wbg_finalize_init(
  instance: WasmInstanceWithExports,
  module: WebAssembly.Module,
): WasmInstance {
  g.wasm = instance.instance.exports;
  cachedUint8ArrayMemory0 = null;

  if (g.wasm && typeof g.wasm.__wbindgen_start === 'function') {
    g.wasm.__wbindgen_start();
  }
  return g.wasm;
}

declare const WXWebAssembly: {
  instantiate: (
    module: WebAssembly.Module,
    imports: WasmImports,
  ) => Promise<WasmInstanceWithExports>;
};

export async function init(module: WebAssembly.Module): Promise<WasmInstance> {
  if (g.wasm !== undefined) return g.wasm;

  const imports = __wbg_get_imports();
  __wbg_init_memory(imports);

  const instance = await WXWebAssembly.instantiate(module, imports);
  console.log('WASM', instance);

  return __wbg_finalize_init(instance, module);
}
