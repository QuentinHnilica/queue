const sub = document.querySelector("button[type='submit']");
const name1 = document.querySelector("#name");
const email = document.querySelector("#email");
const phone = document.querySelector("#phone");
const businessName = document.querySelector("#business-name");
const established = document.querySelector("#established");
const employees = document.querySelector("#employees");
const businessTypeTrigger = document.querySelector("#dropdown-trigger"); // Custom dropdown trigger
const businessTypeOptions = document.querySelectorAll("#dropdown-options li"); // Dropdown options
const businessTypeSelected = document.querySelector("#selected-option"); // Element showing selected value
const description = document.querySelector("#description");
const formContainer = document.querySelector(".form-container"); // Update this to target your form container
const confirmationMessage = document.querySelector(".confirmation-message");

let businessTypeValue = ""; // To hold selected business type

// Toggle dropdown visibility
businessTypeTrigger.addEventListener("click", () => {
    const dropdown = document.querySelector("#dropdown-options");
    dropdown.classList.toggle("hidden");
});

// Update selected business type and close dropdown
businessTypeOptions.forEach(option => {
    option.addEventListener("click", (e) => {
        businessTypeValue = e.target.getAttribute("data-value");
        businessTypeSelected.textContent = e.target.textContent; // Update selected value display
        document.querySelector("#dropdown-options").classList.add("hidden"); // Close dropdown
    });
});

function validateForm() {
    let errors = 0;

    // Validate Name
    if (name1.value == null || name1.value == "") {
        errors++;
        name1.placeholder = "Name Must Be Filled";
    }

    // Validate Email
    if (email.value == null || email.value == "") {
        errors++;
        email.placeholder = "Email Must Be Filled";
    }

    // Validate Phone
    if (phone.value == null || phone.value.length < 10) {
        errors++;
        phone.value = "";
        phone.placeholder = "Phone Must Be Valid";
    }

    // Validate Business Name
    if (businessName.value == null || businessName.value == "") {
        errors++;
        businessName.placeholder = "Business Name Must Be Filled";
    }

    // Validate Years in Business
    if (established.value == null || established.value == "" || established.value <= 0) {
        errors++;
        established.placeholder = "Years in Business Must Be Filled";
    }

    // Validate Number of Employees
    if (employees.value == null || employees.value == "" || employees.value < 1) {
        errors++;
        employees.placeholder = "Number of Employees Must Be Filled";
    }

    // Validate Business Type (Custom Dropdown)
    if (businessTypeValue === "") {
        errors++;
        businessTypeSelected.textContent = "Please Select a Business Type";
    }

    // Validate Description
    if (description.value == null || description.value == "") {
        errors++;
        description.placeholder = "Business Description Must Be Filled";
    }

    return errors;
}


const newMessage = async (e) => {
    e.preventDefault();
    let theErrors = validateForm();
    console.log(theErrors);

    if (theErrors === 0) {
        let newMessage = {
            formName: "Shiawassee20",
            formData: {
                name: name1.value,
                email: email.value,
                phone: phone.value,
                businessName: businessName.value,
                established: established.value,
                employees: employees.value,
                businessType: businessTypeValue, // Use the custom dropdown value
                description: description.value,
            },
        };

        const response = await fetch("/consult/submit", {
            method: "POST",
            body: JSON.stringify(newMessage),
            headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
            console.log("Form Submitted Successfully");
            formContainer.style.display = "none";
            confirmationMessage.style.display = "block";

        } else {
            alert(response.statusText);
        }
    }
};

sub.addEventListener("click", newMessage);
