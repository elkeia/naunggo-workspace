// 네비게이션, 사이드바, 메인 콘텐츠 렌더링
// auth.js(escHtml, currentUser, canWrite 등) 이후 로드됩니다

// ── 전역 상태 ────────────────────────────────────────────
let currentMenu = null;
let currentSub  = null;
let currentPage = 1;
let searchQuery = '';
const PAGE_SIZE = 10;

// 상세 뷰 상태 (수정·삭제·댓글에서 재사용)
let _detailPost    = null;
let _detailPostIdx = -1;
let _detailMenu    = null;
let _detailSub     = null;

// 현재 보드의 원본 게시글 배열 (페이지네이션·검색 공유)
let _boardPosts = [];

const PRESET_TAGS = ['봄','여름','가을','겨울','일상','감정','그리움',
                     '이별','자유','새벽','봄비','5월','시론','공지'];

// ── 네비게이션 클릭 ──────────────────────────────────────
function selectMenu(btn) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentMenu  = btn.dataset.menu;
  currentSub   = menuData[currentMenu].submenus[0];
  currentPage  = 1;
  searchQuery  = '';
  renderSidebar(currentMenu);
  renderContent(currentMenu, currentSub);
}

// ── 사이드바 렌더링 ───────────────────────────────────────
function renderSidebar(menu) {
  document.getElementById('sidebar-title').textContent = menu;
  const ul = document.createElement('ul');
  ul.className = 'submenu-list';

  menuData[menu].submenus.forEach((sub, i) => {
    const li = document.createElement('li');
    const a  = document.createElement('a');
    a.href = '#';
    a.textContent = sub;
    if (i === 0) a.classList.add('active-sub');

    a.onclick = (e) => {
      e.preventDefault();
      document.querySelectorAll('.submenu-list li a').forEach(x => x.classList.remove('active-sub'));
      a.classList.add('active-sub');
      currentSub  = sub;
      currentPage = 1;
      searchQuery = '';
      renderContent(menu, sub);
    };
    li.appendChild(a);
    ul.appendChild(li);
  });

  const container = document.getElementById('sidebar-content');
  container.innerHTML = '';
  container.appendChild(ul);
}

// ── 뷰 진입점 ─────────────────────────────────────────────
function renderContent(menu, sub) {
  const posts = menuData[menu].posts[sub] || [];
  _boardPosts = posts;
  renderBoardList(posts, menu, sub, currentPage);
}

// ── 1. 목록 뷰 (툴바 + 바디) ──────────────────────────────
function renderBoardList(posts, menu, sub, page) {
  const container = document.getElementById('main-content');

  // 글쓰기 버튼 / 로그인 안내
  let writeBtn = '';
  if (canWrite(menu)) {
    writeBtn = `<button class="btn btn-fill write-btn"
      onclick="renderWriteForm('${escHtml(menu)}','${escHtml(sub)}')">✏️ 글쓰기</button>`;
  } else if (!currentUser) {
    writeBtn = `<span class="login-hint">로그인 후 이용 가능합니다</span>`;
  }

  container.innerHTML = `
    <div class="board-toolbar">
      <h2 class="section-title">${escHtml(menu)} — ${escHtml(sub)}
        <span class="post-count" id="post-count-badge"></span>
      </h2>
      <div class="toolbar-right">
        <div class="search-wrap">
          <input class="board-search" id="board-search-input"
            type="text" placeholder="제목 / 글쓴이 검색" value="${escHtml(searchQuery)}" />
          <span class="search-icon">🔍</span>
        </div>
        ${writeBtn}
      </div>
    </div>
    <div id="board-list-area"></div>`;

  // 한글 안전 검색 이벤트 (compositionend + isComposing 체크)
  const searchInput = document.getElementById('board-search-input');
  if (searchInput) {
    const doSearch = () => {
      searchQuery = searchInput.value;
      currentPage = 1;
      renderBoardListBody(posts, menu, sub, 1);
    };
    searchInput.addEventListener('compositionend', doSearch);
    searchInput.addEventListener('input', (e) => { if (!e.isComposing) doSearch(); });
    searchInput.focus();
  }

  renderBoardListBody(posts, menu, sub, page);
}

