var form = document.querySelector(".edit-blog-form");
var blogBannerImg;

const updateBlogPost = async (id, status) => {
  const yourPost = document.getElementById("editor").innerHTML;
  const subject = document.getElementById("subject").value.trim();
  const author = document.getElementById("username").value.trim();
  const seoExcerpt = document.getElementById("seoExcerpt").value.trim(); // new SEO excerpt field

  console.log(yourPost);
  var newPostObj = {
    username: author,
    PostContent: yourPost,
    subject: subject,
    excerpt: seoExcerpt,
    active: status, // 'published' or 'draft'
  };

  if (blogBannerImg != null) {
    newPostObj.banner = blogBannerImg;
  }

  console.log(newPostObj);

  const response = await fetch(`/admin/editblogPost/${id}`, {
    method: "PUT",
    body: JSON.stringify(newPostObj),
    headers: { "Content-Type": "application/json" },
  });

  if (response.ok) {
    alert(
      `Successfully ${
        status === false ? "saved as draft" : "updated"
      } blog post`
    );
    window.location.href = "/admin/blogpostList";
  } else {
    alert("Failed to update the blog post. Please try again.");
  }
};

const imageUpdater = document.querySelector("#banner");

imageUpdater.addEventListener("change", async function (event) {
  event.preventDefault();

  const formData = new FormData();

  if (imageUpdater.files.length === 0) {
    alert("Please select an image file to upload.");
    return;
  }

  for (const file of imageUpdater.files) {
    formData.append("productImages", file);
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
      document.querySelector(".current-banner").src = imagePath; // show updated img
    } else {
      alert("Failed to upload image.");
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    alert("An error occurred while uploading the image.");
  }
});

// Event listeners for Save Changes and Save as Draft buttons
