function encodeImageToBase64(imageFile, callback) {
    const reader = new FileReader();
    reader.onloadend = () => {
        callback(reader.result.split(',')[1]);
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
        fetch('/detect-books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ base64Image })
        })
        .then(response => {
            // Log the response status and headers for debugging
            console.log('Response Status:', response.status);
            console.log('Response Headers:', response.headers);

            // Attempt to read the response as text first to handle potential errors
            return response.text().then(text => {
                // Log the raw text response
                console.log('Raw Response:', text);

                // Try to parse the text as JSON if the response was OK
                if (response.ok) {
                    try {
                        return JSON.parse(text);
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        throw new Error('Invalid JSON response');
                    }
                } else {
                    throw new Error(text);
                }
            });
        })
        .then(data => {
            // Log the parsed data
            console.log('Parsed Data:', data);

            // Display the books if data is valid
            if (data && Array.isArray(data)) {
                displayBooks(data);
            } else {
                console.error('Unexpected data format:', data);
                alert('Failed to detect books. Please try again.');
            }
        })
        .catch(error => {
            // Log any errors encountered during the fetch or JSON parsing
            console.error('Error:', error);
            alert('An error occurred: ' + error.message);
        });
    });
}

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
