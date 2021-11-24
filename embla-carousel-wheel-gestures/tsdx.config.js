module.exports = {
  rollup(config) {
    if (config.output.format === 'umd') {
      const origExternal = config.external

      // UMD is better served by a default export
      config.input = config.input.replace('/index.ts', '/umd.ts')
      config.output.exports = 'default'
      config.output.name = 'EmblaCarouselWheelGestures'
      config.output.file = config.output.file.replace('.umd.production.min.js', '.umd.js')

      config.external = (id) => {
        // Dependencies to be bundled into the UMD file
        if (id === 'wheel-gestures') {
          return false
        }
        return origExternal(id)
      }
    }

    return config
  },
}
