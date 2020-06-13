export const setupDotBtns = (dotsArray, embla) => {
  dotsArray.forEach((dotNode, i) => {
    dotNode.classList.add('embla__dot');
    dotNode.addEventListener('click', () => embla.scrollTo(i), false);
  });
};

export const generateDotBtns = (dots, embla) => {
  const scrollSnaps = embla.scrollSnapList();
  const dotsFrag = document.createDocumentFragment();
  const dotsArray = scrollSnaps.map(() => document.createElement('button'));
  dotsArray.forEach(dotNode => dotsFrag.appendChild(dotNode));
  dots.appendChild(dotsFrag);
  return dotsArray;
};

export const selectDotBtn = (dotsArray, embla) => () => {
  const previous = embla.previousScrollSnap();
  const selected = embla.selectedScrollSnap();
  dotsArray[previous].classList.remove('is-selected');
  dotsArray[selected].classList.add('is-selected');
};
