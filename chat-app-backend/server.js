import express from 'express';
import cors from 'cors';

// Create an Express application
const app = express();

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.get('/', (req, res) => {
    // Default message bef. connecting to frontend
    res.send('Chat app backend server is running');
});

// start server
// PORT is in .env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});