import express from 'express';
import cors from 'cors';
import chatRouter from './src/chatRouter.js';

// Create an Express application
const app = express();

// Enable CORS for all origins
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
    // Default message bef. connecting to frontend
    res.send('Chat app backend server is running');
});

// Integrate chatRouter(GeniAI)
app.use('/api', chatRouter);

// start server
// PORT is in .env
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// For testing the backend server w/o frontend
// prepare proper curl command
// curl.exe -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"message":"Hello, how are you?"}'
// PowerShell (Invoke-RestMethod):
// Invoke-RestMethod -Uri http://localhost:3000/api/chat -Method Post -ContentType "application/json" -Body '{"message":"Hello, how are you?"}'
