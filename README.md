# dup-web

Vue.js와 Vite를 기반으로 하는 웹 애플리케이션입니다. 사용자 인증, 역할 기반 접근 제어, 데이터 관리 및 PDF 생성/다운로드 기능을 포함하고 있습니다.

# 실행 화면
https://github.com/user-attachments/assets/1ea49b40-5750-40a6-9136-2571bbcfdf39

# 주요 기능

- **사용자 인증**: JWT(JSON Web Token)를 사용한 로그인 및 회원가입 기능. Access Token 만료 시 자동으로 갱신합니다.
- **역할 기반 접근 제어 (RBAC)**: 'ADMIN', 'VOUCHER' 등 사용자 역할에 따라 특정 페이지 접근을 제어합니다.
- **PDF 처리**: `pdf-lib` 라이브러리를 사용하여 클라이언트 측에서 PDF 문서를 생성하고, `jszip`으로 압축하여 다운로드하는 기능을 제공합니다.
- **상태 관리**: `Pinia`를 사용하여 전역 상태를 관리합니다.
- **스타일링**: `Tailwind CSS`를 활용하여 일관된 UI를 구축합니다.

# 기술 스택

- **프레임워크**: Vue.js 3
- **빌드 도구**: Vite
- **라우팅**: Vue Router
- **상태 관리**: Pinia
- **스타일링**: Tailwind CSS
- **핵심 라이브러리**:
  - `pdf-lib`: PDF 생성 및 수정
  - `jszip`: 파일 압축
  - `file-saver`: 파일 다운로드
  - `jwt-decode`: JWT 파싱
  - `vue-toastification`: 알림 메시지
  - `lucide-vue-next`: 아이콘

# 라우팅 정보

- `/`: 메인 페이지 (VOUCHER 또는 ADMIN 역할 필요)
- `/extra`: 추가 기능 페이지 (인증된 사용자 접근 가능)
- `/user-approval`: 사용자 승인 페이지 (ADMIN 역할 필요)
- `/login`: 로그인 페이지
- `/signup`: 회원가입 페이지

# 환경설정

## 윈도우

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
```

## 맥

```bash
brew install pnpm
pnpm install
```

### arm64 에러 발생시

```bash
pnpm install @rollup/rollup-linux-x64-gnu --save-optional
```

# 사용 가능한 스크립트

- `pnpm dev`: 개발 서버를 실행합니다.
- `pnpm build`: 프로덕션용으로 프로젝트를 빌드합니다.
- `pnpm preview`: 프로덕션 빌드를 로컬에서 미리 봅니다.
- `pnpm start`: `preview`와 유사하지만, 호스트를 지정하여 실행할 수 있습니다.

# 코드 스타일

이 프로젝트는 `Prettier`와 `prettier-plugin-tailwindcss`를 사용하여 코드 스타일을 통일합니다. 코드를 커밋하기 전에 아래 명령어를 실행하여 포맷팅을 적용하는 것을 권장합니다.

```bash
pnpm prettier --write .
```
