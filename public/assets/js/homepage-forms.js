const sub = document.querySelector("#sub");
const name1 = document.querySelector("#name");
const email = document.querySelector("#email");

const message = document.querySelector("#message");

function validateFourm() {
  let errors = 0;

  if (name1.value == null || name1.value == "") {
    errors++;
    name1.placeholder = "Name Must Be Filled";
  }

  if (email.value == null || email.value == "") {
    errors++;
    email.placeholder = "email Must Be Filled";
  }

  if (message.value == null || message.value == "") {
    errors++;
    message.placeholder = "message Must Be Filled";
  }

  return errors;
}

const newMessage = async (e) => {
  e.preventDefault();
  let theErrors = validateFourm();
  console.log(theErrors);

  if (theErrors === 0) {
    let newMessage = {
      formName: "Home-Page-Inquiry",
      formData: {
        name: name1.value,
        email: email.value,
        message: message.value,
      },
    };

    const response = await fetch("/contact/submit", {
      method: "POST",
      body: JSON.stringify(newMessage),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
        document.getElementById("contact-form").innerHTML =
          '<div class="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6 text-center shadow-sm"><h3 class="text-xl font-bold text-green-800">Thank you for reaching out, a support agent will be in touch shortly!</h3></div>';
    } else {
      alert(response.statusText);
    }
  }
};

sub.addEventListener("click", newMessage);
