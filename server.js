const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = {}; // { username: password }
const onlineUsers = {}; // { room: [user1, user2] }

io.on('connection', (socket) => {
    socket.on('auth-attempt', (data) => {
        const { username, password, room } = data;

        if (users[username] && users[username] !== password) {
            return socket.emit('login-error', 'Şifre Yanlış!');
        }
        
        users[username] = password;
        socket.username = username;
        socket.currentRoom = room;
        socket.join(room);

        // Çevrimiçi listesini güncelle
        if (!onlineUsers[room]) onlineUsers[room] = [];
        if (!onlineUsers[room].includes(username)) onlineUsers[room].push(username);

        socket.emit('login-success', { username, room });
        io.to(room).emit('update-online-list', onlineUsers[room]);
    });

    socket.on('send-message', (data) => {
        if (!socket.username) return;
        io.to(socket.currentRoom).emit('receive-message', {
            sender: socket.username,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('disconnect', () => {
        const room = socket.currentRoom;
        if (room && onlineUsers[room]) {
            onlineUsers[room] = onlineUsers[room].filter(u => u !== socket.username);
            io.to(room).emit('update-online-list', onlineUsers[room]);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log("Canlı Sohbet Başladı!"));
