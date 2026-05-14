// 사용자 인증 및 권한 관리
// nav.js, modal.js, admin.js보다 먼저 로드됩니다

// ── 전역 유틸 (가장 먼저 정의) ───────────────────────────
function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── 상수 ─────────────────────────────────────────────────
const ADMIN_ID = 'admin';
const ADMIN_PW = 'admin1234';

// 소개·시·그림·정보는 관리자만 글쓰기 가능
const ADMIN_ONLY_MENUS = ['소개', '시', '그림', '정보'];

// ── 회원 DB (메모리, 새로고침 초기화) ───────────────────
const userDB = [
  { id: ADMIN_ID, nickname: '관리자', pw: ADMIN_PW, role: 'admin' }
];

// ── 현재 로그인 사용자 ───────────────────────────────────
let currentUser = null; // { id, nickname, role: 'admin'|'member' }

// ── 인증 함수 ─────────────────────────────────────────────
function login(id, pw) {
  const user = userDB.find(u => u.id === id && u.pw === pw);
  if (!user) return { ok: false, msg: 'ID 또는 비밀번호가 올바르지 않습니다.' };
  currentUser = { id: user.id, nickname: user.nickname, role: user.role };
  updateHeader();
  return { ok: true };
}

function signup(id, nickname, pw) {
  if (!id || !nickname || !pw) return { ok: false, msg: '모든 항목을 입력해 주세요.' };
  if (id.length < 3) return { ok: false, msg: 'ID는 3자 이상이어야 합니다.' };
  if (pw.length < 4) return { ok: false, msg: '비밀번호는 4자 이상이어야 합니다.' };
  if (userDB.find(u => u.id === id)) return { ok: false, msg: '이미 사용 중인 ID입니다.' };
  userDB.push({ id, nickname, pw, role: 'member' });
  return { ok: true };
}

function logout() {
  currentUser = null;
  updateHeader();
  // 현재 보고 있는 게시판 갱신
  if (typeof currentMenu !== 'undefined' && currentMenu && typeof renderContent === 'function') {
    renderContent(currentMenu, currentSub);
  }
}

// ── 권한 헬퍼 ─────────────────────────────────────────────
function isAdmin() {
  return currentUser?.role === 'admin';
}

function canWrite(menu) {
  if (!currentUser) return false;
  if (ADMIN_ONLY_MENUS.includes(menu)) return isAdmin();
  return true; // 게시판은 모든 로그인 회원
}

function canEditPost(authorId) {
  return !!(currentUser && (currentUser.id === authorId || isAdmin()));
}

// ── 헤더 상태 갱신 ────────────────────────────────────────
function updateHeader() {
  const right = document.getElementById('header-right');
  if (!right) return;

  if (!currentUser) {
    right.innerHTML = `
      <button class="btn btn-outline" onclick="openModal('login')">로그인</button>
      <button class="btn btn-fill" onclick="openModal('signup')">회원가입</button>`;
  } else {
    const adminBtn = isAdmin()
      ? `<button class="btn btn-admin" onclick="openAdminPanel()">⚙ 관리패널</button>`
      : '';
    right.innerHTML = `
      <span class="user-badge">${escHtml(currentUser.nickname)}님</span>
      ${adminBtn}
      <button class="btn btn-outline logout-btn" onclick="logout()">로그아웃</button>`;
  }
}
