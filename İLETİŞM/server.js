const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statik dosyaları (HTML, CSS, JS) 'public' klasöründen çek
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // Kullanıcıya rastgele bir ID ata
    const userId = "Anon-" + Math.floor(1000 + Math.random() * 9000);
    socket.emit('my-id', userId);

    console.log(userId + " bağlandı.");

    // Mesaj geldiğinde herkese (gönderen dahil) ilet
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

// RENDER İÇİN KRİTİK DEĞİŞİKLİK: 
// Sabit 3000 yerine, sunucunun verdiği portu (process.env.PORT) kullanıyoruz.
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla çalışıyor!`);
});
