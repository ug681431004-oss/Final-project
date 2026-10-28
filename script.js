// ============================================================================
// API + CATEGORIES
// ============================================================================
const API_URL = 'http://localhost:5001/api';
console.log('🔗 API URL:', API_URL);

const CATEGORIES = [
  { name:"Greetings", words:[
    {en:"Hello", ar:"مرحبا", th:"สวัสดี", ms:"Helo"},
    {en:"Thank you", ar:"شكرا", th:"ขอบคุณ", ms:"Terima kasih"},
    {en:"Yes", ar:"نعم", th:"ใช่", ms:"Ya"},
    {en:"No", ar:"لا", th:"ไม่", ms:"Tidak"},
    {en:"Goodbye", ar:"مع السلامة", th:"ลาก่อน", ms:"Selamat tinggal"},
    {en:"Please", ar:"من فضلك", th:"โปรด", ms:"Sila"},
    {en:"Sorry", ar:"آسف", th:"ขอโทษ", ms:"Maaf"},
    {en:"Welcome", ar:"أهلا بك", th:"ยินดีต้อนรับ", ms:"Selamat datang"},
    {en:"Good morning", ar:"صباح الخير", th:"อรุณสวัสดิ์", ms:"Selamat pagi"},
    {en:"Good night", ar:"تصبح على خير", th:"ราตรีสวัสดิ์", ms:"Selamat malam"}
  ]},
  { name:"Numbers", words:[
    {en:"One", ar:"واحد", th:"หนึ่ง", ms:"Satu"},
    {en:"Two", ar:"اثنان", th:"สอง", ms:"Dua"},
    {en:"Three", ar:"ثلاثة", th:"สาม", ms:"Tiga"},
    {en:"Four", ar:"أربعة", th:"สี่", ms:"Empat"},
    {en:"Five", ar:"خمسة", th:"ห้า", ms:"Lima"},
    {en:"Six", ar:"ستة", th:"หก", ms:"Enam"},
    {en:"Seven", ar:"سبعة", th:"เจ็ด", ms:"Tujuh"},
    {en:"Eight", ar:"ثمانية", th:"แปด", ms:"Lapan"},
    {en:"Nine", ar:"تسعة", th:"เก้า", ms:"Sembilan"},
    {en:"Ten", ar:"عشرة", th:"สิบ", ms:"Sepuluh"}
  ]},
  { name:"Colors", words:[
    {en:"Red", ar:"أحمر", th:"สีแดง", ms:"Merah"},
    {en:"Blue", ar:"أزرق", th:"สีฟ้า", ms:"Biru"},
    {en:"Green", ar:"أخضر", th:"สีเขียว", ms:"Hijau"},
    {en:"Yellow", ar:"أصفر", th:"สีเหลือง", ms:"Kuning"},
    {en:"Black", ar:"أسود", th:"สีดำ", ms:"Hitam"},
    {en:"White", ar:"أبيض", th:"สีขาว", ms:"Putih"},
    {en:"Brown", ar:"بني", th:"สีน้ำตาล", ms:"Coklat"},
    {en:"Purple", ar:"بنفسجي", th:"สีม่วง", ms:"Ungu"}
  ]},
  { name:"Animals", words:[
    {en:"Cat", ar:"قطة", th:"แมว", ms:"Kucing"},
    {en:"Dog", ar:"كلب", th:"หมา", ms:"Anjing"},
    {en:"Bird", ar:"طائر", th:"นก", ms:"Burung"},
    {en:"Fish", ar:"سمكة", th:"ปลา", ms:"Ikan"},
    {en:"Elephant", ar:"فيل", th:"ช้าง", ms:"Gajah"},
    {en:"Horse", ar:"حصان", th:"ม้า", ms:"Kuda"},
    {en:"Lion", ar:"أسد", th:"สิงโต", ms:"Singa"},
    {en:"Rabbit", ar:"أرنب", th:"กระต่าย", ms:"Arnab"}
  ]},
  { name:"Family", words:[
    {en:"Mother", ar:"أم", th:"แม่", ms:"Ibu"},
    {en:"Father", ar:"أب", th:"พ่อ", ms:"Bapa"},
    {en:"Grandmother", ar:"جدة", th:"ยาย", ms:"Nenek"},
    {en:"Grandfather", ar:"جد", th:"ตา", ms:"Datuk"},
    {en:"Son", ar:"ابن", th:"ลูกชาย", ms:"Anak lelaki"},
    {en:"Daughter", ar:"ابنة", th:"ลูกสาว", ms:"Anak perempuan"},
    {en:"Brother", ar:"أخ", th:"พี่ชาย", ms:"Saudara lelaki"},
    {en:"Sister", ar:"أخت", th:"พี่สาว", ms:"Saudara perempuan"}
  ]},
  { name:"Food", words:[
    {en:"Rice", ar:"أرز", th:"ข้าว", ms:"Nasi"},
    {en:"Water", ar:"ماء", th:"น้ำ", ms:"Air"},
    {en:"Bread", ar:"خبز", th:"ขนมปัง", ms:"Roti"},
    {en:"Egg", ar:"بيضة", th:"ไข่", ms:"Telur"},
    {en:"Milk", ar:"حليب", th:"นม", ms:"Susu"},
    {en:"Chicken", ar:"دجاج", th:"ไก่", ms:"Ayam"},
    {en:"Fruit", ar:"فاكهة", th:"ผลไม้", ms:"Buah"},
    {en:"Apple", ar:"تفاحة", th:"แอปเปิ้ล", ms:"Epal"}
  ]}
];

// ============================================================================
// STATE
// ============================================================================
let gameState = {
  currentLesson: 0, currentQuestion: 0, totalQuestions: 8, score: 0,
  correct: 0, wrong: 0, xp: 0, hearts: 5, streak: 0, level: 1,
  lessonsCompleted: 0, questions: [], isAnswered: false
};

let currentUser = null;
let feedbackRating = 0;
let teacherId = null;

// ============================================================================
// THEME
// ============================================================================
function updateThemeButton(theme) {
  const icon = document.getElementById('themeIcon');
  const text = document.getElementById('themeText');
  if (icon && text) {
    if (theme === 'dark') { icon.textContent = '☀️'; text.textContent = 'Light'; }
    else { icon.textContent = '🌙'; text.textContent = 'Dark'; }
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);
  
  const savedToken = localStorage.getItem('authToken');
  const savedUser = localStorage.getItem('currentUser');
  if (savedToken && savedUser) {
    document.getElementById('loginModal').classList.add('hidden');
    currentUser = JSON.parse(savedUser);
    document.getElementById('navUser').style.display = 'block';
    document.getElementById('navUsername').textContent = '👤 ' + currentUser.username;
    document.getElementById('navUsername').style.color = 'var(--gold-bright)';
    routeToDashboard();
  }
});

function routeToDashboard() {
  const role = (currentUser && currentUser.role_type) ? currentUser.role_type : 'student';
  if (currentUser.username === 'admin' || role === 'admin') {
    showAdminDashboard();
  } else if (role === 'teacher') {
    showTeacherDashboard();
  } else {
    showUserDashboard();
  }
}

document.getElementById('themeToggle').addEventListener('click', function() {
  const current = document.documentElement.getAttribute('data-theme');
  const newTheme = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeButton(newTheme);
});

const topnav = document.getElementById('topnav');
window.addEventListener('scroll', () => {
  const heroEl = document.querySelector('.hero');
  if (heroEl) {
    const past = window.scrollY > heroEl.offsetHeight - 80;
    topnav.classList.toggle('show', past);
  }
});

