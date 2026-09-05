import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const source = (relativePath) => fileURLToPath(new URL(relativePath, import.meta.url))
const localPackages = process.env.EMBLA_LOCAL === '1'

export default defineConfig({
  resolve: {
    alias: {
      'embla-carousel-wheel-gestures': source('../../embla-carousel-wheel-gestures/src/index.ts'),
      ...(localPackages ? {
        'embla-carousel': source('../../../embla-carousel/packages/embla-carousel/src/components/EmblaCarousel.ts'),
        'embla-carousel-react': source('../../../embla-carousel/packages/embla-carousel-react/src/components/useEmblaCarousel.ts'),
        'embla-carousel-reactive-utils': source('../../../embla-carousel/packages/embla-carousel-reactive-utils/src/index.ts'),
        'wheel-gestures': source('../../../wheel-gestures/src/index.ts'),
      } : {}),
    },
    dedupe: ['react', 'react-dom', 'embla-carousel', 'wheel-gestures'],
  },
  ssr: { noExternal: ['embla-carousel-react', 'embla-carousel', 'embla-carousel-reactive-utils', 'wheel-gestures'] },
  build: { rolldownOptions: { output: { entryFileNames: '[name].mjs' } } },
})
