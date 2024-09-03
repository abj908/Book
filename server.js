const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

console.log("Starting server...");

const app = express();

// Increase the request body size limit
app.use(express.json({ limit: '10mb' })); // or larger if needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
    res.send('Server is running.');
});

console.log("Environment Variables Loaded");
console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY}`);
console.log(`Google API Key: ${process.env.GOOGLE_API_KEY}`);

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Function to detect books using OpenAI
async function detectBooks(base64Image) {
    try {
        const response = await openai.createCompletion({
            model: 'gpt-4', // Ensure you're using the correct model or API endpoint
            prompt: `Return a comma separated string of the book titles in this picture:\n\n[data:image/jpeg;base64,${base64Image}]`,
            max_tokens: 300,
        });
        const content = response.data.choices[0].text.trim();
        return content.split(',').map(book => book.trim());
    } catch (error) {
        console.error('Error detecting books:', error);
        throw new Error('Failed to detect books');
    }
}

// Function to fetch bibliographic data from Google Books API
async function fetchBookData(book) {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(book)}&key=${GOOGLE_API_KEY}`
        );
        return response.data.items[0].volumeInfo;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error('Failed to fetch book data');
    }
}

app.post('/detect-books', async (req, res) => {
    const { base64Image } = req.body;

    try {
        const detectedBooks = await detectBooks(base64Image);
        const bookDataPromises = detectedBooks.map(fetchBookData);
        const bookData = await Promise.all(bookDataPromises);

        res.json(bookData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});