const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Kullanıcı profillerini (kullanıcı adı: şifre) RAM'de tutan liste
const registeredUsers = {};

io.on('connection', (socket) => {
    
    socket.on('auth-attempt', (data) => {
        const { username, password, room } = data;

        // Profil kontrolü
        if (registeredUsers[username]) {
            // Kullanıcı var, şifre doğru mu?
            if (registeredUsers[username] !== password) {
                return socket.emit('login-error', 'Bu kullanıcı adı kayıtlı ve şifre yanlış!');
            }
        } else {
            // Yeni profil oluştur (Hafızaya al)
            registeredUsers[username] = password;
        }

        // Giriş başarılı
        socket.username = username;
        socket.currentRoom = room;
        socket.join(room);
        
        socket.emit('login-success', { username, room });
    });

    socket.on('send-message', (data) => {
        if (!socket.username || !socket.currentRoom) return;

        // Mesajı sadece o odadakilere anlık ilet (Hafızaya kaydetme)
        io.to(socket.currentRoom).emit('receive-message', {
            sender: socket.username,
            text: data.text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda profil desteğiyle çalışıyor.`);
});
