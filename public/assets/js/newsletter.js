const newsForm = document.getElementById("newsletterForm");
const newsMessage = document.getElementById("newsletterMessage");

newsForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // ✅ scope to this form; do NOT use document.getElementById('email')
  const email = newsForm.querySelector('input[name="email"]').value;
  newsMessage.textContent = "";

  // also scope anti-spam fields to this form
  const tokenEl = newsForm.querySelector('input[name="form_token"]');
  const tsEl = newsForm.querySelector('input[name="form_ts"]');
  const jsEl = newsForm.querySelector('input[name="js_enabled"]');
  const hpEl = newsForm.querySelector("#hp-wrap input");

  if (jsEl && jsEl.value !== "1") jsEl.value = "1";

  try {
    const response = await fetch("/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        form_token: tokenEl ? tokenEl.value : "",
        form_ts: tsEl ? tsEl.value : "",
        js_enabled: jsEl ? jsEl.value : "1",
        ...(hpEl ? { [hpEl.name]: hpEl.value } : {}),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      newsMessage.textContent = "Subscription successful! Check your email.";
      newsMessage.className = "text-green-500";
      newsForm.reset();
    } else {
      newsMessage.textContent = data.message || "Subscription failed.";
      newsMessage.className = "text-red-500";
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    newsMessage.textContent = "An unexpected error occurred.";
    newsMessage.className = "text-red-500";
  }
});
