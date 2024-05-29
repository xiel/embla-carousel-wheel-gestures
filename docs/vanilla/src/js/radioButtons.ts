export const setupRadioButtons = (radioButtonsArray, embla, callback) => {
  radioButtonsArray.forEach((radioButton) => {
    const initialOptionValue = `${embla.internalEngine().options[radioButton.name]}`
    radioButton.checked = initialOptionValue === radioButton.value
    radioButton.addEventListener('change', (event) => {
      const { name, value } = event.currentTarget
      embla.reInit({ [name]: value === 'true' })
      callback()
    })
  })
}
