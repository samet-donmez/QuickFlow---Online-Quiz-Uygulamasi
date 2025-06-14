const { getQuestionsByQuizId } = require('./quizUtils');
const pool = require('./connection');

const sessions = {}; // sessionId: { players, currentQuestionIndex, questions, interval }

function setupSocket(io) {
  io.on('connection', (socket) => {
    console.log('Yeni bağlantı:', socket.id);

    socket.on('joinQuiz', async ({ sessionId, playerName, quizId }) => {
  socket.join(sessionId);

  if (!sessions[sessionId]) {
    const questions = await getQuestionsByQuizId(quizId);
    sessions[sessionId] = {
      players: {},
      currentQuestionIndex: 0,
      questions,
      interval: null,
      quizStarted: false,
      answers: {},
      quizId,
      countdown: 10,
    };
  }

  // Kullanıcı zaten oturumdaki oyuncularda mı?
  // Bu kontrol, kullanıcı aynı oturuma tekrar bağlandığında skorunu sıfırlamamayı sağlar.
  // Eğer tamamen yeni bir quiz deneyimi isteniyorsa, bu if koşulu kaldırılabilir.
  if (!sessions[sessionId].players[socket.id]) {
      // **ÖNEMLİ DEĞİŞİKLİK BURADA BAŞLIYOR**
      // Her yeni katılımda (yeni bir soket ID ile) skoru 0 olarak başlat.
      const startingScore = 0; // Her girişte skoru sıfırla

      sessions[sessionId].players[socket.id] = { name: playerName, score: startingScore };
      sessions[sessionId].answers[socket.id] = null;

      // Veritabanındaki eski skoru da sıfırlayalım ki, çıkış yapsa bile eski skor yüklenmesin.
      // Bu, oyuncunun o quiz için önceki kaydını '0'a çeker.
      try {
          await pool.query(
              `INSERT INTO player_scores (quiz_id, player_name, score)
               VALUES (?, ?, ?)
               ON DUPLICATE KEY UPDATE score = ?`,
              [quizId, playerName, startingScore, startingScore] // skoru 0 olarak gönderiyoruz
          );
          console.log(`[DB] Oyuncu ${playerName} için quiz ${quizId} skoru sıfırlandı.`);
      } catch (dbError) {
          console.error(`[DB HATA] Oyuncu ${playerName} için skor sıfırlanırken hata oluştu:`, dbError.message || dbError);
      }
      // **ÖNEMLİ DEĞİŞİKLİK BURADA BİTİYOR**
  } else {
      // Eğer kullanıcı zaten oturumda ise (örneğin sayfa yenileme)
      // Mevcut skorunu koru ve veritabanından çekme.
      // (Bu kısım, kullanıcı deneyimine göre ayarlanabilir.)
      console.log(`[BILGI] Oyuncu ${playerName} zaten oturumda. Skor korundu.`);
  }


  io.to(sessionId).emit('playerList', sessions[sessionId].players);

  if (sessions[sessionId].quizStarted && Object.keys(sessions[sessionId].players).length > 1) {
    const currentQuestion = sessions[sessionId].questions[sessions[sessionId].currentQuestionIndex];
    if (currentQuestion) {
      socket.emit('newQuestion', currentQuestion);
      socket.emit('countdown', sessions[sessionId].countdown);
    }
  }

    // Quiz'i otomatik olarak başlatmak yerine, instructor'ın 'startQuiz' event'ini bekle.
  // if (!sessions[sessionId].quizStarted) {
  //   sessions[sessionId].quizStarted = true;
  //   sendQuestion(io, sessionId);
  // }
});

    // Yeni: Quizi başlatma olayı
    socket.on('startQuiz', ({ sessionId }) => {
        const session = sessions[sessionId];
        if (!session) {
            console.log(`[HATA] Oturum bulunamadı: ${sessionId}`);
            return;
        }

        // Sadece quiz daha önce başlatılmadıysa başlatalım
        if (!session.quizStarted) {
            session.quizStarted = true;
            io.to(sessionId).emit('quizStartedConfirmation'); // Butonu gizlemek için istemcilere bilgi gönder
            sendQuestion(io, sessionId);
            console.log(`Quiz ${sessionId} başlatıldı.`);
        } else {
            console.log(`Quiz ${sessionId} zaten başlatılmış.`);
        }
    });

    socket.on('submitAnswer', async ({ sessionId, selectedOption }) => {
  console.log(`[submitAnswer] Geldi: sessionId=${sessionId}, selectedOption=${selectedOption}`);
  const session = sessions[sessionId];
  if (!session) {
    console.log(`[HATA] Oturum bulunamadı: ${sessionId}`);
    return;
  }

  const player = session.players[socket.id];
  if (!player) {
    console.log(`[HATA] Oyuncu bulunamadı (socket.id): ${socket.id}`);
    return;
  }

  if (session.answers[socket.id] !== null) {
    console.log(`[BILGI] Oyuncu ${player.name} zaten cevap vermiş. Cevap geçersiz sayılıyor.`);
    return;
  }

  const currentQuestion = session.questions[session.currentQuestionIndex];
  if (!currentQuestion) {
    console.log(`[HATA] Mevcut soru bulunamadı. currentQuestionIndex: ${session.currentQuestionIndex}`);
    return;
  }

  session.answers[socket.id] = selectedOption;

  console.log('--- Cevap Karşılaştırması Başladı ---');
  console.log(`currentQuestion.correctOption (Doğru Cevap):`, currentQuestion.correctOption, `(Tip: ${typeof currentQuestion.correctOption})`);
  console.log(`selectedOption (Oyuncu Cevabı):`, selectedOption, `(Tip: ${typeof selectedOption})`);
  console.log(`Karşılaştırma sonucu (selectedOption === currentQuestion.correctOption):`, selectedOption === currentQuestion.correctOption);
  console.log('--- Cevap Karşılaştırması Bitti ---');


  // Doğrudan sayısal karşılaştırma kullanıyoruz, TINYINT ile uyumlu olması için.
  if (selectedOption === currentQuestion.correctOption) {
    player.score += 10;
    console.log(`[PUAN] Doğru cevap! Oyuncu ${player.name} yeni puanı: ${player.score}`);

    const quizId = session.quizId;
    const playerName = player.name;

    try {
      await pool.query(
        `INSERT INTO player_scores (quiz_id, player_name, score)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE score = ?`,
        [quizId, playerName, player.score, player.score]
      );
      console.log(`[DB SUCCESS] ${playerName} için puan veritabanına başarıyla kaydedildi/güncellendi: ${player.score}`);
    } catch (dbError) {
      console.error('[DB HATA] Puan veritabanına kaydedilirken/güncellenirken bir hata oluştu:');
      console.error(dbError); // Hata objesinin tamamını yazdırıyoruz
      console.error('Hata mesajı:', dbError.message);
    }
  } else {
      console.log(`[PUAN] Yanlış cevap! Oyuncu ${player.name} puanı değişmedi. Doğru: ${currentQuestion.correctOption}, Cevap: ${selectedOption}`);
  }

  io.to(sessionId).emit('scoreUpdate', session.players);
});

    socket.on('disconnect', () => {
      for (const sessionId in sessions) {
        if (sessions[sessionId].players[socket.id]) {
          delete sessions[sessionId].players[socket.id];
          io.to(sessionId).emit('playerList', sessions[sessionId].players);
        }
      }
    });
  });
}