// ── 바디만 교체 (검색·페이지네이션용) ────────────────────
function renderBoardListBody(posts, menu, sub, page) {
  const filtered = searchQuery
    ? posts.filter(p =>
        p.title.includes(searchQuery) ||
        (p.author && p.author.includes(searchQuery)))
    : posts;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const start      = (safePage - 1) * PAGE_SIZE;
  const pagePosts  = filtered.slice(start, start + PAGE_SIZE);
  const totalNum   = filtered.length;

  // 게시글 수 뱃지 갱신
  const badge = document.getElementById('post-count-badge');
  if (badge) badge.textContent = `(${totalNum}개)`;

  let html = `<table class="board-table"><thead>
    <tr>
      <th class="col-num">번호</th>
      <th class="col-title">제목</th>
      <th class="col-author">글쓴이</th>
      <th class="col-date">등록일</th>
      <th class="col-views">조회수</th>
    </tr></thead><tbody>`;

  if (pagePosts.length === 0) {
    html += `<tr><td colspan="5" class="empty-row">게시글이 없습니다.</td></tr>`;
  } else {
    pagePosts.forEach((post, i) => {
      const origIdx  = posts.indexOf(post);
      const num      = totalNum - start - i;
      const tagBadge = post.tag ? `<span class="tag">${escHtml(post.tag)}</span>` : '';
      const imgIcon  = post.images?.length > 0 ? `<span class="img-icon" title="이미지 첨부">📎</span>` : '';
      const cmtCount = post.comments?.length > 0
        ? `<span class="cmt-count">[${post.comments.length}]</span>` : '';
      html += `
        <tr class="board-row" onclick="renderPostDetail(${origIdx},'${escHtml(menu)}','${escHtml(sub)}')">
          <td class="col-num">${num}</td>
          <td class="col-title">
            <span class="title-cell">${escHtml(post.title)}</span>
            ${tagBadge}${imgIcon}${cmtCount}
          </td>
          <td class="col-author">${escHtml(post.author || '-')}</td>
          <td class="col-date">${escHtml(post.date)}</td>
          <td class="col-views">${(post.views || 0).toLocaleString()}</td>
        </tr>`;
    });
  }
  html += `</tbody></table>`;
  html += buildPagination(safePage, totalPages, menu, sub);

  const area = document.getElementById('board-list-area');
  if (area) area.innerHTML = html;
}

// ── 페이지네이션 HTML ─────────────────────────────────────
function buildPagination(cur, total, menu, sub) {
  if (total <= 1) return '';
  let html = `<div class="pagination">`;
  html += `<button class="page-btn${cur===1?' disabled':''}"
    onclick="goPage(${cur-1},'${escHtml(menu)}','${escHtml(sub)}')">&laquo;</button>`;

  const half = 2;
  let ps = Math.max(1, cur - half);
  let pe = Math.min(total, cur + half);
  if (pe - ps < 4) { if (ps===1) pe=Math.min(total,ps+4); else ps=Math.max(1,pe-4); }

  if (ps > 1) html += `<button class="page-btn" onclick="goPage(1,'${escHtml(menu)}','${escHtml(sub)}')">1</button><span class="page-ellipsis">…</span>`;
  for (let p = ps; p <= pe; p++) {
    html += `<button class="page-btn${p===cur?' active':''}"
      onclick="goPage(${p},'${escHtml(menu)}','${escHtml(sub)}')">${p}</button>`;
  }
  if (pe < total) html += `<span class="page-ellipsis">…</span><button class="page-btn" onclick="goPage(${total},'${escHtml(menu)}','${escHtml(sub)}')">${total}</button>`;

  html += `<button class="page-btn${cur===total?' disabled':''}"
    onclick="goPage(${cur+1},'${escHtml(menu)}','${escHtml(sub)}')">&raquo;</button>`;
  return html + `</div>`;
}

function goPage(page, menu, sub) {
  const posts  = _boardPosts;
  const fCount = searchQuery
    ? posts.filter(p => p.title.includes(searchQuery)||(p.author&&p.author.includes(searchQuery))).length
    : posts.length;
  const total  = Math.max(1, Math.ceil(fCount / PAGE_SIZE));
  currentPage  = Math.max(1, Math.min(page, total));
  renderBoardListBody(posts, menu, sub, currentPage);
  document.getElementById('board-list-area')?.scrollIntoView({ behavior:'smooth', block:'start' });
}

