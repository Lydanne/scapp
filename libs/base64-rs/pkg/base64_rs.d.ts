/* tslint:disable */
/* eslint-disable */
/* @ts-nocheck */
/* prettier-ignore */
/**
 * @param {Uint8Array} body
 * @returns {string}
 */
export function decode(body: Uint8Array): string;
/**
 * @param {string} body
 * @returns {Uint8Array}
 */
export function encode(body: string): Uint8Array;
/**
 * @param {string} body
 * @returns {string}
 */
export function str_encode(body: string): string;
/**
 * @param {string} body
 * @returns {string}
 */
export function str_decode(body: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly decode: (a: number, b: number) => Array<number>;
  readonly encode: (a: number, b: number) => Array<number>;
  readonly str_encode: (a: number, b: number) => Array<number>;
  readonly str_decode: (a: number, b: number) => Array<number>;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