// ============================================================================
// DICTIONARY
// ============================================================================
function buildDictionary() {
  const dictBody = document.getElementById('dictBody');
  if (!dictBody) return;
  dictBody.innerHTML = '';
  
  CATEGORIES.forEach(cat => {
    const catRow = document.createElement('tr');
    const catCell = document.createElement('td');
    catCell.colSpan = 5;
    catCell.className = 'cat-cell';
    catCell.innerHTML = `<span class="arrow" id="arrow-${cat.name}">▶</span> ${cat.name}`;
    catCell.style.cursor = 'pointer';
    catCell.style.fontWeight = 'bold';
    catCell.style.fontFamily = 'var(--mono)';
    catCell.style.fontSize = '13px';
    catCell.style.color = 'var(--gold)';
    
    let isOpen = false;
    catCell.addEventListener('click', () => {
      isOpen = !isOpen;
      const arrow = document.getElementById(`arrow-${cat.name}`);
      const wordRows = document.querySelectorAll(`.word-row-${cat.name}`);
      if (isOpen) { arrow.textContent = '▼'; wordRows.forEach(r => r.style.display = 'table-row'); }
      else { arrow.textContent = '▶'; wordRows.forEach(r => r.style.display = 'none'); }
    });
    catRow.appendChild(catCell);
    dictBody.appendChild(catRow);
    
    cat.words.forEach(w => {
      const tr = document.createElement('tr');
      tr.className = `word-row-${cat.name}`;
      tr.style.display = 'none';
      tr.innerHTML = '<td></td><td>' + w.en + '</td><td dir="rtl" class="lang-ar">' + w.ar + '</td><td class="lang-th">' + w.th + '</td><td>' + w.ms + '</td>';
      dictBody.appendChild(tr);
    });
  });
}
buildDictionary();

// ============================================================================
// DASHBOARD ROUTES
// ============================================================================
function hideAllDashboards() {
  ['userDashboard', 'adminDashboard', 'teacherDashboard', 'learn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function showUserDashboard() {
  hideAllDashboards();
  document.getElementById('userDashboard').style.display = 'block';
  document.getElementById('dictionary').style.display = 'block';
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('navUser').style.display = 'block';
  document.getElementById('navUsername').textContent = '👤 ' + currentUser.username;
  document.getElementById('navUsername').style.color = 'var(--gold-bright)';
  document.getElementById('dashUsername').textContent = currentUser.username;
  const notifWrapper = document.getElementById('notifWrapper');
  if (notifWrapper) notifWrapper.style.display = 'block';
  loadUserStats();
  loadLessons();
  loadLeaderboard();
  loadRecentActivity();
  loadFeedbackHistory();
  loadRequestHistory();
  loadAttendance();
  loadNotifications();
}

function showAdminDashboard() {
  hideAllDashboards();
  document.getElementById('adminDashboard').style.display = 'block';
  document.getElementById('dictionary').style.display = 'block';
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('navUser').style.display = 'block';
  document.getElementById('navUsername').textContent = '👤 ' + currentUser.username + ' (Admin)';
  document.getElementById('navUsername').style.color = 'var(--gold-bright)';
  document.getElementById('adminName').textContent = currentUser.username;
  const notifWrapper = document.getElementById('notifWrapper');
  if (notifWrapper) notifWrapper.style.display = 'none';
  loadAdminStats();
}

function showTeacherDashboard() {
  hideAllDashboards();
  document.getElementById('teacherDashboard').style.display = 'block';
  document.getElementById('dictionary').style.display = 'block';
  document.getElementById('heroSection').style.display = 'none';
  document.getElementById('navUser').style.display = 'block';
  document.getElementById('navUsername').textContent = '👤 ' + currentUser.username + ' (Teacher)';
  document.getElementById('navUsername').style.color = 'var(--gold-bright)';
  document.getElementById('teacherName').textContent = currentUser.username;
  const notifWrapper = document.getElementById('notifWrapper');
  if (notifWrapper) notifWrapper.style.display = 'none';

  teacherId = currentUser.id || currentUser.user_id;
  loadTeacherSummary();
  loadTeacherCourses();
  loadTeacherRequests();
  loadTeacherContent();
  loadTeacherStudentsForForms();
  loadTeacherFeedback();
  loadTeacherAttendance();
  loadTeacherProgress();
}

function showLearn() {
  hideAllDashboards();
  document.getElementById('learn').style.display = 'block';
  document.getElementById('dictionary').style.display = 'none';
}

// ============================================================================
// LESSONS
// ============================================================================
function loadLessons() {
  const grid = document.getElementById('lessonsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  CATEGORIES.forEach((cat, index) => {
    const card = document.createElement('div');
    card.className = 'lesson-card';
    const isCompleted = index < gameState.lessonsCompleted;
    const isActive = index === gameState.lessonsCompleted;
    const isLocked = index > gameState.lessonsCompleted;
    let status = 'locked';
    if (isCompleted) status = 'completed';
    else if (isActive) status = 'active';
    card.innerHTML = `
      <span class="lesson-icon">${isCompleted ? '✅' : isActive ? '📖' : '🔒'}</span>
      <div class="lesson-name">${cat.name}</div>
      <div class="lesson-status ${status}">${isCompleted ? 'Completed' : isActive ? 'Start' : 'Locked'}</div>
    `;
    if (!isLocked) card.addEventListener('click', () => startLesson(index));
    grid.appendChild(card);
  });
}

function startLesson(index) {
  gameState.currentLesson = index;
  gameState.currentQuestion = 0;
  gameState.correct = 0;
  gameState.wrong = 0;
  gameState.hearts = 5;
  gameState.isAnswered = false;
  gameState.xp = parseInt(document.getElementById('dashXp').textContent) || 0;
  const cat = CATEGORIES[index];
  const words = shuffle([...cat.words]);
  const numQuestions = Math.min(words.length, 8);
  gameState.totalQuestions = numQuestions;
  gameState.questions = [];
  for (let i = 0; i < numQuestions; i++) {
    const word = words[i];
    const toLang = ['ar', 'th', 'ms'][Math.floor(Math.random() * 3)];
    const allWords = cat.words.filter(w => w !== word);
    const distractors = shuffle(allWords).slice(0, 3).map(w => w[toLang]);
    const correctAnswer = word[toLang];
    const options = shuffle([correctAnswer, ...distractors]);
    gameState.questions.push({ word, fromLang: 'en', toLang, questionText: `What is the translation of "${word.en}"?`, correctAnswer, options });
  }
  showLearn();
  renderQuestion();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderQuestion() {
  const q = gameState.questions[gameState.currentQuestion];
  if (!q) return;
  document.getElementById('hearts').textContent = gameState.hearts;
  document.getElementById('xp').textContent = gameState.xp;
  document.getElementById('streak').textContent = gameState.streak;
  document.getElementById('level').textContent = 'Level ' + gameState.level;
  const progress = ((gameState.currentQuestion) / gameState.totalQuestions) * 100;
  document.getElementById('lessonProgress').style.width = progress + '%';
  document.getElementById('questionNumber').textContent = `${gameState.currentQuestion + 1} / ${gameState.totalQuestions}`;
  document.getElementById('questionCategory').textContent = CATEGORIES[gameState.currentLesson].name;
  document.getElementById('questionText').textContent = q.questionText;
  document.getElementById('questionWord').textContent = q.word.en;
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(btn, opt));
    container.appendChild(btn);
  });
  document.getElementById('feedbackContainer').style.display = 'none';
  document.getElementById('gameComplete').style.display = 'none';
  document.getElementById('questionContainer').style.display = 'flex';
  gameState.isAnswered = false;
}

