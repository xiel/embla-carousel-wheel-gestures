import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { DotButton, NextButton, PrevButton } from './EmblaCarouselButtons'

const EmblaCarouselComponent = ({ children }: { children: React.ReactNode }) => {
  const wheelGesturesPlugin = useMemo(() => WheelGesturesPlugin(), [])
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, skipSnaps: true }, [wheelGesturesPlugin])
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollTo = useCallback((index) => embla && embla.scrollTo(index), [embla])
  const scrollPrev = useCallback(() => embla && embla.scrollPrev(), [embla])
  const scrollNext = useCallback(() => embla && embla.scrollNext(), [embla])

  useEffect(() => {
    if (embla) {
      const onSelect = () => {
        setSelectedIndex(embla.selectedScrollSnap())
        setPrevBtnEnabled(embla.canScrollPrev())
        setNextBtnEnabled(embla.canScrollNext())
      }

      setScrollSnaps(embla.scrollSnapList())
      embla.on('select', onSelect)
      onSelect()
    }
  }, [embla])

  return (
    <div className="embla">
      <div ref={emblaRef} className="embla__viewport">
        <div className="embla__container">
          {React.Children.map(children, (Child, index) => (
            <div className="embla__slide" key={index}>
              <div className="embla__slide__inner">{Child}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="embla__dots">
        {scrollSnaps.map((snap, index) => (
          <DotButton selected={index === selectedIndex} onClick={() => scrollTo(index)} key={index} />
        ))}
      </div>
      <PrevButton onClick={scrollPrev} enabled={prevBtnEnabled} />
      <NextButton onClick={scrollNext} enabled={nextBtnEnabled} />
    </div>
  )
}

export default EmblaCarouselComponent
