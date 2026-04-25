const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(path.join(__dirname, 'butce.db'));

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS kayitlar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        donem TEXT UNIQUE,
        gelir INTEGER,
        veriler TEXT,
        tarih DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

app.get('/api/kayit/:donem', (req, res) => {
    const { donem } = req.params;
    db.get(`SELECT * FROM kayitlar WHERE donem = ?`, [donem], (err, row) => {
        if (err) return res.status(500).send(err.message);
        res.json(row || null);
    });
});

app.post('/api/kaydet', (req, res) => {
    const { donem, gelir, veriler } = req.body;
    db.run(`INSERT OR REPLACE INTO kayitlar (donem, gelir, veriler) VALUES (?, ?, ?)`, 
    [donem, gelir, JSON.stringify(veriler)], (err) => {
        if (err) return res.status(500).send(err.message);
        res.json({ success: true });
    });
});

// Grafik için tüm verileri çekme
app.get('/api/analiz', (req, res) => {
    db.all(`SELECT donem, gelir FROM kayitlar ORDER BY id ASC`, [], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.json(rows);
    });
});
app.get('/api/analiz/:yil', (req, res) => {
    const { yil } = req.params;
    // Seçilen yıla ait tüm ayları getirir
    db.all(`SELECT donem, gelir, veriler FROM kayitlar WHERE donem LIKE ?`, [`%${yil}`], (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.json(rows);
    });
});
// Eğer birisi siteadi.com/mobile adresine girerse mobile.html'i gönder
app.get('/mobile', (req, res) => {
    res.sendFile(path.join(__dirname, 'www', 'mobile.html'));
});
app.listen(3000, () => console.log('Sistem 3000 portunda aktif!'));