function handleAnswer(btn, selected) {
  if (gameState.isAnswered) return;
  gameState.isAnswered = true;
  const q = gameState.questions[gameState.currentQuestion];
  const isCorrect = selected === q.correctAnswer;
  document.querySelectorAll('.option-btn').forEach(b => b.classList.add('disabled'));
  if (isCorrect) {
    btn.classList.add('correct');
    gameState.correct++;
    gameState.xp += 10;
    gameState.streak++;
    if (gameState.xp >= gameState.level * 100) gameState.level++;
  } else {
    btn.classList.add('wrong');
    gameState.wrong++;
    gameState.hearts--;
    gameState.streak = 0;
    document.querySelectorAll('.option-btn').forEach(b => { if (b.textContent === q.correctAnswer) b.classList.add('correct'); });
  }
  document.getElementById('hearts').textContent = gameState.hearts;
  document.getElementById('xp').textContent = gameState.xp;
  document.getElementById('streak').textContent = gameState.streak;
  document.getElementById('level').textContent = 'Level ' + gameState.level;
  const feedback = document.getElementById('feedbackContainer');
  feedback.style.display = 'block';
  feedback.className = 'feedback-container ' + (isCorrect ? 'correct' : 'wrong');
  document.getElementById('feedbackIcon').textContent = isCorrect ? '✅' : '❌';
  document.getElementById('feedbackText').textContent = isCorrect ? 'Correct! Well done!' : `Oops! The answer is "${q.correctAnswer}"`;
  if (gameState.hearts <= 0) {
    document.getElementById('nextQuestionBtn').textContent = 'Game Over 😢';
    document.getElementById('nextQuestionBtn').disabled = true;
    setTimeout(() => completeLesson(), 1500);
    return;
  }
  const nextBtn = document.getElementById('nextQuestionBtn');
  nextBtn.textContent = gameState.currentQuestion >= gameState.totalQuestions - 1 ? 'Finish Lesson 🎉' : 'Continue →';
  nextBtn.disabled = false;
  nextBtn.onclick = () => {
    if (gameState.currentQuestion >= gameState.totalQuestions - 1) completeLesson();
    else { gameState.currentQuestion++; renderQuestion(); }
  };
}

function completeLesson() {
  document.getElementById('questionContainer').style.display = 'none';
  document.getElementById('feedbackContainer').style.display = 'none';
  document.getElementById('gameComplete').style.display = 'block';
  document.getElementById('completeCorrect').textContent = gameState.correct;
  document.getElementById('completeWrong').textContent = gameState.wrong;
  document.getElementById('completeXp').textContent = gameState.correct * 10;
  if (gameState.hearts > 0 && gameState.correct > gameState.wrong) {
    gameState.lessonsCompleted = Math.max(gameState.lessonsCompleted, gameState.currentLesson + 1);
  }
  saveProgress();
  document.getElementById('continueBtn').onclick = () => routeToDashboard();
}

async function saveProgress() {
  const token = localStorage.getItem('authToken');
  if (!token || !currentUser) return;
  try {
    const userId = currentUser.id || currentUser.user_id;
    const quizScore = gameState.totalQuestions > 0 ? Math.round((gameState.correct / gameState.totalQuestions) * 100) : 0;
    await fetch(`${API_URL}/save-progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId, courseId: 1, lessonsCompleted: gameState.lessonsCompleted, quizScore, timeSpent: 5 })
    });
  } catch (error) { console.error('Save progress error:', error); }
}

// ============================================================================
// USER PANELS
// ============================================================================
async function loadUserStats() {
  const token = localStorage.getItem('authToken');
  if (!token || !currentUser) return;
  try {
    const userId = currentUser.id || currentUser.user_id;
    const response = await fetch(`${API_URL}/profile/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (data.success) {
      const stats = data.stats || {};
      document.getElementById('dashXp').textContent = stats.total_score || 0;
      document.getElementById('dashLessons').textContent = stats.games_played || 0;
      document.getElementById('dashStreak').textContent = 0;
      document.getElementById('dashLevel').textContent = 'Level ' + (Math.floor((stats.total_score || 0) / 100) + 1);
    }
  } catch (error) { console.error('loadUserStats:', error); }
}

async function loadLeaderboard() {
  const container = document.getElementById('leaderboardList');
  if (!container) return;
  try {
    const response = await fetch(`${API_URL}/leaderboard?limit=10`);
    const data = await response.json();
    if (!data.success || !data.leaderboard || data.leaderboard.length === 0) {
      container.innerHTML = '<div class="list-empty">No scores yet — be the first! 🎯</div>';
      return;
    }
    const myId = currentUser.id || currentUser.user_id;
    let html = '';
    data.leaderboard.forEach((u, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
      const isMe = u.id === myId;
      html += `<div class="list-item ${isMe ? 'is-me' : ''}">
        <span class="list-rank">${medal}</span>
        <span class="list-main">${escapeHtml(u.username)}${isMe ? ' <em>(you)</em>' : ''}</span>
        <span class="list-value">⭐ ${u.total_score || 0}</span>
      </div>`;
    });
    container.innerHTML = html;
  } catch (error) { container.innerHTML = '<div class="list-empty">Failed to load leaderboard</div>'; }
}

async function loadRecentActivity() {
  const container = document.getElementById('recentActivityList');
  if (!container) return;
  try {
    const userId = currentUser.id || currentUser.user_id;
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/profile/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (!data.success || !data.recentGames || data.recentGames.length === 0) {
      container.innerHTML = '<div class="list-empty">No games yet — start a lesson! 📚</div>';
      return;
    }
    let html = '';
    data.recentGames.slice(0, 5).forEach(g => {
      const date = g.played_at ? new Date(g.played_at).toLocaleDateString() : '—';
      html += `<div class="list-item">
        <span class="list-rank">🎮</span>
        <span class="list-main">${escapeHtml(g.category || 'Lesson')}<br><small style="color:var(--text-secondary);font-size:11px;">${date}</small></span>
        <span class="list-value">${g.score || 0}/${g.total_questions || 0}</span>
      </div>`;
    });
    container.innerHTML = html;
  } catch (error) { container.innerHTML = '<div class="list-empty">Failed to load activity</div>'; }
}

document.querySelectorAll('#starPicker .star').forEach(star => {
  star.addEventListener('mouseenter', function() {
    const val = parseInt(this.dataset.value);
    document.querySelectorAll('#starPicker .star').forEach(s => s.classList.toggle('hover', parseInt(s.dataset.value) <= val));
  });
  star.addEventListener('mouseleave', function() {
    document.querySelectorAll('#starPicker .star').forEach(s => s.classList.remove('hover'));
  });
  star.addEventListener('click', function() {
    feedbackRating = parseInt(this.dataset.value);
    document.querySelectorAll('#starPicker .star').forEach(s => s.classList.toggle('active', parseInt(s.dataset.value) <= feedbackRating));
  });
});

document.getElementById('submitFeedbackBtn').addEventListener('click', async function() {
  const msg = document.getElementById('feedbackMsg');
  const comment = document.getElementById('feedbackComment').value.trim();
  if (feedbackRating === 0) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Please select a rating.';
    return;
  }
  this.disabled = true;
  this.textContent = '⏳ Sending…';
  try {
    const token = localStorage.getItem('authToken');
    const userId = currentUser.id || currentUser.user_id;
    const response = await fetch(`${API_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId, rating: feedbackRating, comments: comment })
    });
    const data = await response.json();
    msg.style.display = 'block';
    if (data.success) {
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Thanks for your feedback!';
      feedbackRating = 0;
      document.querySelectorAll('#starPicker .star').forEach(s => s.classList.remove('active'));
      document.getElementById('feedbackComment').value = '';
      loadFeedbackHistory();
    } else {
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + (data.error || 'Failed');
    }
  } catch (error) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Connection error';
  }
  this.disabled = false;
  this.textContent = 'Send Feedback';
});

async function loadFeedbackHistory() {
  const container = document.getElementById('feedbackHistory');
  if (!container) return;
  try {
    const userId = currentUser.id || currentUser.user_id;
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/feedback/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (!data.success || !data.feedback || data.feedback.length === 0) { container.innerHTML = ''; return; }
    let html = '<div style="font-family:var(--mono);font-size:11px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:6px;">Your recent feedback</div>';
    data.feedback.slice(0, 3).forEach(f => {
      const stars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
      html += `<div class="mini-item"><span style="color:var(--gold);">${stars}</span><span style="color:var(--text-secondary);font-size:12px;margin-left:8px;">${escapeHtml(f.comments || '(no comment)')}</span></div>`;
    });
    container.innerHTML = html;
  } catch (error) { /* silent */ }
}

document.getElementById('submitRequestBtn').addEventListener('click', async function() {
  const msg = document.getElementById('requestMsg');
  const topic = document.getElementById('reqTopic').value.trim();
  const language = document.getElementById('reqLanguage').value;
  if (!topic) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Please enter a topic.';
    return;
  }
  this.disabled = true;
  this.textContent = '⏳ Sending…';
  try {
    const token = localStorage.getItem('authToken');
    const userId = currentUser.id || currentUser.user_id;
    const response = await fetch(`${API_URL}/learn-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId, language, topic })
    });
    const data = await response.json();
    msg.style.display = 'block';
    if (data.success) {
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Request submitted!';
      document.getElementById('reqTopic').value = '';
      loadRequestHistory();
    } else {
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + (data.error || 'Failed');
    }
  } catch (error) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Connection error';
  }
  this.disabled = false;
  this.textContent = 'Submit Request';
});

