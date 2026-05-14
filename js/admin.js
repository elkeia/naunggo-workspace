// 관리자 패널 (게시판 관리 / 회원 관리)
// auth.js, data.js, nav.js 이후 로드됩니다

let _adminTab = 'board';
let _adminSelectedMenu = null;
let _adminSelectedSub  = null;

function openAdminPanel() {
  if (!isAdmin()) return;
  document.getElementById('modal-admin').classList.add('open');
  _adminTab = 'board';
  // 기본 선택: 첫 번째 메뉴/서브메뉴
  const menus = Object.keys(menuData);
  _adminSelectedMenu = menus[0];
  _adminSelectedSub  = menuData[_adminSelectedMenu].submenus[0];
  renderAdminPanel();
}

function closeAdminPanel() {
  document.getElementById('modal-admin').classList.remove('open');
}

function switchAdminTab(tab) {
  _adminTab = tab;
  renderAdminPanel();
}

// ── 패널 전체 렌더 ────────────────────────────────────────
function renderAdminPanel() {
  const content = document.getElementById('admin-panel-body');
  if (!content) return;

  const boardActive  = _adminTab === 'board'  ? ' active' : '';
  const memberActive = _adminTab === 'member' ? ' active' : '';

  content.innerHTML = `
    <div class="admin-tabs">
      <button class="admin-tab-btn${boardActive}"  onclick="switchAdminTab('board')">📋 게시판 관리</button>
      <button class="admin-tab-btn${memberActive}" onclick="switchAdminTab('member')">👤 회원 관리</button>
    </div>
    <div id="admin-tab-content"></div>`;

  if (_adminTab === 'board')  renderAdminBoard();
  else                        renderAdminMembers();
}

// ── 탭 1: 게시판 관리 ─────────────────────────────────────
function renderAdminBoard() {
  const area = document.getElementById('admin-tab-content');
  if (!area) return;

  // 메뉴·서브메뉴 셀렉터
  const menuOpts = Object.keys(menuData).map(m =>
    `<option value="${escHtml(m)}"${m === _adminSelectedMenu ? ' selected' : ''}>${escHtml(m)}</option>`
  ).join('');

  const subOpts = (menuData[_adminSelectedMenu]?.submenus || []).map(s =>
    `<option value="${escHtml(s)}"${s === _adminSelectedSub ? ' selected' : ''}>${escHtml(s)}</option>`
  ).join('');

  const posts = menuData[_adminSelectedMenu]?.posts[_adminSelectedSub] || [];

  let rows = '';
  if (posts.length === 0) {
    rows = `<tr><td colspan="4" class="empty-row">게시글이 없습니다.</td></tr>`;
  } else {
    posts.forEach((post, idx) => {
      rows += `
        <tr>
          <td>${posts.length - idx}</td>
          <td style="text-align:left">${escHtml(post.title)}</td>
          <td>${escHtml(post.author || '-')}</td>
          <td>
            <button class="admin-del-btn"
              onclick="adminDeletePost('${escHtml(_adminSelectedMenu)}','${escHtml(_adminSelectedSub)}',${idx})">
              삭제
            </button>
          </td>
        </tr>`;
    });
  }

  area.innerHTML = `
    <div class="admin-selectors">
      <select class="admin-select" onchange="adminChangeMenu(this.value)">
        ${menuOpts}
      </select>
      <select class="admin-select" onchange="adminChangeSub(this.value)">
        ${subOpts}
      </select>
      <span class="admin-post-count">총 ${posts.length}개</span>
    </div>
    <table class="admin-table">
      <thead>
        <tr><th>번호</th><th>제목</th><th>글쓴이</th><th>관리</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function adminChangeMenu(menu) {
  _adminSelectedMenu = menu;
  _adminSelectedSub  = menuData[menu]?.submenus[0] || '';
  renderAdminBoard();
}

function adminChangeSub(sub) {
  _adminSelectedSub = sub;
  renderAdminBoard();
}

function adminDeletePost(menu, sub, idx) {
  if (!confirm(`"${menuData[menu]?.posts[sub]?.[idx]?.title}" 게시글을 삭제하시겠습니까?`)) return;
  menuData[menu].posts[sub].splice(idx, 1);
  // 현재 게시판 보기 중이면 갱신
  if (typeof currentMenu !== 'undefined' && currentMenu === menu && currentSub === sub) {
    currentPage = 1;
    renderContent(menu, sub);
  }
  _adminSelectedMenu = menu;
  _adminSelectedSub  = sub;
  renderAdminBoard();
}

// ── 탭 2: 회원 관리 ───────────────────────────────────────
function renderAdminMembers() {
  const area = document.getElementById('admin-tab-content');
  if (!area) return;

  const members = userDB.filter(u => u.role !== 'admin');
  let rows = '';

  if (members.length === 0) {
    rows = `<tr><td colspan="4" class="empty-row">가입 회원이 없습니다.</td></tr>`;
  } else {
    members.forEach((u) => {
      const realIdx = userDB.indexOf(u);
      rows += `
        <tr>
          <td>${escHtml(u.id)}</td>
          <td>${escHtml(u.nickname)}</td>
          <td><span class="role-badge">${escHtml(u.role)}</span></td>
          <td>
            <button class="admin-del-btn"
              onclick="adminDeleteMember(${realIdx})">
              강퇴
            </button>
          </td>
        </tr>`;
    });
  }

  area.innerHTML = `
    <p class="admin-info">관리자 계정은 목록에서 제외됩니다. 총 ${members.length}명</p>
    <table class="admin-table">
      <thead>
        <tr><th>ID</th><th>닉네임</th><th>역할</th><th>관리</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function adminDeleteMember(idx) {
  const user = userDB[idx];
  if (!user) return;
  if (!confirm(`"${user.nickname}"(${user.id}) 회원을 강퇴하시겠습니까?`)) return;
  // 현재 로그인된 회원이면 로그아웃
  if (currentUser && currentUser.id === user.id) logout();
  userDB.splice(idx, 1);
  renderAdminMembers();
}
