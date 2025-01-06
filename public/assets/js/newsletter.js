const form = document.getElementById('newsletterForm');
const message = document.getElementById('newsletterMessage');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  message.textContent = ''; // Clear previous messages

  try {
    const response = await fetch('/newsletter/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      message.textContent = 'Subscription successful! Check your email.';
      message.className = 'text-green-500';
      form.reset();
    } else {
      message.textContent = data.message || 'Subscription failed.';
      message.className = 'text-red-500';
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    message.textContent = 'An unexpected error occurred.';
    message.className = 'text-red-500';
  }
});