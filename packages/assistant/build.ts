import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts', 'src/sseServer/server.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  bundle: true,
  minify: true,
  platform: 'node',
  tsconfig: 'tsconfig.json',
  keepNames: true,
});
