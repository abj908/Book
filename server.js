require('dotenv').config();
const express = require('express');
const axios = require('axios');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// --- Add Google Auth middleware ---
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// Configure passport with Google OAuth strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
},
    function (accessToken, refreshToken, profile, done) {
        // User authentication successful
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Health check route
app.get('/health', (req, res) => {
    res.send('Server is running.');
});

// Google Auth Routes
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect to home.
        res.redirect('/');
    }
);

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

// Check if user is authenticated middleware
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/auth/google');
}

// --- Your original routes ---
app.post('/detect-books', isAuthenticated, async (req, res) => {
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

// Detect books and fetch data functions are the same as before
async function detectBooks(base64Image) {
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
            { role: 'user', content: 'Return a comma-separated string of the book titles in this picture' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        ],
        max_tokens: 300,
    });
    const content = response.choices[0].message.content.trim();
    return content.split(',').map(book => book.trim());
}

async function fetchBookData(book) {
    const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(book)}&key=${GOOGLE_API_KEY}`
    );
    return response.data.items[0].volumeInfo;
}

// Static file serving (if required for Vercel)
if (process.env.VERCEL_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
