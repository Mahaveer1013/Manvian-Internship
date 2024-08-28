const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

// Create the Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const users = {}; // To track users in rooms

// Serve the static HTML/CSS/JS files
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New WebSocket connection...');

    // Handle join room event
    socket.on('joinRoom', ({ room, username }) => {
        socket.join(room);

        // Store the user in the room
        users[socket.id] = { username, room };

        socket.broadcast.to(room).emit('userJoined', {
            user: username,
            room,
        });

        // Update room users
        updateRoomUsers(room);
    });

    // Handle chat message
    socket.on('chatMessage', ({ room, message, user }) => {
        io.to(room).emit('message', {
            message,
            user,
            time: new Date().toLocaleTimeString(),
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const user = users[socket.id];

        if (user) {
            const { username, room } = user;

            // Remove user from room
            delete users[socket.id];

            // Notify room users
            io.to(room).emit('userLeft', {
                user: username,
                room,
            });

            // Update room users
            updateRoomUsers(room);
        }
    });

    // Function to update users in a room
    function updateRoomUsers(room) {
        const roomUsers = Object.values(users).filter(user => user.room === room);
        const usernames = roomUsers.map(user => user.username);

        io.to(room).emit('roomUsers', {
            room,
            users: usernames
        });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
