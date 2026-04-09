const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Odaları ve şifrelerini hafızada tutan obje
const activeRooms = {}; 

io.on('connection', (socket) => {
    socket.on('auth-attempt', (data) => {
        const { username, room, roomPass } = data;

        // Oda daha önce kurulmuş mu kontrol et
        if (activeRooms[room]) {
            // Oda varsa şifreyi kontrol et
            if (activeRooms[room].password !== roomPass) {
                socket.emit('login-error', 'Hatalı Oda Şifresi! Lütfen tekrar deneyin.');
                return;
            }
        } else {
            // Oda yoksa, yeni odayı ve şifresini kaydet
            activeRooms[room] = {
                password: roomPass,
                users: new Set()
            };
        }

        // Giriş başarılı
        socket.username = username;
        socket.room = room;
        
        socket.join(room);
        activeRooms[room].users.add(username);

        socket.emit('login-success', { room: room });

        // Odadaki kullanıcı listesini güncelle
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
            
            // Oda boşaldıysa odayı sil (sunucuyu yormasın)
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
    console.log(`GlowVibe Server ${PORT} portunda aktif!`);
});
