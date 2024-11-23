let wasm: any;

let cachedUint8ArrayMemory0: Uint8Array | null = null;

function getUint8ArrayMemory0(): Uint8Array {
  if (
    cachedUint8ArrayMemory0 === null ||
    cachedUint8ArrayMemory0.byteLength === 0
  ) {
    cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8ArrayMemory0;
}

let WASM_VECTOR_LEN = 0;

function passArray8ToWasm0(
  arg: Uint8Array,
  malloc: (size: number, align: number) => number,
): number {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8ArrayMemory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}

interface TextDecoderOptions {
  ignoreBOM?: boolean;
  fatal?: boolean;
}

const cachedTextDecoder =
  typeof TextDecoder !== 'undefined'
    ? new TextDecoder('utf-8', {
        ignoreBOM: true,
        fatal: true,
      } as TextDecoderOptions)
    : {
        decode: () => {
          throw Error('TextDecoder not available');
        },
      };

if (typeof TextDecoder !== 'undefined') {
  cachedTextDecoder.decode();
}

function getStringFromWasm0(ptr: number, len: number): string {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(
    getUint8ArrayMemory0().subarray(ptr, ptr + len),
  );
}

export function decode(body: Uint8Array): string {
  let deferred2_0 = 0;
  let deferred2_1 = 0;
  try {
    const ptr0 = passArray8ToWasm0(body, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.decode(ptr0, len0);
    deferred2_0 = ret[0];
    deferred2_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
  }
}

interface TextEncoderLike {
  encode(input?: string): Uint8Array;
  encodeInto?(
    input: string,
    dest: Uint8Array,
  ): { read: number; written: number };
}

const cachedTextEncoder: TextEncoderLike =
  typeof TextEncoder !== 'undefined'
    ? new TextEncoder()
    : {
        encode: () => {
          throw Error('TextEncoder not available');
        },
      };

interface EncodeResult {
  read: number;
  written: number;
}

const encodeString =
  typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg: string, view: Uint8Array): EncodeResult {
        return cachedTextEncoder.encodeInto!(arg, view);
      }
    : function (arg: string, view: Uint8Array): EncodeResult {
        const buf = cachedTextEncoder.encode(arg);
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
  if (realloc === undefined) {
    const buf = cachedTextEncoder.encode(arg);
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
  ptr = ptr >>> 0;
  return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

export function encode(body: string): Uint8Array {
  const ptr0 = passStringToWasm0(
    body,
    wasm.__wbindgen_malloc,
    wasm.__wbindgen_realloc,
  );
  const len0 = WASM_VECTOR_LEN;
  const ret = wasm.encode(ptr0, len0);
  const v2 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
  wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
  return v2;
}

export function str_encode(body: string): string {
  let deferred2_0 = 0;
  let deferred2_1 = 0;
  try {
    const ptr0 = passStringToWasm0(
      body,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.str_encode(ptr0, len0);
    deferred2_0 = ret[0];
    deferred2_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
  }
}

export function str_decode(body: string): string {
  let deferred2_0 = 0;
  let deferred2_1 = 0;
  try {
    const ptr0 = passStringToWasm0(
      body,
      wasm.__wbindgen_malloc,
      wasm.__wbindgen_realloc,
    );
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.str_decode(ptr0, len0);
    deferred2_0 = ret[0];
    deferred2_1 = ret[1];
    return getStringFromWasm0(ret[0], ret[1]);
  } finally {
    wasm.__wbindgen_free(deferred2_0, deferred2_1, 1);
  }
}

interface WasmExports {
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
  __wbindgen_start: () => void;
  decode: (ptr: number, len: number) => [number, number];
  encode: (ptr: number, len: number) => [number, number];
  str_encode: (ptr: number, len: number) => [number, number];
  str_decode: (ptr: number, len: number) => [number, number];
}

interface WasmInstance {
  exports: WasmExports;
}

interface WasmImports {
  [key: string]: {
    [key: string]: Function;
  };
}

async function __wbg_load(
  module: Response | BufferSource | WebAssembly.Module,
  imports: WasmImports,
): Promise<{ instance: WasmInstance; module: WebAssembly.Module }> {
  if (typeof Response === 'function' && module instanceof Response) {
    if (typeof WebAssembly.instantiateStreaming === 'function') {
      try {
        const result = await WebAssembly.instantiateStreaming(module, imports);
        return result as unknown as {
          instance: WasmInstance;
          module: WebAssembly.Module;
        };
      } catch (e) {
        if (module.headers.get('Content-Type') != 'application/wasm') {
          console.warn(
            '`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n',
            e,
          );
        } else {
          throw e;
        }
      }
    }

    const bytes = await module.arrayBuffer();
    const result = await WebAssembly.instantiate(bytes, imports);
    return result as unknown as {
      instance: WasmInstance;
      module: WebAssembly.Module;
    };
  } else {
    const result = await WebAssembly.instantiate(module, imports);
    return {
      instance:
        result instanceof WebAssembly.Instance
          ? (result as unknown as WasmInstance)
          : ((result as WebAssembly.WebAssemblyInstantiatedSource)
              .instance as unknown as WasmInstance),
      module:
        module instanceof WebAssembly.Module
          ? module
          : (result as unknown as WebAssembly.WebAssemblyInstantiatedSource)
              .module,
    };
  }
}

function __wbg_get_imports(): WasmImports {
  const imports: WasmImports = {
    wbg: {
      __wbindgen_init_externref_table: function () {
        const table = wasm.__wbindgen_export_0;
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

function __wbg_finalize_init(
  instance: WasmInstance,
  module: WebAssembly.Module,
): WasmExports {
  wasm = instance.exports;
  (__wbg_init as any).__wbindgen_wasm_module = module;
  cachedUint8ArrayMemory0 = null;

  wasm.__wbindgen_start();
  return wasm;
}

type SyncInitInput = BufferSource | WebAssembly.Module;

export async function init(
  module: SyncInitInput | { module: SyncInitInput },
): Promise<WasmExports> {
  if (wasm !== undefined) return wasm;

  let moduleToUse!: SyncInitInput;
  if (typeof module !== 'undefined') {
    if (Object.getPrototypeOf(module) === Object.prototype) {
      moduleToUse = (module as { module: SyncInitInput }).module;
    } else {
      moduleToUse = await fetch('./base64_rs_bg.wasm').then((res) =>
        res.arrayBuffer(),
      );
    }
  }

  const imports = __wbg_get_imports();

  __wbg_init_memory(imports);

  if (!(moduleToUse instanceof WebAssembly.Module)) {
    // Ensure moduleToUse is an ArrayBuffer or ArrayBufferView before creating Module
    if (
      !(moduleToUse instanceof ArrayBuffer) &&
      !ArrayBuffer.isView(moduleToUse)
    ) {
      throw new Error('Module must be an ArrayBuffer or ArrayBufferView');
    }
    moduleToUse = new WebAssembly.Module(moduleToUse);
  }

  const instance = new WebAssembly.Instance(
    moduleToUse,
    imports as any,
  ) as unknown as WasmInstance;

  return __wbg_finalize_init(instance, moduleToUse);
}

type InitInput =
  | RequestInfo
  | URL
  | Response
  | BufferSource
  | WebAssembly.Module;

async function __wbg_init(
  module_or_path?: InitInput | { module_or_path?: InitInput },
): Promise<WasmExports> {
  if (wasm !== undefined) return wasm;

  let moduleToUse: InitInput | undefined;
  if (typeof module_or_path !== 'undefined') {
    if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
      moduleToUse = (module_or_path as { module_or_path?: InitInput })
        .module_or_path;
    } else {
      moduleToUse = module_or_path as InitInput;
      console.warn(
        'using deprecated parameters for the initialization function; pass a single object instead',
      );
    }
  }
  if (typeof moduleToUse === 'undefined') {
    moduleToUse = 'base64_rs_bg.wasm';
  }

  const imports = __wbg_get_imports();

  if (
    typeof moduleToUse === 'string' ||
    (typeof Request === 'function' && moduleToUse instanceof Request) ||
    (typeof URL === 'function' && moduleToUse instanceof URL)
  ) {
    moduleToUse = fetch(moduleToUse);
  }

  __wbg_init_memory(imports);

  const { instance, module } = await __wbg_load(await moduleToUse, imports);

  return __wbg_finalize_init(instance, module);
}

export default __wbg_init;