function sendQuestion(io, sessionId) {
  const session = sessions[sessionId];
  if (!session) return;

  if (session.interval) {
    clearInterval(session.interval);
    session.interval = null;
  }

  const question = session.questions[session.currentQuestionIndex];
  if (!question) {
    // Tüm sorular bittiğinde quiz sonlanır.
    // Son skor tablosunu göstermek için quiz bittiğinde de showScores'u tetikleyebiliriz.
    io.to(sessionId).emit('showScores', session.players); // Quiz bittiğinde son skorları göster
    io.to(sessionId).emit('quizEnded');
    delete sessions[sessionId];
    console.log(`Quiz sonlandı, session ${sessionId} silindi.`);
    return;
  }

  // Oyuncuların önceki cevaplarını sıfırla
  Object.keys(session.answers).forEach((key) => {
    session.answers[key] = null;
  });

  io.to(sessionId).emit('newQuestion', question);

  let countdown = 10; // Yeni soru için geri sayımı başlat
  session.countdown = countdown; // Mevcut geri sayımı session'da sakla (yeni katılanlar için)

  session.interval = setInterval(() => {
    io.to(sessionId).emit('countdown', countdown);
    countdown--;
    session.countdown = countdown; // Her saniye güncellenen geri sayım değerini session'da tut

    if (countdown < 0) {
      clearInterval(session.interval);
      session.interval = null;

      // Geri sayım bittiğinde (yani soru süresi dolduğunda) skorları göster
      io.to(sessionId).emit('showScores', session.players);

      // Yeni soruyu göndermeden önce kısa bir gecikme ekliyoruz,
      // böylece oyuncular skor tablosunu görebilir.
      setTimeout(() => {
        session.currentQuestionIndex++; // Bir sonraki soruya geç
        sendQuestion(io, sessionId); // Yeni soruyu gönder
      }, 3000); // 3 saniye bekle, sonra yeni soruyu gönder (bu süreyi ayarlayabilirsiniz)
    }
  }, 1000);

  console.log('Player list for session', sessionId, sessions[sessionId].players);
}
module.exports = setupSocket;