// ── 2. 상세 뷰 ────────────────────────────────────────────
function renderPostDetail(postIdx, menu, sub) {
  const posts = menuData[menu].posts[sub] || [];
  const post  = posts[postIdx];
  if (!post) return;
  if (!post.comments) post.comments = [];

  // 조회수 증가
  post.views = (post.views || 0) + 1;

  // 상세 뷰 상태 저장
  _detailPost    = post;
  _detailPostIdx = postIdx;
  _detailMenu    = menu;
  _detailSub     = sub;

  const imagesHtml = post.images?.length > 0
    ? `<div class="post-images">${post.images.map(src =>
        `<img src="${escHtml(src)}" class="post-img" alt="첨부 이미지"
          onclick="window.open('${escHtml(src)}','_blank')">`).join('')}</div>`
    : '';

  // 수정·삭제 버튼 (본인 or 관리자)
  const editDeleteBtns = canEditPost(post.authorId || post.author)
    ? `<div class="edit-delete-btns">
        <button class="btn btn-sm btn-outline-purple" onclick="renderEditForm()">수정</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCurrentPost()">삭제</button>
      </div>`
    : '';

  document.getElementById('main-content').innerHTML = `
    <div class="post-detail">
      <button class="back-btn" onclick="renderContent('${escHtml(menu)}','${escHtml(sub)}')">← 목록으로</button>

      <h2 class="post-title">${escHtml(post.title)}</h2>

      <div class="post-meta-row">
        <span class="meta-item"><span class="meta-label">글쓴이</span> ${escHtml(post.author || '-')}</span>
        <span class="meta-divider">|</span>
        <span class="meta-item"><span class="meta-label">등록일</span> ${escHtml(post.date)}</span>
        <span class="meta-divider">|</span>
        <span class="meta-item"><span class="meta-label">조회수</span> ${post.views.toLocaleString()}</span>
        ${post.tag ? `<span class="meta-divider">|</span><span class="tag">${escHtml(post.tag)}</span>` : ''}
      </div>

      ${editDeleteBtns}

      <hr class="post-divider" />

      <div class="post-body">${escHtml(post.content || post.preview || '').replace(/\n/g,'<br>')}</div>

      ${imagesHtml}

      <div class="post-actions">
        <button class="btn btn-outline" onclick="renderContent('${escHtml(menu)}','${escHtml(sub)}')">목록</button>
      </div>

      <div id="comment-section"></div>
    </div>`;

  renderComments();
}

// ── 3. 수정 뷰 ────────────────────────────────────────────
function renderEditForm() {
  const post = _detailPost;
  if (!post || !canEditPost(post.authorId || post.author)) return;

  document.getElementById('main-content').innerHTML = `
    <div class="write-form">
      <button class="back-btn" onclick="renderPostDetail(${_detailPostIdx},'${escHtml(_detailMenu)}','${escHtml(_detailSub)}')">← 돌아가기</button>
      <h2 class="section-title">수정 — ${escHtml(_detailMenu)} &gt; ${escHtml(_detailSub)}</h2>

      <div class="form-field">
        <label class="form-label">제목 <span class="required">*</span></label>
        <input class="form-input" id="wf-title" type="text" maxlength="100"
          value="${escHtml(post.title)}" />
      </div>

      <div class="form-field">
        <label class="form-label">태그</label>
        ${buildTagSelector(post.tag || '')}
      </div>

      <div class="form-field">
        <label class="form-label">내용 <span class="required">*</span></label>
        <textarea class="form-textarea" id="wf-content" rows="12">${escHtml(post.content || post.preview || '')}</textarea>
      </div>

      <div class="form-field">
        <label class="form-label">이미지 첨부</label>
        <label class="file-upload-label" for="wf-images">📁 이미지 선택 (여러 장 가능)</label>
        <input class="file-input" id="wf-images" type="file" multiple accept="image/*"
          onchange="previewImages(this)" />
        <div class="image-preview-grid" id="wf-preview"></div>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline"
          onclick="renderPostDetail(${_detailPostIdx},'${escHtml(_detailMenu)}','${escHtml(_detailSub)}')">취소</button>
        <button class="btn btn-fill" onclick="updatePost()">수정 완료</button>
      </div>
    </div>`;

  attachTagChipEvents();
}

