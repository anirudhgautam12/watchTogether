import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import { setupSockets } from './socket';

dotenv.config();

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: clientUrl,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Socket setup
setupSockets(io);

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/watchtogether';

console.log('--- Starting WatchTogether Server ---');
console.log(`Configured PORT: ${PORT}`);
console.log(`Configured CLIENT_URL: ${clientUrl}`);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
    server.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server is running and listening on 0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: MongoDB connection error:', err);
    process.exit(1); // Exit early if DB connection fails
  });
