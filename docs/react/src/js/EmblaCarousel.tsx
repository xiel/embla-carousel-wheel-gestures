import useEmblaCarousel from 'embla-carousel-react'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import React, { useCallback, useEffect, useState } from 'react'

import { DotButton, NextButton, PrevButton } from './EmblaCarouselButtons'

type Axis = 'x' | 'y'
type WheelAxis = Axis | 'both'

const EmblaCarouselComponent = ({ children }: { children: React.ReactNode }) => {
  const [axis, setAxis] = useState<Axis>('x')
  const [loop, setLoop] = useState(false)
  const [skipSnaps, setSkipSnaps] = useState(true)
  const [forceWheelAxis, setForceWheelAxis] = useState<WheelAxis | undefined>()
  const [target, setTarget] = useState<Element | undefined>()
  const [emblaRef, embla] = useEmblaCarousel(
    {
      loop,
      skipSnaps,
      axis,
    },
    [
      WheelGesturesPlugin({
        forceWheelAxis,
        target,
      }),
    ]
  )

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollTo = useCallback((index: number) => embla && embla.goTo(index), [embla])
  const scrollPrev = useCallback(() => embla && embla.goToPrev(), [embla])
  const scrollNext = useCallback(() => embla && embla.goToNext(), [embla])

  useEffect(() => {
    if (!embla) return

    const onSelect = () => {
      setSelectedIndex(embla.selectedSnap())
      setPrevBtnEnabled(embla.canGoToPrev())
      setNextBtnEnabled(embla.canGoToNext())
      setScrollSnaps(embla.snapList())
    }

    embla.on('select', onSelect)
    embla.on('reinit', onSelect)
    onSelect()

    return () => {
      embla.off('select', onSelect)
      embla.off('reinit', onSelect)
    }
  }, [embla])

  return (
    <>
      <div style={{ display: 'flex', gap: 16, paddingBottom: 16 }}>
        <label>
          carousel axis:{' '}
          <select value={axis} onChange={(e) => setAxis(e.target.value as Axis)}>
            <option value="x">X</option>
            <option value="y">Y</option>
          </select>
        </label>

        <label>
          wheel axis{forceWheelAxis ? ' (forced)' : ''}:{' '}
          <select value={forceWheelAxis || axis} onChange={(e) => setForceWheelAxis(e.target.value as WheelAxis)}>
            <option value="x">X</option>
            <option value="y">Y</option>
            <option value="both">Both</option>
          </select>
        </label>

        <label>
          loop: <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
        </label>

        <label>
          skip snaps: <input type="checkbox" checked={skipSnaps} onChange={(e) => setSkipSnaps(e.target.checked)} />
        </label>

        <label>
          target:{' '}
          <select
            value={target ? 'documentElement' : ''}
            onChange={(e) => setTarget(e.target.value ? document.documentElement : undefined)}
          >
            <option value="">default</option>
            <option value="documentElement">documentElement</option>
          </select>
        </label>
      </div>
      <div className="embla" data-axis={axis}>
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
    </>
  )
}

export default EmblaCarouselComponent