function updatePost() {
  const title   = document.getElementById('wf-title')?.value.trim();
  const content = document.getElementById('wf-content')?.value.trim();
  if (!title)   { alert('제목을 입력해 주세요.'); return; }
  if (!content) { alert('내용을 입력해 주세요.'); return; }

  const tag    = getSelectedTag();
  const images = getPreviewImages();

  _detailPost.title   = title;
  _detailPost.content = content;
  _detailPost.preview = content.slice(0, 80) + (content.length > 80 ? '…' : '');
  _detailPost.tag     = tag || undefined;
  if (images.length > 0) _detailPost.images = images;

  renderPostDetail(_detailPostIdx, _detailMenu, _detailSub);
}

// ── 4. 글쓰기 뷰 ──────────────────────────────────────────
function renderWriteForm(menu, sub) {
  if (!canWrite(menu)) { alert('글쓰기 권한이 없습니다.'); return; }

  document.getElementById('main-content').innerHTML = `
    <div class="write-form">
      <button class="back-btn" onclick="renderContent('${escHtml(menu)}','${escHtml(sub)}')">← 목록으로</button>
      <h2 class="section-title">글쓰기 — ${escHtml(menu)} &gt; ${escHtml(sub)}</h2>

      <div class="form-field">
        <label class="form-label">제목 <span class="required">*</span></label>
        <input class="form-input" id="wf-title" type="text" placeholder="제목을 입력하세요" maxlength="100" />
      </div>

      <div class="form-field">
        <label class="form-label">태그</label>
        ${buildTagSelector('')}
      </div>

      <div class="form-field">
        <label class="form-label">내용 <span class="required">*</span></label>
        <textarea class="form-textarea" id="wf-content" placeholder="내용을 입력하세요" rows="12"></textarea>
      </div>

      <div class="form-field">
        <label class="form-label">이미지 첨부</label>
        <label class="file-upload-label" for="wf-images">📁 이미지 선택 (여러 장 가능)</label>
        <input class="file-input" id="wf-images" type="file" multiple accept="image/*"
          onchange="previewImages(this)" />
        <div class="image-preview-grid" id="wf-preview"></div>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline" onclick="renderContent('${escHtml(menu)}','${escHtml(sub)}')">취소</button>
        <button class="btn btn-fill" onclick="submitPost('${escHtml(menu)}','${escHtml(sub)}')">등록</button>
      </div>
    </div>`;

  attachTagChipEvents();
}

function submitPost(menu, sub) {
  const title   = document.getElementById('wf-title')?.value.trim();
  const content = document.getElementById('wf-content')?.value.trim();
  if (!title)   { alert('제목을 입력해 주세요.'); return; }
  if (!content) { alert('내용을 입력해 주세요.'); return; }

  const tag    = getSelectedTag();
  const images = getPreviewImages();

  const newPost = {
    title,
    author:   currentUser?.nickname || '익명',
    authorId: currentUser?.id || '',
    date:     todayStr(),
    views:    0,
    preview:  content.slice(0, 80) + (content.length > 80 ? '…' : ''),
    content,
    images,
    comments: [],
  };
  if (tag) newPost.tag = tag;

  menuData[menu].posts[sub].unshift(newPost);
  currentPage = 1;
  searchQuery = '';
  renderContent(menu, sub);
}

// ── 5. 게시글 삭제 ───────────────────────────────────────
function deleteCurrentPost() {
  if (!_detailPost || !canEditPost(_detailPost.authorId || _detailPost.author)) return;
  if (!confirm(`"${_detailPost.title}" 게시글을 삭제하시겠습니까?`)) return;
  menuData[_detailMenu].posts[_detailSub].splice(_detailPostIdx, 1);
  currentPage = 1;
  renderContent(_detailMenu, _detailSub);
}

