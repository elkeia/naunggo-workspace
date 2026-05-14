# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

정적 HTML 홈페이지 — "naunggo 작업공간". 빌드 도구 없이 브라우저에서 직접 `index.html`을 열어 실행합니다.

## Running the Site

빌드·컴파일 단계 없음. 브라우저에서 `index.html`을 직접 열거나, 간단한 로컬 서버를 사용합니다.

```bash
# Python 3
python -m http.server 8000

# Node.js (npx 사용)
npx serve .
```

## File Structure & Architecture

```
index.html        HTML 구조 (레이아웃, 모달 마크업 포함)
css/style.css     전체 스타일
js/data.js        메뉴·서브메뉴·게시글 데이터 (menuData 전역 객체)
js/auth.js        인증·권한 관리 (currentUser, userDB, login/logout/signup, canWrite, canEditPost, updateHeader)
js/nav.js         네비게이션·사이드바·게시판 렌더링 (목록·상세·글쓰기·수정·댓글·태그 선택기)
js/chat.js        우측 AI 채팅창 (sendChat, fetchBotReply, addBubble)
js/modal.js       로그인·회원가입 모달 처리 (handleLogin, handleSignup)
js/admin.js       관리자 패널 (게시판 관리·회원 관리 2탭 모달)
```

**JS 로드 순서** (`index.html` 하단): `data → auth → nav → chat → modal → admin`
`auth.js`가 `nav.js`보다 먼저 로드되어야 `escHtml`, `currentUser`, `canWrite` 등이 참조 가능합니다.

## Key Patterns

**데이터 추가**: `js/data.js`의 `menuData` 객체만 수정합니다. 각 최상위 키가 네비게이션 메뉴 이름이고, `submenus` 배열과 `posts` 객체를 가집니다. post 필드: `title`, `author`, `authorId`, `date`, `views`, `preview`, `content`, `images`, `comments`, `tag`.

**권한 시스템**:
- 관리자 계정: ID `admin` / PW `admin1234` (하드코딩, `auth.js` 상수)
- `ADMIN_ONLY_MENUS = ['소개', '시', '그림', '정보']` — 관리자만 글쓰기, 일반 회원은 댓글만
- `canWrite(menu)` — 비로그인 false, 관리자 전용 메뉴는 isAdmin(), 게시판은 모든 로그인 회원
- `canEditPost(authorId)` — 본인(`currentUser.id === authorId`) 또는 관리자
- 회원 DB(`userDB`)는 메모리 배열 — 새로고침 시 초기화됨

**한글 검색**: `renderBoardList`는 툴바(검색 input 포함)와 `#board-list-area`(결과 테이블)를 분리 렌더링합니다. 검색 이벤트는 `compositionend` + `input`의 `isComposing` 체크를 사용해 한글 조합 중 재렌더링을 막습니다.

**LLM API 연결**: `js/chat.js`의 `fetchBotReply(userText)` 함수를 교체합니다. 현재는 더미 응답 배열을 순환합니다. `sendChat()`은 async이므로 `await fetchBotReply()`를 그대로 사용 가능합니다.

**레이아웃**: CSS Grid 3단 구조 (`200px 1fr 280px`). 헤더도 3열 grid (`1fr 2fr 1fr`). 반응형 미적용 — 최소 너비 약 900px 이상 환경 기준.

**XSS 방지**: `auth.js`에 정의된 `escHtml(str)`을 모든 사용자 입력 렌더링에 사용합니다. `nav.js`와 `admin.js`에서 innerHTML 삽입 시 반드시 적용합니다.
