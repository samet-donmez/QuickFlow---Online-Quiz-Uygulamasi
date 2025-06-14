const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'gizli_kelime'; 

// Kayıt
router.post('/register', async (req, res) => {
  const { name, password, role } = req.body;
  if (!name || !password || !role) return res.status(400).send('Eksik alan var');

  try {
    const [rows] = await db.query('SELECT * FROM uyeler WHERE name = ?', [name]);
    if (rows.length > 0) {
      return res.status(400).send('Kullanıcı adı zaten alınmış');
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query('INSERT INTO uyeler (name, password, role) VALUES (?, ?, ?)', [name, hashedPassword, role]);

    res.status(201).send('Kayıt başarılı');
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).send('Sunucu hatası');
  }
});

// Giriş
router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).send('Eksik alan var');

  try {
    const [rows] = await db.query('SELECT * FROM uyeler WHERE name = ?', [name]);
    if (rows.length === 0) return res.status(400).send('Kullanıcı bulunamadı');

    const user = rows[0];

    // Şifre doğrula
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).send('Şifre yanlış');

    // JWT oluştur
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Token'ı cookie olarak gönder (HTTP only ve güvenli yap)
    res.cookie('token', token, { httpOnly: true /*, secure: true HTTPS için*/ });

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Sunucu hatası');
  }
});

module.exports = router;
