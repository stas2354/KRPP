import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('database.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    chapter TEXT,
    article TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    punishment TEXT,
    jurisdiction TEXT,
    wanted INTEGER DEFAULT 0,
    bail INTEGER,
    published INTEGER DEFAULT 1,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_posts_code ON posts(code);
  CREATE INDEX IF NOT EXISTS idx_posts_article ON posts(article);
`);

// Админ по умолчанию
const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
    .run('admin', hash, 'admin');
  console.log('✅ Админ создан: admin / admin123');
}

export default db;