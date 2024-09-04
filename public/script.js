const baseApiUrl = location.hostname === 'localhost' ? 'http://52.90.190.122:3000' : '/api';

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
