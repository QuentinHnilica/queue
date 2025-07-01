const newPost = document.getElementById("submitPost");
const saveDraft = document.getElementById("saveDraft");
var blogBannerImg;

const makePost = async (status) => {
  const yourPost = document.querySelector(".ql-editor").innerHTML;
  const subject = document.getElementById("newSubject").value.trim();
  const author = document.getElementById("authorName").value.trim();
  const seoExcerpt = document.getElementById("seoExcerpt").value.trim();
  const date = new Date();
  const timeStamp = date.toDateString();

  console.log(yourPost);

  if (!blogBannerImg) {
    alert("Add Banner Image");
    return;
  }

  const newPostObj = {
    username: author,
    PostContent: yourPost,
    subject: subject,
    excerpt: seoExcerpt,
    date: timeStamp,
    banner: blogBannerImg,
    active: status,
  };

  console.log(newPostObj);

  const response = await fetch("/admin/newPost", {
    method: "POST",
    body: JSON.stringify(newPostObj),
    headers: { "Content-Type": "application/json" },
  });

  if (response.ok) {
    alert(
      `Blog Post Successfully ${
        status === "false" ? "Saved as Draft" : "Created"
      }!`
    );
  } else {
    alert(response.statusText);
  }
};

const uploadBtn = document.querySelector("#uploadBtn");

uploadBtn.addEventListener("click", async function (event) {
  event.preventDefault(); // Prevent form from submitting the traditional way

  const formData = new FormData();
  const fileInput = document.getElementById("blogImage");

  if (fileInput.files.length === 0) {
    alert("Please select an image file to upload.");
    return;
  }
  for (const file of fileInput.files) {
    formData.append("Images", file);
  }

  try {
    const response = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      alert("Image uploaded successfully!");
      const imagePath = result.paths[0];
      blogBannerImg = imagePath; // set global to add to db
      document.getElementById("imageFilePath").src = imagePath; // show img
      document.querySelector(".blog-banner-showcase").classList.add("show");
    } else {
      alert("Failed to upload image.");
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    alert("An error occurred while uploading the image.");
  }
});

// Event listeners for publish and draft buttons
newPost.addEventListener("click", () => makePost(true));
saveDraft.addEventListener("click", () => makePost(false));
