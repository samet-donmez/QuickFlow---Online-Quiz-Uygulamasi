const express = require('express');
const path = require('path');
const hbs = require('hbs');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const db = require('../db/connection'); // Veritabanı bağlantını buraya uyarlamalısın


const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);




const JWT_SECRET = 'gizli_kelime'; // .env dosyasına taşıman önerilir

// View ve public klasör ayarları
const publicPath = path.join(__dirname, '../public');
const viewPath = path.join(__dirname, '../templates/views');
const partialsPath = path.join(__dirname, '../templates/partials');

hbs.registerHelper('inc', function(value) {
  return parseInt(value) + 1;
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(publicPath));


app.set('view engine', 'hbs');
app.set('views', viewPath);
hbs.registerPartials(partialsPath);

// eq helper'ını kaydet
hbs.registerHelper('eq', function(a, b) {
  return a === b;
});

// JWT doğrulama middleware
function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    res.locals.user = null;  // ekle
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
      res.locals.user = null;  // ekle
      return next();
    }
    req.user = user;
    res.locals.user = user;  // ekle
    next();
  });
}




app.use(authenticateToken);

// Ana sayfa
app.get('/', (req, res) => {
  if (req.user) {
    res.render('index', { title: 'QuizFlow', user: req.user });
  } else {
    res.render('index', { title: 'QuizFlow' });
  }
});

// Kayıt sayfası
app.get('/register', (req, res) => {
  res.render('register', { title: 'Kayıt Ol' });
});

// Kayıt işlemi
app.post('/register', async (req, res) => {
  const { name, password, role } = req.body;
  if (!name || !password || !role) return res.status(400).send('Eksik alan var');

  try {
    const [rows] = await db.query('SELECT * FROM uyeler WHERE name = ?', [name]);
    if (rows.length > 0) return res.status(400).send('Kullanıcı adı zaten alınmış');

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query('INSERT INTO uyeler (name, password, role) VALUES (?, ?, ?)', [
      name,
      hashedPassword,
      role,
    ]);

    res.redirect('/login');
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).send('Sunucu hatası');
  }
});

// Giriş sayfası
app.get('/login', (req, res) => {
  res.render('login', { title: 'Giriş Yap' });
});

// Giriş işlemi
app.post('/login', async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) return res.status(400).send('Eksik alan var');

  try {
    const [rows] = await db.query('SELECT * FROM uyeler WHERE name = ?', [name]);
    if (rows.length === 0) return res.status(400).send('Kullanıcı bulunamadı');

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).send('Şifre yanlış');

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.cookie('token', token, { httpOnly: true /*, secure: true HTTPS için*/ });

    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Sunucu hatası');
  }
});


app.post('/quizolustur', async (req, res) => {
  const { title, questions } = req.body;

  if (!title || !questions) {
    return res.status(400).send('Eksik quiz verisi');
  }

  try {
    // 1. Quiz'i ekle
    const [quizResult] = await db.query(
      'INSERT INTO quizzes (title, created_at) VALUES (?, NOW())',
      [title]
    );

    const quizId = quizResult.insertId;

    // 2. Soruları topluca ekle
    const questionData = [];

Object.values(questions).forEach((q) => {
  questionData.push([
    quizId,
    q.text,
    q.options[0],
    q.options[1],
    q.options[2],
    q.options[3],
    String(q.correct) // sayıysa bile string'e çevir
  ]);
});

console.log('[Kontrol] Eklenecek veriler:', questionData);

await db.query(
  `INSERT INTO questions (quiz_id, text, option1, option2, option3, option4, correct_option) VALUES ?`,
  [questionData]
);


    res.send('Quiz başarıyla eklendi!');
  } catch (err) {
    console.error('Quiz ekleme hatası:', err);
    res.status(500).send('Quiz eklenirken bir hata oluştu');
  }
});



app.get('/quizolustur', (req, res) => {
  res.render('quizolustur', { title: 'Quiz Oluştur' });
});

// Çıkış işlemi
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

app.get('/hakkinda', (req, res) => {
  res.render('about', { title: 'Hakkında' });
});

app.get('/yardim', (req, res) => {
  res.render('help', { title: 'Yardım' });
});

app.get('/quiz', async (req, res) => {
  try {
    const [quizzes] = await db.query('SELECT id, title, created_at FROM quizzes ORDER BY created_at DESC');
    res.render('quiz', { title: 'Quiz Listesi', quizzes });
  } catch (err) {
    console.error('Quiz listesi çekilirken hata:', err);
    res.status(500).send('Sunucu hatası');
  }
});

app.get('/quiz/:id', async (req, res) => {
  const quizId = req.params.id;

  try {
    // Quiz başlığı çekiliyor
    const [quizRows] = await db.query('SELECT * FROM quizzes WHERE id = ?', [quizId]);
    if (quizRows.length === 0) {
      return res.status(404).send('Quiz bulunamadı');
    }
    const quiz = quizRows[0];

    // Quiz soruları çekiliyor
    const [questions] = await db.query(
      'SELECT * FROM questions WHERE quiz_id = ?',
      [quizId]
    );

    res.render('quiz_detail', { title: quiz.title, quiz, questions, user: req.user }); // user bilgisini ekledik
  } catch (err) {
    console.error('Quiz detay hatası:', err);
    res.status(500).send('Sunucu hatası');
  }
});




// 404 Sayfası
app.get('*', (req, res) => {
  res.status(404).render('404', {
    title: '404',
    errorMessage: 'Sayfa bulunamadı.',
  });
});



const setupSocket = require('../db/socket');
setupSocket(io);

server.listen(3005, () => {
  console.log('Server 3005 portunda socket.io ile çalışıyor...');
});