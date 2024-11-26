import { defineConfig } from 'rolldown';

export default defineConfig([
  {
    input: 'lib/index.ts',
    output: {
      format: 'esm',
      file: 'base64-rs.esm.js',
    },
  },
  {
    input: 'lib/index.ts',
    output: {
      format: 'cjs',
      file: 'base64-rs.cjs.js',
    },
  },
]);