async function loadRequestHistory() {
  const container = document.getElementById('requestHistory');
  if (!container) return;
  try {
    const userId = currentUser.id || currentUser.user_id;
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/learn-requests/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (!data.success || !data.requests || data.requests.length === 0) { container.innerHTML = ''; return; }
    let html = '<div style="font-family:var(--mono);font-size:11px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:6px;">Your recent requests</div>';
    data.requests.slice(0, 3).forEach(r => {
      const color = r.request_status === 'approved' ? 'var(--green)' : r.request_status === 'rejected' ? 'var(--red)' : 'var(--gold)';
      html += `<div class="mini-item"><span style="font-weight:600;">${escapeHtml(r.lesson_topic)}</span><span style="color:var(--text-secondary);font-size:11px;margin-left:6px;">· ${escapeHtml(r.language_req)}</span><span style="color:${color};font-size:11px;margin-left:6px;font-family:var(--mono);">[${r.request_status}]</span></div>`;
    });
    container.innerHTML = html;
  } catch (error) { /* silent */ }
}

async function loadAttendance() {
  const container = document.getElementById('attendanceWidget');
  if (!container) return;
  try {
    const userId = currentUser.id || currentUser.user_id;
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/attendance/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (!data.success || !data.attendance) {
      container.innerHTML = '<div class="list-empty">No attendance data yet</div>';
      return;
    }
    const a = data.attendance;
    const rate = a.total_sessions > 0 ? Math.round((a.attended / a.total_sessions) * 100) : 0;
    container.innerHTML = `
      <div class="attendance-wrap">
        <div class="attendance-numbers">
          <div class="attendance-big">${a.attended} <span style="font-size:16px;color:var(--text-secondary);font-weight:400;">of</span> ${a.total_sessions}</div>
          <div class="attendance-label">Sessions attended</div>
        </div>
        <div class="attendance-bar-outer">
          <div class="attendance-bar-inner" style="width:${Math.min(rate,100)}%;">${rate}%</div>
        </div>
      </div>`;
  } catch (error) { container.innerHTML = '<div class="list-empty">Failed to load</div>'; }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================
async function loadNotifications() {
  const token = localStorage.getItem('authToken');
  if (!token || !currentUser) return;
  try {
    const userId = currentUser.id || currentUser.user_id;
    const response = await fetch(`${API_URL}/notifications/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (!data.success) return;
    const notifs = data.notifications || [];
    const readKey = `readNotifs_${userId}`;
    const readIds = JSON.parse(localStorage.getItem(readKey) || '[]');
    const unread = notifs.filter(n => !readIds.includes(n.id)).length;
    const badge = document.getElementById('notifBadge');
    if (badge) {
      if (unread > 0) { badge.style.display = 'inline-block'; badge.textContent = unread > 9 ? '9+' : unread; }
      else badge.style.display = 'none';
    }
    const list = document.getElementById('notifList');
    if (!list) return;
    if (notifs.length === 0) { list.innerHTML = '<div class="list-empty">You\'re all caught up! 🎉</div>'; return; }
    let html = '';
    notifs.forEach(n => {
      const isUnread = !readIds.includes(n.id);
      html += `<div class="notif-item ${isUnread ? 'unread' : ''}"><div class="notif-icon">${n.icon || '🔔'}</div><div><div class="notif-title">${escapeHtml(n.title)}</div><div class="notif-text">${escapeHtml(n.text)}</div></div></div>`;
    });
    list.innerHTML = html;
    localStorage.setItem(`latestNotifs_${userId}`, JSON.stringify(notifs.map(n => n.id)));
  } catch (error) { /* silent */ }
}

document.getElementById('notifBell').addEventListener('click', function(e) {
  e.stopPropagation();
  const panel = document.getElementById('notifPanel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block' && currentUser) {
    const userId = currentUser.id || currentUser.user_id;
    const latest = JSON.parse(localStorage.getItem(`latestNotifs_${userId}`) || '[]');
    localStorage.setItem(`readNotifs_${userId}`, JSON.stringify(latest));
    setTimeout(() => {
      const badge = document.getElementById('notifBadge');
      if (badge) badge.style.display = 'none';
      document.querySelectorAll('.notif-item').forEach(el => el.classList.remove('unread'));
    }, 800);
  }
});

document.getElementById('notifClear').addEventListener('click', function(e) {
  e.stopPropagation();
  const list = document.getElementById('notifList');
  if (list) list.innerHTML = '<div class="list-empty">You\'re all caught up! 🎉</div>';
  const badge = document.getElementById('notifBadge');
  if (badge) badge.style.display = 'none';
});

document.addEventListener('click', function(e) {
  const panel = document.getElementById('notifPanel');
  const wrapper = document.getElementById('notifWrapper');
  if (panel && wrapper && !wrapper.contains(e.target)) panel.style.display = 'none';
});

// ============================================================================
// ADMIN
// ============================================================================
async function loadAdminStats() {
  const token = localStorage.getItem('authToken');
  if (!token) return;
  try {
    const response = await fetch(`${API_URL}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (!data.success) {
      document.getElementById('adminUsersBody').innerHTML = `<tr><td colspan="15" style="text-align:center;color:var(--red);padding:20px;">Error: ${data.error}</td></tr>`;
      return;
    }
    const users = data.users || [];
    document.getElementById('adminActiveUsers').textContent = data.activeUsers || 0;
    const body = document.getElementById('adminUsersBody');
    body.innerHTML = '';
    if (users.length === 0) {
      body.innerHTML = '<tr><td colspan="15" style="text-align:center;color:var(--text-secondary);padding:20px;">No users</td></tr>';
      return;
    }
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.className = 'admin-user-row';
      tr.dataset.userId = user.id;
      tr.dataset.search = [user.username, user.email || '', user.full_name || ''].join(' ').toLowerCase();

      const statusBadge = user.status === 'active' ? '<span class="badge badge-active">active</span>' : `<span class="badge badge-inactive">${user.status || 'unknown'}</span>`;
      const roleBadge = user.role_type === 'admin' ? '<span class="badge badge-admin">admin</span>'
                       : user.role_type === 'teacher' ? '<span class="badge badge-teacher">teacher</span>'
                       : '<span class="badge badge-student">student</span>';

      const promoteBtn = (user.role_type === 'student')
        ? `<button class="promote-btn" data-uid="${user.id}" data-uname="${user.username}">⬆️ Teacher</button>`
        : '';

      tr.innerHTML = `
        <td class="expand-cell"><span class="expand-arrow">▶</span></td>
        <td>${user.id}</td>
        <td><strong>${user.username}</strong></td>
        <td>${user.email || '-'}</td>
        <td>${roleBadge}</td>
        <td>${statusBadge}</td>
        <td>${user.sessions || 0}</td>
        <td><strong>${user.total_score || 0}</strong></td>
        <td>${user.games_played || 0}</td>
        <td>${user.best_score || 0}</td>
        <td>${user.lessons_completed || 0}</td>
        <td>${user.quiz_score || 0}</td>
        <td>${user.last_login ? new Date(user.last_login).toLocaleString() : '—'}</td>
        <td>${user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
        <td>${promoteBtn}</td>
      `;

      tr.addEventListener('click', (e) => {
        if (e.target.classList.contains('promote-btn')) return;
        toggleUserDetail(tr, user.id, token);
      });

      body.appendChild(tr);
    });

    body.querySelectorAll('.promote-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const uid = btn.dataset.uid;
        const uname = btn.dataset.uname;
        if (!confirm(`Promote "${uname}" to teacher?`)) return;
        try {
          const r = await fetch(`${API_URL}/admin/promote-teacher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ userId: uid })
          });
          const d = await r.json();
          if (d.success) { alert(`✅ ${uname} is now a teacher`); loadAdminStats(); }
          else alert('❌ ' + d.error);
        } catch (err) { alert('❌ Connection error'); }
      });
    });

    const searchInput = document.getElementById('adminUserSearch');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = '1';
      searchInput.addEventListener('input', function() {
        const q = this.value.trim().toLowerCase();
        document.querySelectorAll('.admin-user-row').forEach(row => {
          const match = row.dataset.search.includes(q);
          row.style.display = match ? '' : 'none';
          const detail = row.nextElementSibling;
          if (detail && detail.classList.contains('admin-user-detail-row') && !match) detail.style.display = 'none';
        });
      });
    }
  } catch (error) {
    document.getElementById('adminUsersBody').innerHTML = `<tr><td colspan="15" style="text-align:center;color:var(--red);padding:20px;">Connection error: ${error.message}</td></tr>`;
  }
}

async function toggleUserDetail(mainRow, userId, token) {
  const next = mainRow.nextElementSibling;
  const arrow = mainRow.querySelector('.expand-arrow');
  if (next && next.classList.contains('admin-user-detail-row')) {
    const isHidden = next.style.display === 'none';
    next.style.display = isHidden ? '' : 'none';
    if (arrow) arrow.textContent = isHidden ? '▼' : '▶';
    return;
  }
  const detailRow = document.createElement('tr');
  detailRow.className = 'admin-user-detail-row';
  detailRow.innerHTML = `<td colspan="15" style="padding:0;background:var(--bg-body);"><div style="padding:16px 24px;color:var(--text-secondary);font-size:13px;">⏳ Loading details…</div></td>`;
  mainRow.parentNode.insertBefore(detailRow, mainRow.nextSibling);
  if (arrow) arrow.textContent = '▼';
  try {
    const response = await fetch(`${API_URL}/admin/users/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (!data.success) { detailRow.querySelector('div').innerHTML = `<span style="color:var(--red);">Error: ${data.error}</span>`; return; }
    const u = data.user, s = data.stats || {}, p = data.progress || [], g = data.recentGames || [];
    const progressRows = p.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary);">No progress</td></tr>'
      : p.map(row => `<tr><td>${row.progress_id}</td><td>${row.course_id}</td><td>${row.lessons_completed}</td><td>${row.quiz_score}</td><td>${row.time_spent}m</td><td>${row.last_activity_date ? new Date(row.last_activity_date).toLocaleString() : '—'}</td></tr>`).join('');
    const gamesRows = g.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary);">No games</td></tr>'
      : g.map(row => `<tr><td>${row.id}</td><td>${row.game_mode || '-'}</td><td>${row.category || '-'}</td><td>${row.score}/${row.total_questions}</td><td>${row.played_at ? new Date(row.played_at).toLocaleString() : '—'}</td></tr>`).join('');

    detailRow.querySelector('div').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:16px;">
        <div>
          <h4 style="font-family:var(--display);margin:0 0 8px;">👤 Account</h4>
          <div style="line-height:1.8;font-size:13px;">
            <div><strong>ID:</strong> ${u.id}</div>
            <div><strong>Username:</strong> ${u.username}</div>
            <div><strong>Full Name:</strong> ${u.full_name || '—'}</div>
            <div><strong>Email:</strong> ${u.email || '—'}</div>
            <div><strong>Role:</strong> ${u.role_type || 'student'}</div>
            <div><strong>Status:</strong> ${u.status || '—'}</div>
            <div><strong>Joined:</strong> ${u.created_at ? new Date(u.created_at).toLocaleString() : '—'}</div>
            <div><strong>Last Login:</strong> ${u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}</div>
          </div>
        </div>
        <div>
          <h4 style="font-family:var(--display);margin:0 0 8px;">📈 Stats</h4>
          <div style="line-height:1.8;font-size:13px;">
            <div><strong>Total Score:</strong> ${s.total_score || 0}</div>
            <div><strong>Best Score:</strong> ${s.best_score || 0}</div>
            <div><strong>Games:</strong> ${s.games_played || 0}</div>
            <div><strong>Wins:</strong> ${s.games_won || 0}</div>
            <div><strong>Sessions:</strong> ${s.sessions || 0}</div>
          </div>
        </div>
      </div>
      <h4 style="font-family:var(--display);margin:8px 0;">📚 Progress</h4>
      <div style="overflow-x:auto;margin-bottom:16px;">
        <table class="dict-table" style="font-size:12px;"><thead><tr><th>ID</th><th>Course</th><th>Lessons</th><th>Quiz</th><th>Time</th><th>Last Activity</th></tr></thead><tbody>${progressRows}</tbody></table>
      </div>
      <h4 style="font-family:var(--display);margin:8px 0;">🎮 Recent Games</h4>
      <div style="overflow-x:auto;">
        <table class="dict-table" style="font-size:12px;"><thead><tr><th>ID</th><th>Mode</th><th>Category</th><th>Score</th><th>Played</th></tr></thead><tbody>${gamesRows}</tbody></table>
      </div>
    `;
  } catch (error) {
    detailRow.querySelector('div').innerHTML = `<span style="color:var(--red);">Connection error</span>`;
  }
}

document.getElementById('addTeacherBtn').addEventListener('click', () => {
  document.getElementById('createTeacherModal').style.display = 'flex';
  document.getElementById('createTeacherMsg').style.display = 'none';
});

document.getElementById('cancelCreateTeacherBtn').addEventListener('click', () => {
  document.getElementById('createTeacherModal').style.display = 'none';
});

document.getElementById('confirmCreateTeacherBtn').addEventListener('click', async function() {
  const username = document.getElementById('newTeacherUsername').value.trim();
  const password = document.getElementById('newTeacherPassword').value.trim();
  const email = document.getElementById('newTeacherEmail').value.trim();
  const fullName = document.getElementById('newTeacherFullName').value.trim();
  const msg = document.getElementById('createTeacherMsg');

  if (!username || !password) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Username and password required';
    return;
  }
  if (password.length < 6) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Password must be 6+ characters';
    return;
  }

  this.disabled = true;
  this.textContent = '⏳ Creating…';

  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_URL}/admin/create-teacher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ username, password, email, fullName })
    });
    const data = await response.json();
    msg.style.display = 'block';
    if (data.success) {
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Teacher created!';
      document.getElementById('newTeacherUsername').value = '';
      document.getElementById('newTeacherPassword').value = '';
      document.getElementById('newTeacherEmail').value = '';
      document.getElementById('newTeacherFullName').value = '';
      setTimeout(() => {
        document.getElementById('createTeacherModal').style.display = 'none';
        loadAdminStats();
      }, 1200);
    } else {
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + data.error;
    }
  } catch (error) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Connection error';
  }
  this.disabled = false;
  this.textContent = '✅ Create Teacher';
});

// ============================================================================
// TEACHER
// ============================================================================
async function loadTeacherSummary() {
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/dashboard/${teacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    if (d.success) {
      document.getElementById('tSumStudents').textContent = d.summary.students;
      document.getElementById('tSumCourses').textContent = d.summary.courses;
      document.getElementById('tSumRequests').textContent = d.summary.requests;
      document.getElementById('tSumContent').textContent = d.summary.content;
    }
  } catch (e) { console.error(e); }
}

async function loadTeacherCourses() {
  const container = document.getElementById('teacherCoursesList');
  if (!container) return;
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/courses/${teacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    if (!d.success || d.courses.length === 0) {
      container.innerHTML = '<div class="list-empty">No courses yet — add one below</div>';
      return;
    }
    container.innerHTML = d.courses.map(c => `
      <div class="list-item">
        <span class="list-rank">📚</span>
        <span class="list-main">${escapeHtml(c.course_name)}<br><small style="color:var(--text-secondary);font-size:11px;">${escapeHtml(c.language)}</small></span>
        <span class="list-value">#${c.course_id}</span>
      </div>
    `).join('');
  } catch (e) { container.innerHTML = '<div class="list-empty">Failed to load</div>'; }
}

document.getElementById('addCourseBtn').addEventListener('click', async function() {
  const name = document.getElementById('newCourseName').value.trim();
  const lang = document.getElementById('newCourseLang').value.trim();
  const msg = document.getElementById('addCourseMsg');
  if (!name || !lang) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Name and language required';
    return;
  }
  this.disabled = true;
  try {
    const token = localStorage.getItem('authToken');
    const r = await fetch(`${API_URL}/teacher/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ teacherId, courseName: name, language: lang })
    });
    const d = await r.json();
    msg.style.display = 'block';
    if (d.success) {
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Course added!';
      document.getElementById('newCourseName').value = '';
      document.getElementById('newCourseLang').value = '';
      loadTeacherCourses();
      loadTeacherSummary();
    } else {
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + d.error;
    }
  } catch (e) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Connection error';
  }
  this.disabled = false;
});

