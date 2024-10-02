function showMessage(message) {
    const messagePopup = document.getElementById('message-popup');
    const messageText = document.getElementById('message-text');

    messageText.textContent = message;
    messagePopup.classList.remove('hidden');

    setTimeout(() => {
        messagePopup.classList.add('hidden');
    }, 3000); // Adjust the timeout as needed
}

function validateInput(inputField) {
  const value = parseInt(inputField.value);

  if (isNaN(value)) {
    showMessage("Please enter a valid number.");
    inputField.value = "";
    return false;
  }

  const min = parseInt(inputField.getAttribute('min'));
  const max = parseInt(inputField.getAttribute('max'));

  if (value < min) {
    showMessage(`The minimum value allowed is ${min}.`);
    inputField.value = min;
    return false;
  }

  if (value > max) {
    showMessage(`The maximum value allowed is ${max}.`);
    inputField.value = max;
    return false;
  }

  return true;
}