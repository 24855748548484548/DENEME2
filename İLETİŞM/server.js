const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // Kullanıcıya rastgele ID ver
    const userId = "Anon-" + Math.floor(1000 + Math.random() * 9000);
    socket.emit('my-id', userId);

    console.log(userId + " bağlandı.");

    // Mesaj geldiğinde herkese ilet
    socket.on('send-message', (data) => {
        io.emit('receive-message', {
            id: userId,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('disconnect', () => {
        console.log(userId + " ayrıldı.");
    });
});

server.listen(3000, () => {
    console.log('Sunucu 3000 portunda çalışıyor. Tarayıcıdan http://localhost:3000 adresine gidin.');
});