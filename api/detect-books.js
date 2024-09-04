const axios = require('axios');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

async function fetchBookData(book) {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(book)}&key=${process.env.GOOGLE_API_KEY}`
        );
        return response.data.items[0].volumeInfo;
    } catch (error) {
        throw new Error('Failed to fetch book data');
    }
}

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { base64Image } = req.body;
        try {
            const detectedBooks = await detectBooks(base64Image);
            const bookDataPromises = detectedBooks.map(fetchBookData);
            const bookData = await Promise.all(bookDataPromises);
            res.status(200).json(bookData);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};
