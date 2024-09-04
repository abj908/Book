const baseApiUrl = location.hostname === 'localhost' ? 'http://52.90.190.122:3000' : '/api';

// Function to encode the uploaded image to base64
function encodeImageToBase64(imageFile, callback) {
    const reader = new FileReader();
    reader.onloadend = () => {
        callback(reader.result.split(',')[1]); // Extract base64 string without the data URL metadata
    };
    reader.readAsDataURL(imageFile);
}

function detectBooks() {
    const imageInput = document.getElementById('imageInput').files[0];
    if (!imageInput) {
        alert("Please select an image first.");
        return;
    }

    encodeImageToBase64(imageInput, (base64Image) => {
        fetch(`${baseApiUrl}/detect-books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Image }),
        })
        .then(response => response.json())
        .then(data => displayBooks(data))
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        });
    });
}

// Function to display the detected books
function displayBooks(books) {
    const bookList = document.getElementById('bookList');
    const bookTableBody = document.querySelector("#bookTable tbody");

    bookList.innerHTML = '';
    bookTableBody.innerHTML = '';

    books.forEach(book => {
        const li = document.createElement('li');
        li.textContent = book.title;
        bookList.appendChild(li);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.title || "No Title"}</td>
            <td>${book.subtitle || ""}</td>
            <td>${book.authors ? book.authors.join(', ') : "Unknown Author"}</td>
            <td>${book.publisher || "Unknown Publisher"}</td>
            <td>${book.publishedDate || "No Date"}</td>
            <td>${getISBN(book, 'ISBN_13')}</td>
            <td>${getISBN(book, 'ISBN_10')}</td>
            <td><a href="${book.canonicalVolumeLink || "#"}" target="_blank">Link</a></td>
        `;
        bookTableBody.appendChild(row);
    });
}

function getISBN(book, type) {
    const identifiers = book.industryIdentifiers || [];
    const identifier = identifiers.find(id => id.type === type);
    return identifier ? identifier.identifier : "No " + type;
}