// ── 6. 댓글 ──────────────────────────────────────────────
function renderComments() {
  const section = document.getElementById('comment-section');
  if (!section || !_detailPost) return;

  if (!_detailPost.comments) _detailPost.comments = [];
  const comments = _detailPost.comments;

  let cmtHtml = comments.map((c, i) => {
    const canDel = currentUser && (currentUser.id === c.authorId || isAdmin());
    const delBtn = canDel
      ? `<button class="cmt-del-btn" onclick="deleteComment(${i})">삭제</button>`
      : '';
    return `
      <div class="comment-item">
        <div class="comment-meta">
          <span class="cmt-author">${escHtml(c.nickname)}</span>
          <span class="cmt-date">${escHtml(c.date)}</span>
          ${delBtn}
        </div>
        <div class="comment-body">${escHtml(c.content).replace(/\n/g,'<br>')}</div>
      </div>`;
  }).join('');

  let formHtml = '';
  if (currentUser) {
    formHtml = `
      <div class="comment-form">
        <textarea class="comment-textarea" id="comment-input"
          placeholder="댓글을 입력하세요..." rows="3"></textarea>
        <div class="comment-form-actions">
          <button class="btn btn-fill" onclick="addComment()">등록</button>
        </div>
      </div>`;
  } else {
    formHtml = `<p class="login-hint" style="margin-top:12px">로그인 후 댓글을 작성할 수 있습니다.</p>`;
  }

  section.innerHTML = `
    <div class="comment-section">
      <div class="comment-header">댓글 ${comments.length}개</div>
      <div id="comment-list">${cmtHtml || '<p class="empty-cmt">첫 번째 댓글을 남겨보세요.</p>'}</div>
      ${formHtml}
    </div>`;
}

function addComment() {
  if (!currentUser || !_detailPost) return;
  const input = document.getElementById('comment-input');
  const content = input?.value.trim();
  if (!content) { alert('댓글 내용을 입력해 주세요.'); return; }

  if (!_detailPost.comments) _detailPost.comments = [];
  _detailPost.comments.push({
    authorId: currentUser.id,
    nickname: currentUser.nickname,
    content,
    date:     todayStr(),
  });
  renderComments();
}

function deleteComment(idx) {
  if (!_detailPost?.comments) return;
  const c = _detailPost.comments[idx];
  if (!c) return;
  if (!currentUser || (currentUser.id !== c.authorId && !isAdmin())) return;
  if (!confirm('댓글을 삭제하시겠습니까?')) return;
  _detailPost.comments.splice(idx, 1);
  renderComments();
}

// ── 7. 태그 선택기 ───────────────────────────────────────
function buildTagSelector(currentTag) {
  const chips = PRESET_TAGS.map(t =>
    `<span class="tag-chip${t === currentTag ? ' selected' : ''}" data-tag="${escHtml(t)}">${escHtml(t)}</span>`
  ).join('');

  return `
    <div class="tag-selector">
      <div class="tag-chips" id="tag-chip-area">${chips}</div>
      <input class="form-input tag-custom-input" id="wf-tag-custom"
        placeholder="직접 입력 (선택하면 chip이 해제됩니다)"
        value="${currentTag && !PRESET_TAGS.includes(currentTag) ? escHtml(currentTag) : ''}"
        oninput="onTagCustomInput(this)" />
    </div>`;
}

function attachTagChipEvents() {
  document.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const wasSelected = chip.classList.contains('selected');
      document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('selected'));
      if (!wasSelected) chip.classList.add('selected');
      const customInput = document.getElementById('wf-tag-custom');
      if (customInput) customInput.value = '';
    });
  });
}

function onTagCustomInput(input) {
  if (input.value.trim()) {
    document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('selected'));
  }
}

function getSelectedTag() {
  const chip = document.querySelector('.tag-chip.selected');
  if (chip) return chip.dataset.tag;
  return document.getElementById('wf-tag-custom')?.value.trim() || '';
}

// ── 8. 이미지 ─────────────────────────────────────────────
function previewImages(input) {
  const preview = document.getElementById('wf-preview');
  if (!preview) return;
  preview.innerHTML = '';
  Array.from(input.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wrap = document.createElement('div');
      wrap.className = 'preview-item';
      wrap.innerHTML = `<img src="${e.target.result}" class="preview-img" alt="${escHtml(file.name)}" />
        <span class="preview-name">${escHtml(file.name)}</span>`;
      preview.appendChild(wrap);
    };
    reader.readAsDataURL(file);
  });
}

function getPreviewImages() {
  return Array.from(document.querySelectorAll('.preview-img')).map(img => img.src);
}

// ── 모바일: 사이드바 드로어 토글 ─────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar.classList.contains('drawer-open')) {
    closeSidebar();
  } else {
    sidebar.classList.add('drawer-open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('drawer-open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// 서브메뉴 항목 클릭 시 드로어 자동 닫기
document.addEventListener('click', function(e) {
  if (e.target.closest('#sidebar-content li') && window.innerWidth <= 768) {
    setTimeout(closeSidebar, 120);
  }
});
