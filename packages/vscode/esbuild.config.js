const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const isMinify = process.argv.includes('--minify');

const baseConfig = {
  bundle: true,
  sourcemap: !isMinify,
  minify: isMinify,
  alias: {
    '@code-squad/core': path.resolve(__dirname, '../core/dist'),
  },
};

async function build() {
  // Build extension
  await esbuild.build({
    ...baseConfig,
    entryPoints: ['./src/extension.ts'],
    outfile: './dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
  });

  // Build webview
  await esbuild.build({
    ...baseConfig,
    entryPoints: ['./src/adapters/inbound/ui/webview/webview-entry.ts'],
    outfile: './dist/webview.js',
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
  });

  console.log('Build complete');
}

if (isWatch) {
  // Watch mode
  Promise.all([
    esbuild.context({
      ...baseConfig,
      entryPoints: ['./src/extension.ts'],
      outfile: './dist/extension.js',
      external: ['vscode'],
      format: 'cjs',
      platform: 'node',
    }),
    esbuild.context({
      ...baseConfig,
      entryPoints: ['./src/adapters/inbound/ui/webview/webview-entry.ts'],
      outfile: './dist/webview.js',
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
    }),
  ]).then((contexts) => {
    contexts.forEach((ctx) => ctx.watch());
    console.log('Watching...');
  });
} else {
  build();
}