async function loadTeacherRequests() {
  const container = document.getElementById('teacherRequestsList');
  if (!container) return;
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/requests/${teacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    if (!d.success || d.requests.length === 0) {
      container.innerHTML = '<div class="list-empty">No requests yet</div>';
      return;
    }
    let html = '';
    d.requests.forEach(req => {
      const statusColor = req.request_status === 'approved' ? 'var(--green)' : req.request_status === 'rejected' ? 'var(--red)' : 'var(--gold)';
      const actions = req.request_status === 'pending'
        ? `<button class="mini-btn approve" data-rid="${req.request_id}">✅</button> <button class="mini-btn reject" data-rid="${req.request_id}">❌</button>`
        : `<span style="color:${statusColor};font-family:var(--mono);font-size:11px;">${req.request_status}</span>`;
      html += `<div class="list-item">
        <span class="list-rank">📩</span>
        <span class="list-main">${escapeHtml(req.lesson_topic)}<br><small style="color:var(--text-secondary);font-size:11px;">${escapeHtml(req.username)} · ${escapeHtml(req.language_req)}</small></span>
        <span class="list-value">${actions}</span>
      </div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.mini-btn.approve').forEach(b => b.addEventListener('click', () => respondRequest(b.dataset.rid, 'approved')));
    container.querySelectorAll('.mini-btn.reject').forEach(b => b.addEventListener('click', () => respondRequest(b.dataset.rid, 'rejected')));
  } catch (e) { container.innerHTML = '<div class="list-empty">Failed to load</div>'; }
}

async function respondRequest(requestId, status) {
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/requests/${requestId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    const d = await r.json();
    if (d.success) { loadTeacherRequests(); loadTeacherSummary(); }
  } catch (e) { console.error(e); }
}

async function loadTeacherContent() {
  const container = document.getElementById('teacherContentList');
  if (!container) return;
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/content/${teacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    if (!d.success || d.content.length === 0) { container.innerHTML = ''; return; }
    let html = '<div style="font-family:var(--mono);font-size:11px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:6px;">Your uploaded content</div>';
    d.content.forEach(c => {
      html += `<div class="mini-item"><span style="font-weight:600;">${escapeHtml(c.content_title)}</span><span style="color:var(--text-secondary);font-size:11px;margin-left:6px;">· ${c.content_type} · ${c.difficulty_level}</span></div>`;
    });
    container.innerHTML = html;
  } catch (e) { /* silent */ }
}

document.getElementById('uploadContentBtn').addEventListener('click', async function() {
  const title = document.getElementById('newContentTitle').value.trim();
  const type = document.getElementById('newContentType').value;
  const difficulty = document.getElementById('newContentDifficulty').value;
  const msg = document.getElementById('uploadContentMsg');
  if (!title) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Title required';
    return;
  }
  this.disabled = true;
  try {
    const token = localStorage.getItem('authToken');
    const r = await fetch(`${API_URL}/teacher/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ teacherId, courseId: 1, title, type, difficulty })
    });
    const d = await r.json();
    msg.style.display = 'block';
    if (d.success) {
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Uploaded!';
      document.getElementById('newContentTitle').value = '';
      loadTeacherContent();
      loadTeacherSummary();
    } else {
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + d.error;
    }
  } catch (e) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Connection error';
  }
  this.disabled = false;
});

