const loginFormHandler = async () => {

  const userName = document.querySelector("#user-id").value.trim();
  const password = document.querySelector("#password-input").value.trim();

  if (userName && password) {
    const response = await fetch("/login", {
      method: "POST",
      body: JSON.stringify({ userName, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      document.location.replace("/admin");
    } else {
      alert("Failed to log in!");
    }
  }
};
