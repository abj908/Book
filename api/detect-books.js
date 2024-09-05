const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Detect books from the base64 image
async function detectBooks(base64Image) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Return a comma-separated string of the book titles in this picture' },
                        {
                            type: 'image_url',
                            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                        },
                    ],
                },
            ],
            max_tokens: 300,
        });
        const content = response.choices[0].message.content.trim();
        return content.split(',').map(book => book.trim());
    } catch (error) {
        console.error('Error detecting books:', error.message);
        throw new Error('Failed to detect books. Please try again later.');
    }
}

// Fetch book data from Google Books API
async function fetchBookData(book) {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(book)}&key=${process.env.GOOGLE_API_KEY}`
        );
        if (!response.data.items || !response.data.items[0]) {
            throw new Error(`No data found for book: ${book}`);
        }
        return response.data.items[0].volumeInfo;
    } catch (error) {
        console.error(`Error fetching data for book "${book}":`, error.message);
        throw new Error(`Failed to fetch data for book: ${book}`);
    }
}

// Validate the request body
function validateRequestBody(body) {
    if (!body || !body.base64Image) {
        throw new Error('Invalid request: base64Image is required');
    }
}

module.exports = { detectBooks, fetchBookData, validateRequestBody };