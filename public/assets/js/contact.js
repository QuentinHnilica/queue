// /assets/js/contact.js
(() => {
  console.log("hello?");

  const oldForm = document.getElementById("contact-form");
  if (!oldForm) return;

  // Remove any previously-attached handlers from other scripts
  const f = oldForm.cloneNode(true); // deep clone (keeps inputs, kills listeners)
  oldForm.parentNode.replaceChild(f, oldForm);

  // Re-query elements from the *new* form
  const btn = f.querySelector("#Sub");

  // Prevent native submit & perform our JSON submit (works for click *and* Enter)
  f.setAttribute("novalidate", "");
  f.addEventListener(
    "submit",
    (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      submitAsJson(); // <-- actually submit here
    },
    { capture: true }
  );

  // (Optional) also bind the button; not strictly needed since submit handles it
  if (btn) {
    console.log("Btn Real");
    btn.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
        console.log("Hellllloo??");
        // Trigger form submit path (so Enter & click use same flow)
        f.requestSubmit ? f.requestSubmit() : submitAsJson();
      },
      { capture: true }
    );
  }

  async function submitAsJson() {
    // your existing validation
    if (typeof validateFourm === "function" && validateFourm() !== 0) return;

    const hpEl = document.querySelector("#hp-wrap input");

    const payload = {
      formName: "Contact Us",
      formData: {
        firstName: document.getElementById("name").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        message: document.getElementById("message").value,
        form_token: document.querySelector('input[name="form_token"]').value,
        form_ts: document.querySelector('input[name="form_ts"]').value,
        js_enabled: document.querySelector('input[name="js_enabled"]').value,
        ...(hpEl ? { [hpEl.name]: hpEl.value } : {}),
      },
    };

    console.log("about to POST JSON", payload);

    const r = await fetch("/contact/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (r.ok) {
      const header = document.querySelector("section .text-left");
      if (header) header.innerHTML = "";
      f.innerHTML =
        '<h3 class="text-xl font-semibold text-center text-gray-900">Thank you for reaching out — a support agent will be in touch shortly!</h3>';
    } else {
      const txt = await r.text();
      alert(txt || "Submission failed.");
    }
  }
})();
