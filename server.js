require('dotenv').config();
const express = require('express');
const path = require('path');
const { detectBooks, fetchBookData, validateRequestBody } = require('./api/detect-books');

const app = express();

// Middleware to parse JSON and form data
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const isVercel = process.env.VERCEL_ENV === 'production';

// Serve static files when deployed to Vercel
if (isVercel) {
    app.use(express.static(path.join(__dirname, 'public')));
}

// Handle POST requests for book detection
app.post('/detect-books', async (req, res) => {
    try {
        // Validate the incoming request body
        validateRequestBody(req.body);

        const { base64Image } = req.body;

        // Detect books in the image
        const detectedBooks = await detectBooks(base64Image);

        if (detectedBooks.length === 0) {
            return res.status(200).json({ message: 'No books detected in the image.' });
        }

        // Fetch detailed data for each book
        const bookDataPromises = detectedBooks.map(fetchBookData);
        const bookData = await Promise.all(bookDataPromises);

        res.status(200).json(bookData);
    } catch (error) {
        // Respond with appropriate error message and status
        console.error('Error in /detect-books route:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
