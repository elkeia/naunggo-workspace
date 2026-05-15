// 우측 AI 채팅창 기능
// 실제 LLM API 연결 시 sendChat() 내부의 fetchBotReply()를 수정하세요

const botReplies = [
  '네, 말씀하신 내용 잘 이해했습니다. 더 궁금한 점이 있으신가요?',
  '좋은 질문이네요! 관련 작품들은 해당 메뉴에서 찾아보실 수 있습니다.',
  '창작에 관심이 있으시군요. 시나 그림 섹션을 둘러보시는 건 어떨까요?',
  '감사합니다! 앞으로도 naunggo 작업공간에 자주 방문해 주세요.',
  '그 부분은 소개 섹션에서 더 자세히 알아보실 수 있습니다.',
  '흥미로운 이야기네요. 게시판에서 다른 방문자들과 이야기를 나눠보시는 것도 좋겠습니다.',
  '나중에 실제 AI API가 연결되면 더 풍부한 대화가 가능해질 예정입니다!',
];
let replyIndex = 0;

function getTime() {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function addBubble(text, who) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = `chat-bubble ${who}`;
  div.innerHTML = `${text.replace(/\n/g, '<br>')}<span class="time">${getTime()}</span>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// 실제 API 연결 시 이 함수를 교체하세요
async function fetchBotReply(userText) {
  // 예시: Claude API 연결
  // const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message: userText }) });
  // const data = await res.json();
  // return data.reply;

  // 현재는 더미 응답
  return botReplies[replyIndex++ % botReplies.length];
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  addBubble(text, 'user');
  input.value = '';
  input.style.height = 'auto';

  setTimeout(async () => {
    const reply = await fetchBotReply(text);
    addBubble(reply, 'bot');
  }, 600);
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendChat();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 80) + 'px';
}

// 초기 메시지 시간 표시
document.addEventListener('DOMContentLoaded', () => {
  const initTime = document.getElementById('init-time');
  if (initTime) initTime.textContent = getTime();
});

// ── 모바일: AI 채팅 패널 슬라이드업 토글 ─────────────────
function toggleChatPanel() {
  const panel = document.querySelector('.chat-panel');
  const overlay = document.getElementById('chat-overlay');
  if (panel.classList.contains('chat-open')) {
    closeChatPanel();
  } else {
    panel.classList.add('chat-open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const msgs = document.getElementById('chat-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }
}

function closeChatPanel() {
  document.querySelector('.chat-panel')?.classList.remove('chat-open');
  document.getElementById('chat-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}
