import express from 'express';
import db from '../db.js';
import { authMiddleware, adminMiddleware } from '../auth.js';

const router = express.Router();

// Публичный список статей с фильтрами
router.get('/', (req, res) => {
  const { search, code, chapter, jurisdiction } = req.query;
  let q = 'SELECT id, code, chapter, article, title, content, punishment, jurisdiction, wanted, bail, created_at FROM posts WHERE published = 1';
  const p = [];

  if (code && code !== 'all') { q += ' AND code = ?'; p.push(code); }
  if (chapter) { q += ' AND chapter LIKE ?'; p.push(`%${chapter}%`); }
  if (jurisdiction && jurisdiction !== 'all') { q += ' AND jurisdiction = ?'; p.push(jurisdiction); }
  if (search) {
    q += ' AND (title LIKE ? OR content LIKE ? OR article LIKE ?)';
    p.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  q += ' ORDER BY CAST(article AS REAL), article';
  res.json(db.prepare(q).all(...p));
});

// Список глав для навигации
router.get('/chapters/:code', (req, res) => {
  const rows = db.prepare(
    'SELECT DISTINCT chapter FROM posts WHERE code = ? AND chapter != "" ORDER BY chapter'
  ).all(req.params.code);
  res.json(rows.map(r => r.chapter));
});

router.get('/:id', (req, res) => {
  const post = db.prepare('SELECT p.*, u.username as author FROM posts p LEFT JOIN users u ON p.author_id = u.id WHERE p.id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Статья не найдена' });
  res.json(post);
});

router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  const { code, chapter, article, title, content, punishment, jurisdiction, wanted, bail, published } = req.body;
  if (!code || !article || !title) return res.status(400).json({ error: 'Заполни обязательные поля' });

  const r = db.prepare(`
    INSERT INTO posts (code, chapter, article, title, content, punishment, jurisdiction, wanted, bail, published, author_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(code, chapter || '', article, title, content || '', punishment || '',
         jurisdiction || 'Общая', wanted || 0, bail || null,
         published ? 1 : 0, req.user.id);

  res.json({ id: r.lastInsertRowid });
});

router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  const { code, chapter, article, title, content, punishment, jurisdiction, wanted, bail, published } = req.body;
  db.prepare(`
    UPDATE posts SET code=?, chapter=?, article=?, title=?, content=?, punishment=?,
      jurisdiction=?, wanted=?, bail=?, published=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(code, chapter, article, title, content, punishment,
         jurisdiction, wanted || 0, bail || null,
         published ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;