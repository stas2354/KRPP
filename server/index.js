import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import usersRouter from './routes/users.js';
import postsRouter from './routes/posts.js';
import aiRouter from './routes/ai.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/users', usersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/ai', aiRouter);

app.listen(PORT, () => {
  console.log(`🚀 http://localhost:${PORT}`);
  console.log(`📖 УК: http://localhost:${PORT}/uk.html`);
  console.log(`📘 КоАП: http://localhost:${PORT}/koap.html`);
  console.log(`🤖 ИИ: http://localhost:${PORT}/ai.html`);
  console.log(`🔐 Админка: http://localhost:${PORT}/admin.html`);
});