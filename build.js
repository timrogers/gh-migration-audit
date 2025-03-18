import * as esbuild from 'esbuild'

import packageJson from './package.json' with { type: 'json' }

const result = await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/migration-audit.cjs',
  platform: 'node',
  define: {
    'process.env.NPM_PACKAGE_VERSION': `'${packageJson.version}'`,
  }
})