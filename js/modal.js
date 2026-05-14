// 로그인 / 회원가입 모달 — 실제 인증 처리 포함
// auth.js 이후 로드됩니다

function openModal(type) {
  const el = document.getElementById(`modal-${type}`);
  if (el) el.classList.add('open');
}

function closeModal(type) {
  const el = document.getElementById(`modal-${type}`);
  if (!el) return;
  el.classList.remove('open');
  // 에러 메시지·입력값 초기화
  const errEl = el.querySelector('.modal-error');
  if (errEl) { errEl.textContent = ''; errEl.style.color = ''; }
}

// ── 로그인 처리 ───────────────────────────────────────────
function handleLogin() {
  const id  = document.getElementById('login-id')?.value.trim();
  const pw  = document.getElementById('login-pw')?.value;
  const err = document.getElementById('modal-login-error');

  if (!id || !pw) { if (err) err.textContent = 'ID와 비밀번호를 입력해 주세요.'; return; }

  const result = login(id, pw);
  if (!result.ok) {
    if (err) err.textContent = result.msg;
    return;
  }
  closeModal('login');
}

// ── 회원가입 처리 ─────────────────────────────────────────
function handleSignup() {
  const id       = document.getElementById('signup-id')?.value.trim();
  const nickname = document.getElementById('signup-nickname')?.value.trim();
  const pw       = document.getElementById('signup-pw')?.value;
  const pw2      = document.getElementById('signup-pw2')?.value;
  const err      = document.getElementById('modal-signup-error');

  if (pw !== pw2) { if (err) err.textContent = '비밀번호가 일치하지 않습니다.'; return; }

  const result = signup(id, nickname, pw);
  if (!result.ok) { if (err) err.textContent = result.msg; return; }

  if (err) { err.style.color = '#5cb85c'; err.textContent = '가입 완료! 로그인해 주세요.'; }
  setTimeout(() => {
    closeModal('signup');
    openModal('login');
  }, 1000);
}

// ── 이벤트 등록 ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // 바깥 클릭 / ESC로 모달 닫기
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => { if (e.target === el) el.classList.remove('open'); });
    el.addEventListener('keydown', e => { if (e.key === 'Escape') el.classList.remove('open'); });
  });

  // Enter 제출
  document.getElementById('login-pw')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('signup-pw2')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSignup();
  });
});
