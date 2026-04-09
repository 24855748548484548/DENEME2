const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Odaları ve şifreleri hafızada tutan obje
const activeRooms = {}; 

io.on('connection', (socket) => {
    console.log('Yeni bir bağlantı:', socket.id);

    socket.on('auth-attempt', (data) => {
        const { username, room, roomPass } = data;

        // Oda kontrolü ve şifre doğrulama
        if (activeRooms[room]) {
            if (activeRooms[room].password !== roomPass) {
                socket.emit('login-error', 'Hatalı Oda Şifresi! Erişim engellendi.');
                return;
            }
        } else {
            // Oda yoksa oluştur ve şifreyi kilitle
            activeRooms[room] = {
                password: roomPass,
                users: {} // socket.id -> username map'i
            };
        }

        // Kullanıcıyı odaya al
        socket.username = username;
        socket.room = room;
        socket.join(room);
        
        // Online listesine ekle
        activeRooms[room].users[socket.id] = username;

        socket.emit('login-success', { room: room });

        // Odadaki herkese güncel online listesini gönder
        const userList = Object.values(activeRooms[room].users);
        io.to(room).emit('update-online-list', userList);
    });

    socket.on('send-message', (data) => {
        if (socket.room && socket.username) {
            // Mesajı odadaki herkese (gönderen dahil) ilet
            io.to(socket.room).emit('receive-message', {
                sender: socket.username,
                text: data.text
            });
        }
    });

    socket.on('disconnect', () => {
        if (socket.room && activeRooms[socket.room]) {
            // Kullanıcıyı listeden sil
            delete activeRooms[socket.room].users[socket.id];
            
            const userList = Object.values(activeRooms[socket.room].users);
            
            if (userList.length === 0) {
                delete activeRooms[socket.room];
            } else {
                io.to(socket.room).emit('update-online-list', userList);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Güvenli Sunucu Aktif: ${PORT}`));
