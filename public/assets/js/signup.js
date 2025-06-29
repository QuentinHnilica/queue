document.getElementById('createUserBtn').addEventListener('click', (event) => {
  event.preventDefault(); // Prevent form submission
  CreateUser(); // Call the CreateUser function
});

const CreateUser = async () => {

  const username = document.querySelector("#user-id").value.trim();
  const password = document.querySelector("#password-input").value.trim();
  const email = document.querySelector("#email-signup").value.trim();
  const isAdmin = true

  if (!username || !email || !password) {
    alert('All fields are required.');
    return;
  }
  else {
    const response = await fetch('/createMyUser', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, isAdmin }),
      headers: { 'Content-Type': 'application/json' },
    });

    console.log(response);

    if (response.ok) {

      // Show success message
      const successMessage = document.getElementById('successMessage');
      successMessage.classList.remove('hidden');

      // Hide success message and reload page after 2 seconds
      setTimeout(() => {
        successMessage.classList.add('hidden');
        window.location.reload();
      }, 2000);

    } else {
      alert(response.statusText);
    };
  }



}
