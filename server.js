const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Dosyaları 'public' klasöründen sun
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    // Rastgele kullanıcı ID'si oluştur
    const userId = "Anon-" + Math.floor(1000 + Math.random() * 9000);
    socket.emit('my-id', userId);
    console.log(userId + " bağlandı.");

    // Mesaj geldiğinde herkese gönder
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

// Render ve dış dünya için port ayarı
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
