const stickySub = document.querySelector("#sticky-sub");
const stickyEmail = document.querySelector("#sticky-email");

const stickyMessage = document.querySelector("#sticky-message");

function validateStickyFourm() {
  let errors = 0;

  if (stickyEmail.value == null || stickyEmail.value == "") {
    errors++;
    stickyEmail.placeholder = "email Must Be Filled";
  }

  if (stickyMessage.value == null || stickyMessage.value == "") {
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
    let newMessage = {
      formName: "Sticky-Inquiry",
      formData: {
        email: stickyEmail.value,
        message: stickyMessage.value,
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
      alert(response.statusText);
    }
  }
};

stickySub.addEventListener("click", newStickyMessage);