async function loadTeacherStudentsForForms() {
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/students/${teacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    const students = (d.success && d.students) ? d.students : [];
    const fbSelect = document.getElementById('fbStudentSelect');
    const attSelect = document.getElementById('attStudentSelect');
    if (fbSelect) fbSelect.innerHTML = '<option value="">-- choose student --</option>' + students.map(s => `<option value="${s.id}">${s.username}</option>`).join('');
    if (attSelect) attSelect.innerHTML = '<option value="">-- choose --</option>' + students.map(s => `<option value="${s.id}">${s.username}</option>`).join('');
  } catch (e) { /* silent */ }
}

document.getElementById('sendTeacherFeedbackBtn').addEventListener('click', async function() {
  const studentId = document.getElementById('fbStudentSelect').value;
  const rating = parseInt(document.getElementById('fbRating').value);
  const comments = document.getElementById('fbComment').value.trim();
  const msg = document.getElementById('teacherFeedbackMsg');
  if (!studentId || !rating) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Pick a student and rating';
    return;
  }
  this.disabled = true;
  try {
    const token = localStorage.getItem('authToken');
    const r = await fetch(`${API_URL}/teacher/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ teacherId, studentId, courseId: 1, rating, comments })
    });
    const d = await r.json();
    msg.style.display = 'block';
    if (d.success) {
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Feedback sent!';
      document.getElementById('fbComment').value = '';
      loadTeacherFeedback();
    } else {
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + d.error;
    }
  } catch (e) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Connection error';
  }
  this.disabled = false;
});

async function loadTeacherFeedback() {
  const container = document.getElementById('teacherFeedbackList');
  if (!container) return;
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/feedback/${teacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    if (!d.success || d.feedback.length === 0) { container.innerHTML = ''; return; }
    let html = '<div style="font-family:var(--mono);font-size:11px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:6px;">Recent feedback you gave</div>';
    d.feedback.forEach(f => {
      const stars = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
      html += `<div class="mini-item"><span style="color:var(--gold);">${stars}</span> <span style="font-weight:600;">${escapeHtml(f.username)}</span><br><small style="color:var(--text-secondary);">${escapeHtml(f.comments || '(no comment)')}</small></div>`;
    });
    container.innerHTML = html;
  } catch (e) { /* silent */ }
}

document.getElementById('markAttendanceBtn').addEventListener('click', async function() {
  const studentId = document.getElementById('attStudentSelect').value;
  const courseId = parseInt(document.getElementById('attCourseId').value) || 1;
  const status = document.getElementById('attStatus').value;
  const msg = document.getElementById('markAttendanceMsg');
  if (!studentId) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Pick a student';
    return;
  }
  this.disabled = true;
  try {
    const token = localStorage.getItem('authToken');
    const r = await fetch(`${API_URL}/teacher/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId: studentId, courseId, status })
    });
    const d = await r.json();
    msg.style.display = 'block';
    if (d.success) {
      msg.style.color = 'var(--green)';
      msg.textContent = '✅ Attendance recorded!';
      loadTeacherAttendance();
    } else {
      msg.style.color = 'var(--red)';
      msg.textContent = '❌ ' + d.error;
    }
  } catch (e) {
    msg.style.display = 'block';
    msg.style.color = 'var(--red)';
    msg.textContent = '❌ Connection error';
  }
  this.disabled = false;
});

