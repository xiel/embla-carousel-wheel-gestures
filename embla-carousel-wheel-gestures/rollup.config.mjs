import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import { minify } from 'terser'
import ts from 'typescript'
import { writeFileSync } from 'node:fs'

const name = 'embla-carousel-wheel-gestures'

export default ['development', 'production'].flatMap((environment) =>
  ['cjs', 'esm', 'umd'].map((format) => ({
    input: format === 'umd' ? 'src/umd.ts' : 'src/index.ts',
    external: format === 'umd' ? [] : ['wheel-gestures'],
    output: {
      file: `dist/${name}.${format}${format === 'esm' ? '' : `.${environment}`}${environment === 'production' && format === 'cjs' ? '.min' : ''}.js`
        .replace('.umd.production', '.umd'),
      format,
      interop: 'auto',
      name: 'EmblaCarouselWheelGestures',
      exports: format === 'umd' ? 'default' : 'named',
      sourcemap: true,
    },
    plugins: [
      resolve({ extensions: ['.js', '.ts'] }),
      commonjs(),
      replace({ preventAssignment: true, 'process.env.NODE_ENV': JSON.stringify(environment) }),
      {
        name: 'typescript',
        transform(code, id) {
          if (!id.endsWith('.ts')) return null
          const result = ts.transpileModule(code, {
            fileName: id,
            compilerOptions: { target: ts.ScriptTarget.ES2018, module: ts.ModuleKind.ESNext, sourceMap: true },
          })
          return { code: result.outputText, map: JSON.parse(result.sourceMapText) }
        },
      },
      environment === 'production' && {
        name: 'minify',
        async renderChunk(code) {
          return minify(code, { module: format === 'esm', sourceMap: { asObject: true } })
        },
      },
      {
        name: 'commonjs-entry',
        writeBundle() {
          writeFileSync('dist/index.js', `'use strict'\nmodule.exports = process.env.NODE_ENV === 'production' ? require('./${name}.cjs.production.min.js') : require('./${name}.cjs.development.js')\n`)
        },
      },
    ],
  }))
)
