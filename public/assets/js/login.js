const loginFormHandler = async (e) => {

  e.preventDefault(); // Prevent default form submission

  const userName = document.querySelector("#user-id").value.trim();
  const password = document.querySelector("#password-input").value.trim();

  if (userName && password) {
    try {
      const response = await fetch("/login", {
        method: "POST",
        body: JSON.stringify({ userName, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        document.location.replace("/admin");
      } else {
        const errorMsg = await response.text();
        alert("Login failed: " + errorMsg);
      }
    } catch (err) {
      console.error("Error during login:", err);
      alert("Error logging in. Check console for details.");
    }
  }
};
document.addEventListener("DOMContentLoaded", function() {
  const loginButton = document.getElementById("login_form");
  loginButton.addEventListener("click", loginFormHandler);
});