async function loadTeacherAttendance() {
  const container = document.getElementById('teacherAttendanceList');
  if (!container) return;
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/attendance/${teacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    if (!d.success || d.attendance.length === 0) { container.innerHTML = ''; return; }
    let html = '<div style="font-family:var(--mono);font-size:11px;text-transform:uppercase;color:var(--text-secondary);margin-bottom:6px;">Recent attendance records</div>';
    d.attendance.slice(0, 8).forEach(a => {
      const color = a.status === 'present' ? 'var(--green)' : 'var(--red)';
      html += `<div class="mini-item">👤 <strong>${escapeHtml(a.username)}</strong> <span style="color:${color};font-family:var(--mono);font-size:11px;">[${a.status}]</span> <small style="color:var(--text-secondary);">${new Date(a.session_date).toLocaleDateString()}</small></div>`;
    });
    container.innerHTML = html;
  } catch (e) { /* silent */ }
}

async function loadTeacherProgress() {
  const container = document.getElementById('teacherProgressList');
  if (!container) return;
  const token = localStorage.getItem('authToken');
  try {
    const r = await fetch(`${API_URL}/teacher/progress/${teacherId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const d = await r.json();
    if (!d.success || d.progress.length === 0) {
      container.innerHTML = '<div class="list-empty">No students enrolled yet</div>';
      return;
    }
    let html = '';
    d.progress.forEach(s => {
      html += `<div class="list-item">
        <span class="list-rank">👤</span>
        <span class="list-main">${escapeHtml(s.username)}<br><small style="color:var(--text-secondary);font-size:11px;">Lessons: ${s.lessons_completed} · Best: ${s.best_score}</small></span>
        <span class="list-value">⭐ ${s.total_score}</span>
      </div>`;
    });
    container.innerHTML = html;
  } catch (e) { container.innerHTML = '<div class="list-empty">Failed to load</div>'; }
}

// ============================================================================
// DATABASE EXPLORER
// ============================================================================
const TABLE_META = {
  users:{icon:'👥',label:'Users'}, user_stats:{icon:'📈',label:'User Stats'},
  role:{icon:'🎭',label:'Roles'}, course_setup:{icon:'📚',label:'Courses'},
  progress_data:{icon:'📊',label:'Progress Data'}, game_history:{icon:'🎮',label:'Game History'},
  category_scores:{icon:'🏅',label:'Category Scores'}, usage_data:{icon:'📉',label:'Usage Data'},
  login_data:{icon:'🔑',label:'Login History'}, attendance:{icon:'📅',label:'Attendance'},
  feedback:{icon:'💬',label:'Feedback'}, learn_content:{icon:'📖',label:'Learn Content'},
  learn_request:{icon:'📩',label:'Learn Requests'}
};

document.getElementById('viewDataBtn').addEventListener('click', async function() {
  const token = localStorage.getItem('authToken');
  if (!token) { alert('Please login as admin'); return; }
  const explorer = document.getElementById('dbExplorer');
  const btn = this;
  btn.disabled = true;
  btn.textContent = '⏳ Loading…';
  explorer.innerHTML = `<div class="db-explorer-empty"><div style="font-size:44px;margin-bottom:8px;">⏳</div><div>Fetching all tables…</div></div>`;
  try {
    const response = await fetch(`${API_URL}/admin/all-data`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await response.json();
    if (!data.success) {
      explorer.innerHTML = `<div class="db-explorer-empty" style="color:var(--red);"><div style="font-size:44px;margin-bottom:8px;">❌</div><div>Error: ${data.error}</div></div>`;
      btn.disabled = false;
      btn.textContent = '📊 Load All Data';
      return;
    }
    renderDatabaseExplorer(data.tables);
    btn.textContent = '🔄 Refresh Data';
    btn.disabled = false;
  } catch (error) {
    explorer.innerHTML = `<div class="db-explorer-empty" style="color:var(--red);"><div style="font-size:44px;margin-bottom:8px;">❌</div><div>Connection error: ${error.message}</div></div>`;
    btn.disabled = false;
    btn.textContent = '📊 Load All Data';
  }
});

function renderDatabaseExplorer(tables) {
  const explorer = document.getElementById('dbExplorer');
  explorer.innerHTML = '';
  Object.keys(TABLE_META).forEach(tableName => {
    const tableData = tables[tableName];
    if (!tableData) return;
    const meta = TABLE_META[tableName] || { icon: '📁', label: tableName };
    const rowCount = tableData.total || tableData.rows.length;
    const section = document.createElement('div');
    section.className = 'db-section';
    const header = document.createElement('button');
    header.className = 'db-section-header';
    header.innerHTML = `
      <span class="db-section-arrow">▶</span>
      <span class="db-section-icon">${meta.icon}</span>
      <span class="db-section-name">${meta.label}</span>
      <span class="db-section-table">${tableName}</span>
      <span class="db-section-count">${rowCount} row${rowCount === 1 ? '' : 's'}</span>
    `;
    const body = document.createElement('div');
    body.className = 'db-section-body';
    body.style.display = 'none';
    if (tableData.rows.length === 0) {
      body.innerHTML = `<div class="db-empty-row">${tableData.error ? '⚠️ ' + tableData.error : 'No rows'}</div>`;
    } else {
      const cols = tableData.columns;
      let html = '<div class="db-table-wrap"><table class="db-table"><thead><tr>';
      cols.forEach(c => html += `<th>${c}</th>`);
      html += '</tr></thead><tbody>';
      tableData.rows.forEach(row => {
        html += '<tr>';
        cols.forEach(c => {
          let val = row[c];
          if (val === null || val === undefined) val = '<span class="db-null">NULL</span>';
          else if (typeof val === 'object') val = JSON.stringify(val);
          else if (typeof val === 'string' && val.length > 60) val = val.slice(0, 60) + '…';
          else val = String(val).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          html += `<td>${val}</td>`;
        });
        html += '</tr>';
      });
      html += '</tbody></table></div>';
      if (tableData.truncated) html += `<div class="db-truncated-note">Showing latest ${tableData.rows.length} of ${tableData.total} rows</div>`;
      body.innerHTML = html;
    }
    header.addEventListener('click', () => {
      const isOpen = body.style.display !== 'none';
      body.style.display = isOpen ? 'none' : 'block';
      header.querySelector('.db-section-arrow').textContent = isOpen ? '▶' : '▼';
      section.classList.toggle('open', !isOpen);
    });
    section.appendChild(header);
    section.appendChild(body);
    explorer.appendChild(section);
  });
}

// ============================================================================
// HELPERS
// ============================================================================
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================================
// LOGOUT
// ============================================================================
['logoutBtn', 'adminLogoutBtn', 'teacherLogoutBtn'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    location.reload();
  });
});

document.getElementById('exitGameBtn').addEventListener('click', function() {
  if (confirm('Exit the lesson? Your progress will be saved.')) routeToDashboard();
});

// ============================================================================
// FORGOT PASSWORD
// ============================================================================
document.getElementById('forgotPasswordLink').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('loginModal').style.display = 'none';
  document.getElementById('forgotPasswordModal').style.display = 'flex';
  document.getElementById('resetMessage').style.display = 'none';
});

document.getElementById('backToLoginBtn').addEventListener('click', function() {
  document.getElementById('forgotPasswordModal').style.display = 'none';
  document.getElementById('loginModal').style.display = 'flex';
});

document.getElementById('resetPasswordBtn').addEventListener('click', async function() {
  const username = document.getElementById('resetUsername').value.trim();
  const newPassword = prompt('Enter your new password (min 6 characters):');
  if (!newPassword) { alert('Password required'); return; }
  if (newPassword.length < 6) { alert('Password must be 6+ chars'); return; }
  const confirmPassword = prompt('Confirm your new password:');
  if (newPassword !== confirmPassword) { alert('Passwords do not match'); return; }
  this.disabled = true;
  this.textContent = '⏳ Resetting...';
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword })
    });
    const data = await response.json();
    const messageEl = document.getElementById('resetMessage');
    messageEl.style.display = 'block';
    if (data.success) {
      messageEl.style.color = 'var(--green)';
      messageEl.textContent = '✅ ' + data.message;
      setTimeout(() => {
        document.getElementById('forgotPasswordModal').style.display = 'none';
        document.getElementById('loginModal').style.display = 'flex';
        document.getElementById('resetUsername').value = '';
        messageEl.style.display = 'none';
        this.disabled = false;
        this.textContent = '🔐 Reset Password';
      }, 3000);
    } else {
      messageEl.style.color = 'var(--red)';
      messageEl.textContent = '❌ ' + data.error;
      this.disabled = false;
      this.textContent = '🔐 Reset Password';
    }
  } catch (error) {
    const messageEl = document.getElementById('resetMessage');
    messageEl.style.display = 'block';
    messageEl.style.color = 'var(--red)';
    messageEl.textContent = '❌ Connection error';
    this.disabled = false;
    this.textContent = '🔐 Reset Password';
  }
});

// ============================================================================
// LOGIN / CHOOSER / REGISTER FLOW
// ============================================================================

// -- Modal screen switcher --
function showModalScreen(screenId) {
  const screens = ['signinForm', 'chooserForm', 'registerStudentForm', 'registerTeacherForm'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === screenId) ? 'block' : 'none';
  });
}

// -- Sign In → Chooser --
document.getElementById('switchToRegister').addEventListener('click', () => {
  showModalScreen('chooserForm');
});

// -- Chooser → Sign In --
document.getElementById('chooserBackBtn').addEventListener('click', () => {
  showModalScreen('signinForm');
});

// -- Chooser → Student Form --
document.getElementById('chooseStudentBtn').addEventListener('click', () => {
  showModalScreen('registerStudentForm');
});

// -- Chooser → Teacher Form --
document.getElementById('chooseTeacherBtn').addEventListener('click', () => {
  showModalScreen('registerTeacherForm');
});

// -- Student Form → Chooser --
document.getElementById('studentBackBtn').addEventListener('click', () => {
  showModalScreen('chooserForm');
});

// -- Teacher Form → Chooser --
document.getElementById('teacherBackBtn').addEventListener('click', () => {
  showModalScreen('chooserForm');
});

// ============================================================================
// SIGN IN
// ============================================================================
document.getElementById('signinBtn').addEventListener('click', async function() {
  const username = document.getElementById('signinUsername').value.trim();
  const password = document.getElementById('signinPassword').value.trim();
  if (!username || !password) { alert('Enter username and password'); return; }
  this.disabled = true;
  this.textContent = '⏳ Signing in...';
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      currentUser = data.user;
      document.getElementById('loginModal').classList.add('hidden');
      document.getElementById('navUser').style.display = 'block';
      document.getElementById('navUsername').textContent = '👤 ' + currentUser.username;
      document.getElementById('navUsername').style.color = 'var(--gold-bright)';
      routeToDashboard();
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    alert('❌ Connection error. Make sure the server is running.');
  }
  this.disabled = false;
  this.textContent = '🔐 Sign In';
});

// ============================================================================
// REGISTER — STUDENT
// ============================================================================
document.getElementById('studentRegisterBtn').addEventListener('click', async function() {
  const username = document.getElementById('studentUsername').value.trim();
  const password = document.getElementById('studentPassword').value.trim();
  const email = document.getElementById('studentEmail').value.trim();

  if (!username || !password) { alert('Enter username and password'); return; }
  if (password.length < 6) { alert('Password must be 6+ chars'); return; }

  this.disabled = true;
  this.textContent = '⏳ Creating...';
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, teacherCode: '' })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      currentUser = data.user;
      document.getElementById('loginModal').classList.add('hidden');
      document.getElementById('navUser').style.display = 'block';
      document.getElementById('navUsername').textContent = '👤 ' + currentUser.username;
      document.getElementById('navUsername').style.color = 'var(--gold-bright)';
      routeToDashboard();
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    alert('❌ Connection error');
  }
  this.disabled = false;
  this.textContent = '🚀 Create Student Account';
});

// ============================================================================
// REGISTER — TEACHER
// ============================================================================
document.getElementById('teacherRegisterBtn').addEventListener('click', async function() {
  const username = document.getElementById('teacherUsername').value.trim();
  const password = document.getElementById('teacherPassword').value.trim();
  const email = document.getElementById('teacherEmail').value.trim();
  const teacherCode = document.getElementById('teacherInviteCode').value.trim();

  if (!username || !password) { alert('Enter username and password'); return; }
  if (password.length < 6) { alert('Password must be 6+ chars'); return; }
  if (!teacherCode) { alert('Teacher invite code is required'); return; }

  this.disabled = true;
  this.textContent = '⏳ Creating...';
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, teacherCode })
    });
    const data = await response.json();
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      currentUser = data.user;
      document.getElementById('loginModal').classList.add('hidden');
      document.getElementById('navUser').style.display = 'block';
      document.getElementById('navUsername').textContent = '👤 ' + currentUser.username;
      document.getElementById('navUsername').style.color = 'var(--gold-bright)';
      routeToDashboard();
    } else {
      alert('❌ ' + data.error);
    }
  } catch (error) {
    alert('❌ Connection error');
  }
  this.disabled = false;
  this.textContent = '🚀 Create Teacher Account';
});

// ============================================================================
// SKIP / GUEST
// ============================================================================
document.getElementById('modalSkipBtn').addEventListener('click', () => {
  document.getElementById('loginModal').classList.add('hidden');
  document.getElementById('guestRegisterBtn').style.display = 'block';
  document.getElementById('navUser').style.display = 'block';
  document.getElementById('navUsername').textContent = '👤 Guest';
});

document.getElementById('guestRegisterBtn').addEventListener('click', function() {
  document.getElementById('loginModal').classList.remove('hidden');
  this.style.display = 'none';
  showModalScreen('signinForm');
});

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const nextBtn = document.getElementById('nextQuestionBtn');
    if (nextBtn && !nextBtn.disabled && nextBtn.style.display !== 'none') nextBtn.click();
  }
  if (e.key >= '1' && e.key <= '4') {
    const options = document.querySelectorAll('.option-btn:not(.disabled)');
    if (options[e.key - 1]) options[e.key - 1].click();
  }
});

console.log('🦉 Lingua - Ready!');