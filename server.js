const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const activeRooms = {}; 

io.on('connection', (socket) => {
    socket.on('auth-attempt', (data) => {
        const { username, room, roomPass } = data;

        if (activeRooms[room]) {
            if (activeRooms[room].password !== roomPass) {
                socket.emit('login-error', 'Hatalı Oda Şifresi! Erişim reddedildi.');
                return;
            }
        } else {
            activeRooms[room] = {
                password: roomPass,
                users: new Set()
            };
        }

        socket.username = username;
        socket.room = room;
        socket.join(room);
        activeRooms[room].users.add(username);

        socket.emit('login-success', { room: room });
        io.to(room).emit('update-online-list', Array.from(activeRooms[room].users));
    });

    socket.on('send-message', (data) => {
        if (socket.room) {
            io.to(socket.room).emit('receive-message', {
                sender: socket.username,
                text: data.text,
                time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.room && activeRooms[socket.room]) {
            activeRooms[socket.room].users.delete(socket.username);
            if (activeRooms[socket.room].users.size === 0) {
                delete activeRooms[socket.room];
            } else {
                io.to(socket.room).emit('update-online-list', Array.from(activeRooms[socket.room].users));
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`System Online on Port ${PORT}`);
});
