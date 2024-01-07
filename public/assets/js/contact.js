const sub = document.querySelector("#Sub");
const name1 = document.querySelector("#name");
const email = document.querySelector("#email");
const phone = document.querySelector("#phone");
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

  if (phone.value == null || phone.value.length < 10) {
    errors++;
    phone.value = "";
    phone.placeholder = "phone Must Valid";
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
      name: name1.value,
      email: email.value,
      phone: phone.value,
      message: message.value,
    };

    const response = await fetch("/contact/submit", {
      method: "POST",
      body: JSON.stringify(newMessage),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      console.log("group Created");
    } else {
      alert(response.statusText);
    }
  }
};

sub.addEventListener("click", newMessage);
