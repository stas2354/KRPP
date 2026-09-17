import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { createToken, authMiddleware, adminMiddleware } from '../auth.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Неверный логин или пароль' });
  }
  const token = createToken(user);
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.get('/', authMiddleware, adminMiddleware, (req, res) => {
  res.json(db.prepare('SELECT id, username, role, created_at FROM users').all());
});

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { username, password, role = 'user' } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Заполни все поля' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const r = db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)')
      .run(username, hash, role);
    res.json({ id: r.lastInsertRowid, username, role });
  } catch {
    res.status(400).json({ error: 'Такой логин уже есть' });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Нельзя удалить себя' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;