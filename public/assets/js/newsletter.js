const newsForm = document.getElementById('newsletterForm');
const newsMessage = document.getElementById('newsletterMessage');

newsForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  newsMessage.textContent = ''; // Clear previous messages

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
      newsMessage.textContent = 'Subscription successful! Check your email.';
      newsMessage.className = 'text-green-500';
      newsForm.reset();
    } else {
      newsMessage.textContent = data.message || 'Subscription failed.';
      newsMessage.className = 'text-red-500';
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    newsMessage.textContent = 'An unexpected error occurred.';
    newsMessage.className = 'text-red-500';
  }
});