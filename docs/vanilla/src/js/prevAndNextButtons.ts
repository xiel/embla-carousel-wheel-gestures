export const setupPrevNextBtns = (prevBtn, nextBtn, embla) => {
  prevBtn.addEventListener('click', () => embla.goToPrev(), false)
  nextBtn.addEventListener('click', () => embla.goToNext(), false)
}

export const disablePrevNextBtns = (prevBtn, nextBtn, embla) => {
  return () => {
    if (embla.canGoToPrev()) prevBtn.removeAttribute('disabled')
    else prevBtn.setAttribute('disabled', 'disabled')

    if (embla.canGoToNext()) nextBtn.removeAttribute('disabled')
    else nextBtn.setAttribute('disabled', 'disabled')
  }
}
