const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const users = {}; 

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ room, username }) => {
        socket.join(room);

        users[socket.id] = { username, room };

        socket.broadcast.to(room).emit('userJoined', {
            user: username,
            room,
        });

        updateRoomUsers(room);
    });

    socket.on('chatMessage', ({ room, message, user }) => {
        io.to(room).emit('message', {
            message,
            user,
            time: new Date().toLocaleTimeString(),
        });
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];

        if (user) {
            const { username, room } = user;

            delete users[socket.id];

            io.to(room).emit('userLeft', {
                user: username,
                room,
            });

            updateRoomUsers(room);
        }
    });

    function updateRoomUsers(room) {
        const roomUsers = Object.values(users).filter(user => user.room === room);
        const usernames = roomUsers.map(user => user.username);

        io.to(room).emit('roomUsers', {
            room,
            users: usernames
        });
    }
});

server.listen(3000, () => console.log(`Server running on port http://localhost:3000`));
