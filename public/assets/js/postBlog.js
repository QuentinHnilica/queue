const newPost = document.getElementById('submitPost')
var blogBannerImg

const makePost = async () => {
    const yourPost = document.querySelector('.ql-editor').innerHTML
    const subject = document.getElementById('newSubject').value.trim()
    const author = document.getElementById('authorName').value.trim()
    const date = new Date()
    const timeStamp = date.toDateString()

    if (blogBannerImg != null) {
        const newPostObj = {
            username: author,
            PostContent: yourPost,
            subject: subject,
            date: timeStamp,
            banner: blogBannerImg
        }
        console.log(newPostObj)


        const response = await fetch('/admin/newPost', {
            method: "POST",
            body: JSON.stringify(newPostObj),
            headers: { 'Content-Type': 'application/json' }
        })

        if (response.ok) {
            alert("Blog Post Sucessfully Created!")
        }
        else {
            alert(response.statusText)
        }

    }
    else{
        alert('Add Banner Image')
    }



}


const uploadBtn = document.querySelector('#uploadBtn')

uploadBtn.addEventListener('click', async function (event) {
    event.preventDefault(); // Prevent form from submitting the traditional way

    const formData = new FormData();
    const fileInput = document.getElementById('blogImage');

    if (fileInput.files.length === 0) {
        alert('Please select an image file to upload.');
        return;
    }
    for (const file of fileInput.files) {
        formData.append('Images', file);
    }

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            alert('Image uploaded successfully!');
            // Use result.path to reference the uploaded image
            console.log(result.paths); // Add this to your img table or product modal

            // Example: You can update a hidden input field or add the path to a modal form
            const imagePath = result.paths[0];
            blogBannerImg = imagePath; //set global to add to db
            document.getElementById('imageFilePath').src = imagePath; // show img
            document.querySelector('.blog-banner-showcase').classList.add('show')


        } else {
            alert('Failed to upload image.');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        alert('An error occurred while uploading the image.');
    }
});

newPost.addEventListener('click', makePost)