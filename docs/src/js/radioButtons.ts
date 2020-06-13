export const setupRadioButtons = (radioButtonsArray, embla, callback) => {
  radioButtonsArray.forEach((radioButton) => {
    radioButton.addEventListener('change', (event) => {
      const { name, value } = event.currentTarget
      embla.reInit({ [name]: value === 'true' })
      callback()
    })
  })
}
