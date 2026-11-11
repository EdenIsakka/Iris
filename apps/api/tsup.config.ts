import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node22',
  clean: true,
  // Los paquetes internos exportan TypeScript fuente: se empaquetan dentro del build.
  noExternal: [/^@finanzas\//],
});
