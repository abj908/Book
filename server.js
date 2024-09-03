const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load API keys from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Route to handle book detection and data fetching
app.post('/detect-books', async (req, res) => {
    const { base64Image } = req.body;

    // Simulated response from OpenAI API
    const detectedBooks = ["Anna Karenina", "Moby Dick"];

    // Fetch bibliographic information for detected books
    const bookData = [];
    for (const book of detectedBooks) {
        try {
            const response = await axios.get(
                `https://www.googleapis.com/books/v1/volumes?q=${book}&key=${GOOGLE_API_KEY}`
            );
            bookData.push(response.data.items[0].volumeInfo);
        } catch (error) {
            console.error('Error fetching data:', error);
            return res.status(500).json({ error: 'Failed to fetch book data.' });
        }
    }

    res.json(bookData);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});