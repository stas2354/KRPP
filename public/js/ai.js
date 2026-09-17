const messages = document.getElementById('messages');
const input = document.getElementById('question');
const btn = document.getElementById('askBtn');

function addMsg(text, cls) {
  const div = document.createElement('div');
  div.className = 'msg ' + cls;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
  return div;
}

async function ask() {
  const q = input.value.trim();
  if (!q) return;

  input.value = '';
  btn.disabled = true;
  addMsg(q, 'user');
  const thinking = addMsg('⏳ Думаю...', 'ai');

  try {
    const data = await api('/api/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question: q }),
    });
    thinking.textContent = data.answer;
  } catch (e) {
    thinking.textContent = '❌ ' + e.message;
  } finally {
    btn.disabled = false;
    input.focus();
  }
}

btn.addEventListener('click', ask);
input.addEventListener('keydown', e => { if (e.key === 'Enter') ask(); });