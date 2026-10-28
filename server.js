require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5001;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Database connection error:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ============================================
// CREATE TABLES + ROLE MIGRATION
// ============================================
async function initDatabase() {
    try {
        console.log('🔄 Creating database tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                full_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active'
            );
        `);

        // role_id migration
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER DEFAULT 3;`);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_stats (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                total_score INTEGER DEFAULT 0,
                games_played INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                games_won INTEGER DEFAULT 0,
                sessions INTEGER DEFAULT 0,
                last_played TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS role (
                role_id SERIAL PRIMARY KEY,
                role_type VARCHAR(50) NOT NULL UNIQUE,
                access_level INTEGER DEFAULT 1,
                assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                role_status VARCHAR(20) DEFAULT 'active'
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS course_setup (
                course_id SERIAL PRIMARY KEY,
                teacher_id INTEGER,
                course_name VARCHAR(100) NOT NULL,
                language VARCHAR(50) NOT NULL,
                schedule VARCHAR(100),
                start_date DATE,
                end_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS progress_data (
                progress_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER DEFAULT 1,
                lessons_completed INTEGER DEFAULT 0,
                quiz_score INTEGER DEFAULT 0,
                time_spent INTEGER DEFAULT 0,
                last_activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                overall_progress DECIMAL(5,2) DEFAULT 0
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS game_history (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                game_mode VARCHAR(50),
                score INTEGER DEFAULT 0,
                total_questions INTEGER DEFAULT 0,
                category VARCHAR(50),
                played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS category_scores (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                category VARCHAR(50) NOT NULL,
                total_score INTEGER DEFAULT 0,
                games_count INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                UNIQUE(user_id, category)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS usage_data (
                usage_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                total_logins INTEGER DEFAULT 0,
                lessons_opened INTEGER DEFAULT 0,
                activities_completed INTEGER DEFAULT 0,
                time_online INTEGER DEFAULT 0,
                last_login_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS login_data (
                login_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                username VARCHAR(50) NOT NULL,
                password VARCHAR(255) NOT NULL,
                session_token VARCHAR(255),
                login_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                login_status VARCHAR(20) DEFAULT 'success'
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance (
                attendance_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES course_setup(course_id) ON DELETE CASCADE,
                session_date DATE DEFAULT CURRENT_DATE,
                status VARCHAR(20) DEFAULT 'present',
                total_sessions INTEGER DEFAULT 0,
                attendance_rate DECIMAL(5,2) DEFAULT 0.00,
                UNIQUE(user_id, course_id, session_date)
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedback (
                feedback_id SERIAL PRIMARY KEY,
                teacher_id INTEGER REFERENCES users(id),
                student_id INTEGER REFERENCES users(id),
                course_id INTEGER REFERENCES course_setup(course_id),
                comments TEXT,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS learn_content (
                content_id SERIAL PRIMARY KEY,
                course_id INTEGER REFERENCES course_setup(course_id) ON DELETE CASCADE,
                teacher_id INTEGER REFERENCES users(id),
                content_title VARCHAR(200) NOT NULL,
                content_type VARCHAR(50) NOT NULL,
                difficulty_level VARCHAR(20) DEFAULT 'beginner',
                upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS learn_request (
                request_id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                course_id INTEGER REFERENCES course_setup(course_id) ON DELETE CASCADE,
                language_req VARCHAR(50) NOT NULL,
                lesson_topic VARCHAR(200) NOT NULL,
                request_date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                request_status VARCHAR(20) DEFAULT 'pending'
            );
        `);

        console.log('✅ All tables ready');

        // Seed roles
        const roleCheck = await pool.query('SELECT * FROM role WHERE role_type = $1', ['admin']);
        if (roleCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO role (role_type, access_level) VALUES 
                    ('admin', 3),
                    ('teacher', 2),
                    ('student', 1);
            `);
        }

        const courseCheck = await pool.query('SELECT * FROM course_setup WHERE course_id = 1');
        if (courseCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO course_setup (course_id, course_name, language, schedule) 
                VALUES (1, 'General Vocabulary', 'Multilingual', 'Self-paced');
            `);
        }

        const adminCheck = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
        if (adminCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO users (username, password_hash, email, full_name, status, role_id) 
                VALUES ('admin', '$2a$10$CpFPl8mza/G9RP6.t6w7Fe92IHgojczAhAlNfpzHjGevMUdWZruYa', 'admin@system.com', 'System Admin', 'active', 1);
            `);
        }

        // Backfill role_ids
        await pool.query(`UPDATE users SET role_id = 1 WHERE username = 'admin';`);
        await pool.query(`UPDATE users SET role_id = 3 WHERE role_id IS NULL;`);

        const statsCheck = await pool.query(`
            SELECT * FROM user_stats WHERE user_id = (SELECT id FROM users WHERE username = 'admin')
        `);
        if (statsCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO user_stats (user_id) 
                SELECT id FROM users WHERE username = 'admin';
            `);
        }

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database init error:', error);
    }
}

initDatabase();

// ============================================
// AUTH MIDDLEWARE
// ============================================
function requireAdmin(req, res, next) {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) token = req.query.token;

    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role_type !== 'admin' && decoded.username !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

function requireTeacher(req, res, next) {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) token = req.query.token;

    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role_type !== 'teacher' && decoded.role_type !== 'admin' && decoded.username !== 'admin') {
            return res.status(403).json({ success: false, error: 'Teacher access required' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}

// ============================================
// ADMIN - GET ALL USERS
// ============================================
app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.email,
                u.full_name,
                u.created_at,
                u.last_login,
                u.status,
                u.role_id,
                COALESCE(r.role_type, 'student') AS role_type,
                COALESCE(us.total_score, 0)  AS total_score,
                COALESCE(us.games_played, 0) AS games_played,
                COALESCE(us.best_score, 0)   AS best_score,
                COALESCE(us.games_won, 0)    AS games_won,
                COALESCE(us.sessions, 0)     AS sessions,
                us.last_played,
                COALESCE(p.lessons_completed, 0) AS lessons_completed,
                COALESCE(p.quiz_score, 0)        AS quiz_score,
                COALESCE(p.time_spent, 0)        AS time_spent,
                p.last_activity_date,
                COALESCE(g.game_count, 0)   AS game_count
            FROM users u
            LEFT JOIN role r ON u.role_id = r.role_id
            LEFT JOIN user_stats us ON u.id = us.user_id
            LEFT JOIN (
                SELECT user_id,
                       SUM(lessons_completed) AS lessons_completed,
                       MAX(quiz_score)        AS quiz_score,
                       SUM(time_spent)        AS time_spent,
                       MAX(last_activity_date) AS last_activity_date
                FROM progress_data
                GROUP BY user_id
            ) p ON u.id = p.user_id
            LEFT JOIN (
                SELECT user_id, COUNT(*) AS game_count
                FROM game_history
                GROUP BY user_id
            ) g ON u.id = g.user_id
            ORDER BY u.id
        `);

        const activeResult = await pool.query(`
            SELECT COUNT(*) AS active_count
            FROM users
            WHERE last_login IS NOT NULL
              AND last_login >= NOW() - INTERVAL '7 days'
        `);

        res.json({
            success: true,
            users: result.rows,
            activeUsers: parseInt(activeResult.rows[0].active_count, 10) || 0
        });
    } catch (error) {
        console.error('❌ Admin users error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// ADMIN - CREATE TEACHER
// ============================================
app.post('/api/admin/create-teacher', requireAdmin, async (req, res) => {
    const { username, password, email, fullName } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    try {
        const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (exists.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'Username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO users (username, password_hash, email, full_name, status, role_id)
             VALUES ($1, $2, $3, $4, 'active', 2)
             RETURNING id, username, email, full_name, created_at, role_id`,
            [username, hashedPassword, email || null, fullName || username]
        );

        await pool.query(
            `INSERT INTO user_stats (user_id) VALUES ($1)`,
            [result.rows[0].id]
        );

        res.status(201).json({
            success: true,
            message: 'Teacher created successfully',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Create teacher error:', error);
        res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
});

// ============================================
// ADMIN - PROMOTE STUDENT TO TEACHER
// ============================================
app.post('/api/admin/promote-teacher', requireAdmin, async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    try {
        const userCheck = await pool.query('SELECT id, username, role_id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (userCheck.rows[0].role_id === 1) {
            return res.status(400).json({ success: false, error: 'Cannot promote an admin' });
        }

        await pool.query('UPDATE users SET role_id = 2 WHERE id = $1', [userId]);

        res.json({
            success: true,
            message: `${userCheck.rows[0].username} is now a teacher`
        });
    } catch (error) {
        console.error('❌ Promote teacher error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// ADMIN - ALL DATA
// ============================================
app.get('/api/admin/all-data', requireAdmin, async (req, res) => {
    const LIMIT = 50;
    const UNLIMITED = [
        'users', 'user_stats', 'role', 'course_setup',
        'category_scores', 'usage_data', 'attendance',
        'feedback', 'learn_content', 'learn_request', 'progress_data'
    ];
    const tables = [
        'users', 'user_stats', 'role', 'course_setup',
        'progress_data', 'game_history', 'category_scores',
        'usage_data', 'login_data', 'attendance',
        'feedback', 'learn_content', 'learn_request'
    ];

    const result = {};

    for (const table of tables) {
        try {
            let query;
            if (UNLIMITED.includes(table)) {
                query = `SELECT * FROM ${table} ORDER BY 1`;
            } else {
                query = `SELECT * FROM ${table} ORDER BY 1 DESC LIMIT ${LIMIT}`;
            }
            const rows = await pool.query(query);
            let total = rows.rows.length;
            if (!UNLIMITED.includes(table)) {
                const countRes = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
                total = countRes.rows[0].c;
            }
            result[table] = {
                rows: rows.rows,
                columns: rows.fields.map(f => f.name),
                total: total,
                truncated: !UNLIMITED.includes(table) && total > LIMIT
            };
        } catch (err) {
            result[table] = { rows: [], columns: [], total: 0, truncated: false, error: err.message };
        }
    }

    res.json({ success: true, tables: result });
});

// ============================================
// ADMIN - SINGLE USER DETAIL
// ============================================
app.get('/api/admin/users/:userId', requireAdmin, async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    try {
        const userResult = await pool.query(
            `SELECT u.id, u.username, u.email, u.full_name, u.created_at, u.last_login, u.status,
                    u.role_id, COALESCE(r.role_type,'student') AS role_type
             FROM users u LEFT JOIN role r ON u.role_id = r.role_id
             WHERE u.id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const statsResult = await pool.query(
            `SELECT total_score, games_played, best_score, games_won,
                    sessions, last_played, updated_at
             FROM user_stats WHERE user_id = $1`,
            [userId]
        );

        const progressResult = await pool.query(
            `SELECT progress_id, course_id, lessons_completed, quiz_score,
                    time_spent, overall_progress, last_activity_date
             FROM progress_data WHERE user_id = $1
             ORDER BY last_activity_date DESC`,
            [userId]
        );

        const gamesResult = await pool.query(
            `SELECT id, game_mode, score, total_questions, category, played_at
             FROM game_history WHERE user_id = $1
             ORDER BY played_at DESC LIMIT 10`,
            [userId]
        );

        res.json({
            success: true,
            user: userResult.rows[0],
            stats: statsResult.rows[0] || null,
            progress: progressResult.rows,
            recentGames: gamesResult.rows
        });
    } catch (error) {
        console.error('❌ Admin user detail error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// ADMIN - LEGACY HTML VIEWER
// ============================================
app.get('/admin/data', async (req, res) => {
    try {
        let token = req.headers.authorization?.split(' ')[1];
        if (!token) token = req.query.token;

        if (!token) {
            return res.send(`<html><head><title>Admin Only</title></head><body style="font-family:Arial;text-align:center;padding:50px;"><h1>🔒 Admin Only</h1><p>Please login first.</p><a href="/">Go to Home</a></body></html>`);
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role_type !== 'admin' && decoded.username !== 'admin') {
            return res.send(`<html><head><title>Access Denied</title></head><body style="font-family:Arial;text-align:center;padding:50px;"><h1>⛔ Access Denied</h1><a href="/">Go to Home</a></body></html>`);
        }

        const users = await pool.query('SELECT * FROM users ORDER BY id');
        const stats = await pool.query('SELECT * FROM user_stats ORDER BY id');
        const games = await pool.query('SELECT * FROM game_history ORDER BY id DESC LIMIT 20');
        const progress = await pool.query('SELECT * FROM progress_data ORDER BY progress_id DESC LIMIT 20');

        let html = `<!DOCTYPE html><html><head><title>📊 Data Viewer</title><style>body{font-family:Arial;padding:20px;background:#f5f5f5}h2{margin-top:30px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1)}th{background:#4CAF50;color:#fff;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}.container{max-width:1200px;margin:0 auto}.back-btn{display:inline-block;padding:10px 20px;background:#333;color:#fff;text-decoration:none;border-radius:5px;margin-bottom:20px}</style></head><body><div class="container"><h1>📊 Full Data Viewer</h1><a href="/" class="back-btn">🏠 Back</a><hr>`;

        html += `<h2>👥 Users</h2><table><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Created</th></tr>`;
        users.rows.forEach(u => { html += `<tr><td>${u.id}</td><td>${u.username}</td><td>${u.email || '-'}</td><td>${u.role_id}</td><td>${new Date(u.created_at).toLocaleString()}</td></tr>`; });
        html += `</table>`;

        html += `<h2>📈 User Stats</h2><table><tr><th>User ID</th><th>Total Score</th><th>Games</th><th>Best</th></tr>`;
        stats.rows.forEach(s => { html += `<tr><td>${s.user_id}</td><td>${s.total_score}</td><td>${s.games_played}</td><td>${s.best_score}</td></tr>`; });
        html += `</table>`;

        html += `<h2>🎮 Games</h2><table><tr><th>ID</th><th>User</th><th>Score</th><th>Category</th><th>Played</th></tr>`;
        games.rows.forEach(g => { html += `<tr><td>${g.id}</td><td>${g.user_id}</td><td>${g.score}</td><td>${g.category || '-'}</td><td>${new Date(g.played_at).toLocaleString()}</td></tr>`; });
        html += `</table>`;

        html += `<h2>📊 Progress</h2><table><tr><th>ID</th><th>User</th><th>Course</th><th>Lessons</th><th>Quiz</th></tr>`;
        progress.rows.forEach(p => { html += `<tr><td>${p.progress_id}</td><td>${p.user_id}</td><td>${p.course_id}</td><td>${p.lessons_completed}</td><td>${p.quiz_score}</td></tr>`; });
        html += `</table>`;

        html += `</div></body></html>`;
        res.send(html);
    } catch (error) {
        res.send(`<h1>Error</h1><p>${error.message}</p>`);
    }
});

// ============================================
// TEST
// ============================================
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users');
        res.json({ success: true, users: result.rows });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// ============================================
// REGISTER — student by default, teacher if invite code matches
// ============================================
app.post('/api/register', async (req, res) => {
    const { username, password, email, fullName, teacherCode } = req.body;
    console.log('📝 Registration attempt for:', username);

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    if (username.length < 2) {
        return res.status(400).json({ success: false, error: 'Username must be at least 2 characters' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    // Role determination
    const expectedCode = process.env.TEACHER_INVITE_CODE;
    let roleId = 3;
    let roleType = 'student';

    if (teacherCode && teacherCode.trim() !== '') {
        if (expectedCode && teacherCode.trim() === expectedCode) {
            roleId = 2;
            roleType = 'teacher';
            console.log('🎓 Registering as TEACHER (invite code matched)');
        } else {
            return res.status(400).json({
                success: false,
                error: 'Invalid teacher invite code. Leave the field empty to sign up as a student.'
            });
        }
    }

    try {
        const userCheck = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'Username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await pool.query('BEGIN');

        const result = await pool.query(
            `INSERT INTO users (username, password_hash, email, full_name, created_at, status, role_id)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, 'active', $5)
             RETURNING id, username, email, full_name, created_at, role_id`,
            [username, hashedPassword, email || null, fullName || username, roleId]
        );

        const newUser = result.rows[0];

        await pool.query(
            `INSERT INTO user_stats (user_id) VALUES ($1)`,
            [newUser.id]
        );

        await pool.query('COMMIT');

        const token = jwt.sign(
            { userId: newUser.id, username: newUser.username, role_type: roleType },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: `${roleType === 'teacher' ? 'Teacher' : 'User'} registered successfully`,
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                full_name: newUser.full_name,
                created_at: newUser.created_at,
                role_id: newUser.role_id,
                role_type: roleType
            },
            token
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('❌ Registration error:', error);
        res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
});

// ============================================
// LOGIN
// ============================================
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('🔑 Login attempt for:', username);

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.password_hash, u.email, u.full_name, u.created_at,
                    u.status, u.role_id, COALESCE(r.role_type, 'student') AS role_type
             FROM users u
             LEFT JOIN role r ON u.role_id = r.role_id
             WHERE u.username = $1 AND u.status = 'active'`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        await pool.query(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1`, [user.id]);
        await pool.query(`UPDATE user_stats SET sessions = sessions + 1 WHERE user_id = $1`, [user.id]);

        const token = jwt.sign(
            { userId: user.id, username: user.username, role_type: user.role_type },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                created_at: user.created_at,
                role_id: user.role_id,
                role_type: user.role_type
            },
            token
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// RESET PASSWORD
// ============================================
app.post('/api/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;
    if (!username || !newPassword) {
        return res.status(400).json({ success: false, error: 'Username and new password are required' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    try {
        const userCheck = await pool.query(
            'SELECT id FROM users WHERE username = $1 OR email = $1',
            [username]
        );
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userCheck.rows[0].id]);
        res.json({ success: true, message: 'Password reset successfully! Please login with your new password.' });
    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// LEADERBOARD (only students)
// ============================================
app.get('/api/leaderboard', async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    try {
        const result = await pool.query(
            `SELECT u.id, u.username,
                    COALESCE(us.total_score, 0) as total_score,
                    COALESCE(us.games_played, 0) as games_played,
                    COALESCE(us.best_score, 0) as best_score,
                    COALESCE(us.games_won, 0) as games_won,
                    u.created_at
             FROM users u
             LEFT JOIN user_stats us ON u.id = us.user_id
             WHERE u.role_id = 3
             ORDER BY us.total_score DESC NULLS LAST
             LIMIT $1`,
            [limit]
        );
        res.json({ success: true, leaderboard: result.rows });
    } catch (error) {
        console.error('❌ Leaderboard error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// PROFILE
// ============================================
app.get('/api/profile/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
        return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    try {
        const userResult = await pool.query(
            `SELECT id, username, email, full_name, created_at, last_login, status, role_id
             FROM users WHERE id = $1`,
            [userId]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const statsResult = await pool.query(
            `SELECT total_score, games_played, best_score, games_won, sessions, last_played
             FROM user_stats WHERE user_id = $1`,
            [userId]
        );

        const historyResult = await pool.query(
            `SELECT game_mode, score, total_questions, category, played_at
             FROM game_history WHERE user_id = $1
             ORDER BY played_at DESC LIMIT 10`,
            [userId]
        );

        res.json({
            success: true,
            user: userResult.rows[0],
            stats: statsResult.rows[0] || { total_score: 0, games_played: 0, best_score: 0, games_won: 0, sessions: 0 },
            recentGames: historyResult.rows || []
        });
    } catch (error) {
        console.error('❌ Profile error:', error);
        res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
    }
});

// ============================================
// SAVE PROGRESS
// ============================================
app.post('/api/save-progress', async (req, res) => {
    const { userId, courseId, lessonsCompleted, quizScore, timeSpent } = req.body;
    if (!userId) {
        return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    try {
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const validCourseId = 1;
        const checkResult = await pool.query(
            'SELECT progress_id, lessons_completed FROM progress_data WHERE user_id = $1 AND course_id = $2',
            [userId, validCourseId]
        );

        if (checkResult.rows.length > 0) {
            const current = checkResult.rows[0];
            const newLessons = current.lessons_completed + (lessonsCompleted || 0);
            const result = await pool.query(
                `UPDATE progress_data SET lessons_completed=$1, quiz_score=GREATEST(quiz_score,$2),
                 time_spent=time_spent+$3, last_activity_date=CURRENT_TIMESTAMP
                 WHERE user_id=$4 AND course_id=$5 RETURNING *`,
                [newLessons, quizScore || 0, timeSpent || 0, userId, validCourseId]
            );
            await pool.query(
                `UPDATE user_stats SET total_score=total_score+$2, games_played=games_played+1,
                 best_score=GREATEST(best_score,$2),
                 games_won=games_won + CASE WHEN $2 >= 70 THEN 1 ELSE 0 END,
                 last_played=CURRENT_TIMESTAMP WHERE user_id=$1`,
                [userId, quizScore || 0]
            );
            res.json({ success: true, message: 'Progress updated', progress: result.rows[0] });
        } else {
            const result = await pool.query(
                `INSERT INTO progress_data (user_id, course_id, lessons_completed, quiz_score, time_spent, overall_progress)
                 VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
                [userId, validCourseId, lessonsCompleted || 0, quizScore || 0, timeSpent || 0, 0]
            );
            await pool.query(
                `UPDATE user_stats SET total_score=total_score+$2, games_played=games_played+1,
                 best_score=GREATEST(best_score,$2),
                 games_won=games_won + CASE WHEN $2 >= 70 THEN 1 ELSE 0 END,
                 last_played=CURRENT_TIMESTAMP WHERE user_id=$1`,
                [userId, quizScore || 0]
            );
            res.json({ success: true, message: 'Progress created', progress: result.rows[0] });
        }
    } catch (error) {
        console.error('❌ Progress error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// SAVE GAME STATS
// ============================================
app.post('/api/save-game-stats', async (req, res) => {
    const { userId, xp } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
    try {
        await pool.query(
            `UPDATE user_stats SET total_score=$1, games_played=games_played+1,
             best_score=GREATEST(best_score,$1), last_played=CURRENT_TIMESTAMP WHERE user_id=$2`,
            [xp || 0, userId]
        );
        res.json({ success: true, message: 'Saved' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// FEEDBACK - GET USER'S
// ============================================
app.get('/api/feedback/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    try {
        const result = await pool.query(
            `SELECT feedback_id, rating, comments, feedback_date
             FROM feedback WHERE student_id = $1
             ORDER BY feedback_date DESC LIMIT 20`,
            [userId]
        );
        res.json({ success: true, feedback: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// FEEDBACK - SUBMIT
// ============================================
app.post('/api/feedback', async (req, res) => {
    const { userId, rating, comments } = req.body;
    if (!userId || !rating) return res.status(400).json({ success: false, error: 'User ID and rating are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ success: false, error: 'Rating must be 1-5' });
    try {
        const result = await pool.query(
            `INSERT INTO feedback (student_id, course_id, rating, comments)
             VALUES ($1, 1, $2, $3)
             RETURNING feedback_id, rating, comments, feedback_date`,
            [userId, rating, comments || null]
        );
        res.json({ success: true, message: 'Feedback submitted', feedback: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// LEARN REQUESTS - GET USER'S
// ============================================
app.get('/api/learn-requests/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    try {
        const result = await pool.query(
            `SELECT request_id, language_req, lesson_topic, request_date_time, request_status
             FROM learn_request WHERE user_id = $1
             ORDER BY request_date_time DESC LIMIT 20`,
            [userId]
        );
        res.json({ success: true, requests: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// LEARN REQUESTS - SUBMIT
// ============================================
app.post('/api/learn-requests', async (req, res) => {
    const { userId, language, topic } = req.body;
    if (!userId || !language || !topic) return res.status(400).json({ success: false, error: 'Missing fields' });
    try {
        const result = await pool.query(
            `INSERT INTO learn_request (user_id, course_id, language_req, lesson_topic, request_status)
             VALUES ($1, 1, $2, $3, 'pending')
             RETURNING request_id, language_req, lesson_topic, request_date_time, request_status`,
            [userId, language, topic]
        );
        res.json({ success: true, message: 'Request submitted', request: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// ATTENDANCE - STUDENT VIEW
// ============================================
app.get('/api/attendance/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    try {
        const existing = await pool.query('SELECT COUNT(*)::int AS c FROM attendance WHERE user_id = $1', [userId]);
        if (existing.rows[0].c === 0) {
            const totalSessions = 10;
            const attended = Math.floor(Math.random() * (totalSessions + 1));
            const rate = ((attended / totalSessions) * 100).toFixed(2);
            await pool.query(
                `INSERT INTO attendance (user_id, course_id, session_date, status, total_sessions, attendance_rate)
                 VALUES ($1, 1, CURRENT_DATE, $2, $3, $4)
                 ON CONFLICT (user_id, course_id, session_date) DO NOTHING`,
                [userId, attended >= totalSessions / 2 ? 'present' : 'absent', totalSessions, rate]
            );
            return res.json({ success: true, attendance: { attended, total_sessions: totalSessions, rate: parseFloat(rate) } });
        }
        const result = await pool.query(
            `SELECT COALESCE(SUM(CASE WHEN status='present' THEN 1 ELSE 0 END),0)::int AS attended,
                    COALESCE(MAX(total_sessions),0)::int AS total_sessions
             FROM attendance WHERE user_id = $1`,
            [userId]
        );
        const row = result.rows[0];
        const rate = row.total_sessions > 0 ? (row.attended / row.total_sessions) * 100 : 0;
        res.json({ success: true, attendance: { attended: row.attended, total_sessions: row.total_sessions, rate } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// NOTIFICATIONS
// ============================================
app.get('/api/notifications/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    try {
        const notifications = [];
        const statsRes = await pool.query(
            `SELECT total_score, games_played, best_score, last_played FROM user_stats WHERE user_id = $1`,
            [userId]
        );
        const progressRes = await pool.query(
            `SELECT lessons_completed FROM progress_data WHERE user_id = $1`,
            [userId]
        );
        const reqRes = await pool.query(
            `SELECT request_id, lesson_topic, request_status
             FROM learn_request WHERE user_id = $1 AND request_status != 'pending'
             ORDER BY request_date_time DESC LIMIT 3`,
            [userId]
        );
        const stats = statsRes.rows[0] || {};
        const lessonsDone = (progressRes.rows[0] || {}).lessons_completed || 0;

        if (lessonsDone > 0) {
            notifications.push({ id: 'lesson-unlocked', icon: '🔓', title: 'New lesson unlocked!', text: `You've completed ${lessonsDone} lesson${lessonsDone === 1 ? '' : 's'}.` });
        }
        if (stats.last_played) {
            const days = Math.floor((Date.now() - new Date(stats.last_played).getTime()) / 86400000);
            if (days >= 2) notifications.push({ id: 'streak-risk', icon: '🔥', title: 'Streak at risk!', text: `You haven't played for ${days} days.` });
        }
        if ((stats.best_score || 0) >= 80) {
            notifications.push({ id: 'best-score', icon: '🏆', title: 'Great score!', text: `Your best is ${stats.best_score}.` });
        }
        const level = Math.floor((stats.total_score || 0) / 100) + 1;
        if (level >= 2) {
            notifications.push({ id: 'level-up', icon: '⭐', title: `Level ${level}!`, text: `${stats.total_score} XP earned.` });
        }
        if ((stats.games_played || 0) === 0) {
            notifications.push({ id: 'first-lesson', icon: '🎯', title: 'Start your first lesson!', text: 'Click any unlocked lesson.' });
        }
        reqRes.rows.forEach(r => {
            notifications.push({ id: `req-${r.request_id}`, icon: r.request_status === 'approved' ? '✅' : '📩', title: `Lesson request ${r.request_status}`, text: `"${r.lesson_topic}"` });
        });
        res.json({ success: true, notifications });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// TEACHER - DASHBOARD SUMMARY
// ============================================
app.get('/api/teacher/dashboard/:teacherId', requireTeacher, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId, 10);
    if (isNaN(teacherId)) return res.status(400).json({ success: false, error: 'Invalid ID' });

    try {
        const coursesRes = await pool.query(
            'SELECT COUNT(*)::int AS c FROM course_setup WHERE teacher_id = $1',
            [teacherId]
        );
        const studentsRes = await pool.query(
            `SELECT COUNT(DISTINCT pd.user_id)::int AS c
             FROM progress_data pd
             JOIN course_setup cs ON pd.course_id = cs.course_id
             WHERE cs.teacher_id = $1`,
            [teacherId]
        );
        const requestsRes = await pool.query(
            `SELECT COUNT(*)::int AS c FROM learn_request WHERE request_status = 'pending'`
        );
        const contentRes = await pool.query(
            'SELECT COUNT(*)::int AS c FROM learn_content WHERE teacher_id = $1',
            [teacherId]
        );

        res.json({
            success: true,
            summary: {
                courses: coursesRes.rows[0].c,
                students: studentsRes.rows[0].c,
                requests: requestsRes.rows[0].c,
                content: contentRes.rows[0].c
            }
        });
    } catch (error) {
        console.error('❌ Teacher dashboard error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// TEACHER - COURSES
// ============================================
app.get('/api/teacher/courses/:teacherId', requireTeacher, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId, 10);
    try {
        const result = await pool.query(
            `SELECT course_id, course_name, language, schedule, start_date, end_date, created_at
             FROM course_setup WHERE teacher_id = $1 ORDER BY course_id DESC`,
            [teacherId]
        );
        res.json({ success: true, courses: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/teacher/courses', requireTeacher, async (req, res) => {
    const { teacherId, courseName, language, schedule } = req.body;
    if (!teacherId || !courseName || !language) {
        return res.status(400).json({ success: false, error: 'teacherId, courseName, and language are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO course_setup (teacher_id, course_name, language, schedule)
             VALUES ($1, $2, $3, $4)
             RETURNING course_id, course_name, language, schedule, created_at`,
            [teacherId, courseName, language, schedule || 'Self-paced']
        );
        res.status(201).json({ success: true, message: 'Course created', course: result.rows[0] });
    } catch (error) {
        console.error('❌ Create course error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// TEACHER - STUDENTS
// ============================================
app.get('/api/teacher/students/:teacherId', requireTeacher, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId, 10);
    try {
        const result = await pool.query(
            `SELECT DISTINCT u.id, u.username, u.email, u.full_name,
                    COALESCE(us.total_score, 0) AS total_score,
                    COALESCE(pd.lessons_completed, 0) AS lessons_completed
             FROM users u
             LEFT JOIN user_stats us ON u.id = us.user_id
             LEFT JOIN progress_data pd ON u.id = pd.user_id
             LEFT JOIN course_setup cs ON pd.course_id = cs.course_id
             WHERE cs.teacher_id = $1 AND u.role_id = 3
             ORDER BY u.username`,
            [teacherId]
        );
        res.json({ success: true, students: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// TEACHER - CONTENT
// ============================================
app.get('/api/teacher/content/:teacherId', requireTeacher, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId, 10);
    try {
        const result = await pool.query(
            `SELECT content_id, course_id, content_title, content_type, difficulty_level, upload_date
             FROM learn_content WHERE teacher_id = $1 ORDER BY upload_date DESC LIMIT 20`,
            [teacherId]
        );
        res.json({ success: true, content: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/teacher/content', requireTeacher, async (req, res) => {
    const { teacherId, courseId, title, type, difficulty } = req.body;
    if (!teacherId || !title || !type) {
        return res.status(400).json({ success: false, error: 'teacherId, title, and type are required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO learn_content (teacher_id, course_id, content_title, content_type, difficulty_level)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING content_id, content_title, content_type, difficulty_level, upload_date`,
            [teacherId, courseId || 1, title, type, difficulty || 'beginner']
        );
        res.status(201).json({ success: true, message: 'Content uploaded', content: result.rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// TEACHER - ATTENDANCE
// ============================================
app.get('/api/teacher/attendance/:teacherId', requireTeacher, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId, 10);
    try {
        const result = await pool.query(
            `SELECT a.attendance_id, a.user_id, a.course_id, a.session_date, a.status, u.username
             FROM attendance a
             JOIN users u ON a.user_id = u.id
             JOIN course_setup cs ON a.course_id = cs.course_id
             WHERE cs.teacher_id = $1
             ORDER BY a.session_date DESC LIMIT 30`,
            [teacherId]
        );
        res.json({ success: true, attendance: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/teacher/attendance', requireTeacher, async (req, res) => {
    const { userId, courseId, status, date } = req.body;
    if (!userId || !courseId) {
        return res.status(400).json({ success: false, error: 'userId and courseId required' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO attendance (user_id, course_id, session_date, status, total_sessions, attendance_rate)
             VALUES ($1, $2, $3, $4, 1, $5)
             ON CONFLICT (user_id, course_id, session_date)
             DO UPDATE SET status = EXCLUDED.status
             RETURNING *`,
            [userId, courseId, date || new Date(), status || 'present', status === 'present' ? 100 : 0]
        );
        res.json({ success: true, message: 'Attendance recorded', attendance: result.rows[0] });
    } catch (error) {
        console.error('❌ Attendance error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// TEACHER - LEARN REQUESTS
// ============================================
app.get('/api/teacher/requests/:teacherId', requireTeacher, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT lr.request_id, lr.user_id, lr.language_req, lr.lesson_topic,
                    lr.request_date_time, lr.request_status, u.username
             FROM learn_request lr
             JOIN users u ON lr.user_id = u.id
             ORDER BY lr.request_date_time DESC LIMIT 30`
        );
        res.json({ success: true, requests: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.post('/api/teacher/requests/:requestId/respond', requireTeacher, async (req, res) => {
    const requestId = parseInt(req.params.requestId, 10);
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: 'status must be approved or rejected' });
    }

    try {
        await pool.query(
            'UPDATE learn_request SET request_status = $1 WHERE request_id = $2',
            [status, requestId]
        );
        res.json({ success: true, message: `Request ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// TEACHER - GIVE FEEDBACK
// ============================================
app.post('/api/teacher/feedback', requireTeacher, async (req, res) => {
    const { teacherId, studentId, courseId, rating, comments } = req.body;
    if (!teacherId || !studentId || !rating) {
        return res.status(400).json({ success: false, error: 'teacherId, studentId, rating are required' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: 'Rating must be 1-5' });
    }
    try {
        const result = await pool.query(
            `INSERT INTO feedback (teacher_id, student_id, course_id, rating, comments)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING feedback_id, feedback_date`,
            [teacherId, studentId, courseId || 1, rating, comments || null]
        );
        res.status(201).json({ success: true, message: 'Feedback sent', feedback: result.rows[0] });
    } catch (error) {
        console.error('❌ Teacher feedback error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

app.get('/api/teacher/feedback/:teacherId', requireTeacher, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId, 10);
    try {
        const result = await pool.query(
            `SELECT f.feedback_id, f.student_id, f.rating, f.comments, f.feedback_date, u.username
             FROM feedback f JOIN users u ON f.student_id = u.id
             WHERE f.teacher_id = $1
             ORDER BY f.feedback_date DESC LIMIT 20`,
            [teacherId]
        );
        res.json({ success: true, feedback: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// TEACHER - STUDENT PROGRESS
// ============================================
app.get('/api/teacher/progress/:teacherId', requireTeacher, async (req, res) => {
    const teacherId = parseInt(req.params.teacherId, 10);
    try {
        const result = await pool.query(
            `SELECT u.id, u.username, u.email,
                    COALESCE(us.total_score, 0) AS total_score,
                    COALESCE(us.games_played, 0) AS games_played,
                    COALESCE(us.best_score, 0) AS best_score,
                    COALESCE(pd.lessons_completed, 0) AS lessons_completed,
                    COALESCE(pd.quiz_score, 0) AS quiz_score
             FROM users u
             LEFT JOIN user_stats us ON u.id = us.user_id
             LEFT JOIN progress_data pd ON u.id = pd.user_id
             LEFT JOIN course_setup cs ON pd.course_id = cs.course_id
             WHERE cs.teacher_id = $1 AND u.role_id = 3
             ORDER BY us.total_score DESC NULLS LAST`,
            [teacherId]
        );
        res.json({ success: true, progress: result.rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// ============================================
// START
// ============================================
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`👤 Admin: admin / admin123`);
    console.log(`👨‍🏫 Teacher panel: active for users with role_id = 2`);
    console.log(`🎓 Teacher invite code: ${process.env.TEACHER_INVITE_CODE || '(not set)'}`);
    console.log(`📊 Data Viewer: http://localhost:${PORT}/admin/data`);
});

console.log('✅ Server ready!');