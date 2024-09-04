require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const isVercel = process.env.VERCEL_ENV === 'production'; // Vercel adds this automatically in production

// Serve static files when deployed to Vercel
if (isVercel) {
    app.use(express.static(path.join(__dirname, 'public')));
}

const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Detect books function
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
        throw new Error('Failed to detect books');
    }
}

// Fetch book data from Google Books API
async function fetchBookData(book) {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(book)}&key=${GOOGLE_API_KEY}`
        );
        return response.data.items[0].volumeInfo;
    } catch (error) {
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
        res.status(500).json({ error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
