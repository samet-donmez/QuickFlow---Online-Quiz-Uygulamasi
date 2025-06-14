// utils/quizUtils.js
const db = require('../db/connection');

async function getQuestionsByQuizId(quizId) {
  try {
    const [rows] = await db.query('SELECT * FROM questions WHERE quiz_id = ?', [quizId]);

    // Burası çok önemli: Veritabanından gelen 'correct_option' sütununu
    // JavaScript objesinde 'correctOption' (camelCase) olarak eşliyoruz.
    const questions = rows.map(row => ({
      id: row.id,
      quiz_id: row.quiz_id,
      text: row.text,
      option1: row.option1,
      option2: row.option2,
      option3: row.option3,
      option4: row.option4,
      correctOption: row.correct_option // <<< Bu satır kritik!
    }));

    return questions;
  } catch (error) {
    console.error('Error fetching questions by quiz ID:', error);
    throw new Error('Could not retrieve questions for quiz.');
  }
}

module.exports = { getQuestionsByQuizId };