const stickySub = document.querySelector("#sticky-sub");
const stickyEmail = document.querySelector("#sticky-email");
const stickyMessage = document.querySelector("#sticky-message");

// 👉 NEW: cache anti-spam fields
const stickyTokenEl = document.querySelector('input[name="form_token"]');
const stickyTsEl = document.querySelector('input[name="form_ts"]');
const stickyJsEl = document.querySelector('input[name="js_enabled"]');
const stickyHpEl = document.querySelector("#hp-wrap input");

// 👉 NEW: prevent native submit/hash
if (stickySub) stickySub.setAttribute("type", "button");

function validateStickyFourm() {
  let errors = 0;
  if (!stickyEmail.value) {
    errors++;
    stickyEmail.placeholder = "email Must Be Filled";
  }
  if (!stickyMessage.value) {
    errors++;
    stickyMessage.placeholder = "message Must Be Filled";
  }
  return errors;
}

const newStickyMessage = async (e) => {
  e.preventDefault();
  let theErrors = validateStickyFourm();
  console.log(theErrors);

  if (theErrors === 0) {
    // ensure JS flag got set
    if (stickyJsEl && stickyJsEl.value !== "1") stickyJsEl.value = "1";

    let newMessage = {
      formName: "Sticky-Inquiry",
      formData: {
        email: stickyEmail.value,
        message: stickyMessage.value,

        // 👉 NEW: anti-spam fields
        form_token: stickyTokenEl ? stickyTokenEl.value : "",
        form_ts: stickyTsEl ? stickyTsEl.value : "",
        js_enabled: stickyJsEl ? stickyJsEl.value : "1",
        ...(stickyHpEl ? { [stickyHpEl.name]: stickyHpEl.value } : {}),
      },
    };

    const response = await fetch("/contact/submit", {
      method: "POST",
      body: JSON.stringify(newMessage),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      document.getElementById("sticky-contact-form").innerHTML =
        '<div class="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm"><h3 class="text-xl font-bold text-green-800">Thank you for reaching out, a support agent will be in touch shortly!</h3></div>';
    } else {
      alert((await response.text()) || response.statusText);
    }
  }
};

stickySub.addEventListener("click", newStickyMessage);
