# Watch Together 🍿❤️

A modern, cozy, full-stack "Watch Together" web application designed for personal use to watch movies in sync remotely.

## Live Demo

🌐 Frontend: https://watch-together-nu-kohl.vercel.app

## Features

- **Perfect Sync**: Real-time synchronization of play, pause, and seek actions.
- **Local Video Playback**: No video is uploaded to the server. Simply select the same local file on both ends.
- **Real-Time Chat & Reactions**: Floating emoji reactions and a live chat sidebar.
- **Auto-Recovery**: If a user goes out of sync by more than 2 seconds, the app automatically corrects it.
- **Buffering States**: A "Waiting for partner..." state triggers when one user's video buffers.
- **Cinematic UI**: A cozy, immersive dark-themed UI with glassmorphism and ambient glowing backgrounds.

## Tech Stack

- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Framer Motion, Zustand, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Socket.IO, MongoDB, Mongoose.

## Local Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone & Install
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Variables
Create a `.env` file in the `server` folder:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/watchtogether
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
```

*(The frontend uses the default Vite environment, connecting to `http://localhost:5000` by default. You can override it by adding `VITE_API_URL` to `client/.env`)*

### 3. Run the App

**Start the Backend:**
```bash
cd server
npm run dev
```

**Start the Frontend:**
```bash
cd client
npm run dev
```

The frontend will run at `http://localhost:5173`.

## How to Use

1. Register an account and log in.
2. Click **Create a Room** from the dashboard.
3. Share the Room ID with your partner.
4. Your partner enters the Room ID to join.
5. Both of you click "Choose File" and select the **exact same video file** from your local computers.
6. The video will appear. Playing, pausing, or seeking on one side will perfectly sync on the other!

---
*Built with ❤️ for a seamless remote movie night.*
