const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// HTML ve CSS dosyalarını 'public' klasöründen okumasını söyler
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // Kullanıcı bağlandığında rastgele ID oluştur
    const userId = "Anon-" + Math.floor(1000 + Math.random() * 9000);
    socket.emit('my-id', userId);
    console.log(userId + " bağlandı.");

    // Mesaj geldiğinde herkese dağıt
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

// RENDER İÇİN KRİTİK: Port ve 0.0.0.0 ayarı
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
