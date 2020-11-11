import { EmblaCarouselType } from 'embla-carousel'

export function setupRTLDirectionIfNeeded(embla: EmblaCarouselType, emblaWrapper: HTMLElement) {
  const isRTL = window.location.search.includes('rtl')

  if (isRTL) {
    emblaWrapper.dir = 'rtl'
    embla.reInit({ direction: 'rtl' })
  }
}
