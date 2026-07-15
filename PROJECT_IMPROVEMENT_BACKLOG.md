# 프로젝트 개선 백로그

`dup_web`(프론트엔드)와 `dup`(백엔드)을 함께 검토한 뒤 정리한 작업 목록이다.

## 진행 원칙

- P0는 새 기능보다 먼저 처리한다.
- 권한 검사는 프론트 화면 노출 여부가 아니라 백엔드에서 강제한다.
- 각 작업은 테스트와 배포 검증을 포함해 완료한다.
- 큰 작업은 독립 배포 가능한 단위로 나눈다.

## P0 — 보안 및 권한

### 1. 사용자 관리 권한 분리

- [ ] `PATCH /api/users/{user_id}`를 관리자와 본인 수정 경로로 분리한다.
- [ ] 일반 사용자는 본인의 이름·비밀번호만 수정할 수 있게 한다.
- [ ] 역할 변경, 타인 비밀번호 변경, 사용자 목록 조회는 관리자만 허용한다.
- [ ] 역할 변경·계정 삭제·승인 처리의 감사 로그를 남긴다.

완료 기준: 일반 사용자 토큰으로 타인의 정보, 비밀번호, 역할을 변경하거나 전체 사용자를 조회할 수 없다.

관련 코드: `dup/interface/controller/user_controller.py`

### 2. 파일·그룹·전표 접근 권한 공통화

- [ ] `require_role`과 `authorize_group_access` 같은 공통 권한 정책을 만든다.
- [ ] 파일 단건 조회·수정·삭제·일괄 다운로드에 그룹 접근 권한을 적용한다.
- [ ] 그룹 단건 조회·수정에도 소유자 또는 관리자 검사를 적용한다.
- [ ] 전표 조회·첨부·동기화·파일 다운로드를 `VOUCHER` 또는 `ADMIN` 역할로 제한한다.
- [ ] 권한 검사를 controller뿐 아니라 service 계층에서도 보장한다.

완료 기준: URL이나 ID를 직접 변경해도 권한 없는 파일·그룹·전표에 접근할 수 없다.

관련 코드: `dup/interface/controller/file_controller.py`, `dup/application/file_service.py`, `dup/application/group_service.py`, `dup/interface/controller/whg_controller.py`

### 3. 전자결재 전체 검색 접근 제한

- [ ] 전체 결재 검색 API를 관리자 전용으로 제한하거나 열람 가능한 문서만 조회하도록 바꾼다.
- [ ] 검색·상세·첨부 다운로드의 권한 규칙을 동일하게 맞춘다.

완료 기준: 일반 사용자는 기안자·결재자·관리자 권한이 없는 결재 문서를 검색하거나 열람할 수 없다.

관련 코드: `dup/application/approval_service.py`

### 4. 위키 XSS 및 업로드 보안

- [ ] 위키 HTML/Markdown 렌더링 전에 허용 목록 기반 정제를 적용한다.
- [ ] 서버에도 동일한 정제 정책을 적용한다.
- [ ] 위키 이미지·첨부 업로드에 허용 MIME, 매직 바이트, 파일 크기 제한을 추가한다.
- [ ] 이미지·첨부 다운로드에 인증 또는 짧은 수명의 서명 URL을 적용한다.
- [ ] 응답에 `X-Content-Type-Options: nosniff`를 적용한다.

완료 기준: 스크립트·이벤트 속성·위험 URL이 위키에서 실행되지 않고, 허용되지 않은 파일을 올리거나 열람할 수 없다.

관련 코드: `dup_web/src/components/wiki/WikiViewer.vue`, `dup/interface/controller/wiki_controller.py`, `dup/application/wiki_service.py`

### 5. 인증 토큰 및 로그인 보강

- [ ] Refresh Token을 응답 JSON에서 제거하고 HttpOnly 쿠키로만 전달한다.
- [ ] Access/Refresh Token에 용도(`token_type`), 발급 ID(`jti`), 발급자·대상 정보를 넣고 검증한다.
- [ ] Refresh Token 회전 및 서버 측 폐기 처리를 추가한다.
- [ ] 로그아웃, 비밀번호 변경, 역할 회수 시 기존 세션을 무효화한다.
- [ ] 로그인 및 회원가입에 rate limit과 비밀번호 정책을 적용한다.
- [ ] WebSocket URL의 쿼리 토큰을 쿠키 또는 일회용 연결 토큰으로 교체한다.

완료 기준: Refresh Token을 Access Token으로 사용할 수 없고, 로그아웃한 세션은 다시 갱신할 수 없다.

관련 코드: `dup/common/auth.py`, `dup/interface/controller/user_controller.py`, `dup_web/src/utils/authFetch.js`

### 6. 배포 시크릿 제거

- [ ] `.dockerignore`를 추가해 `.env`, 가상환경, 로컬 데이터, 빌드 산출물을 Docker context에서 제외한다.
- [ ] CI에서 `.env`를 이미지에 복사하지 않는다.
- [ ] Kubernetes Secret 또는 배포 환경 변수로 런타임에 시크릿을 주입한다.
- [ ] 기존 이미지에 시크릿이 포함됐을 가능성을 점검하고 필요한 키를 회전한다.

완료 기준: 이미지 레이어와 컨테이너 레지스트리에 DB·JWT·외부 서비스 시크릿이 남지 않는다.

관련 코드: `dup/.github/workflows/deploy.yml`, `dup/Dockerfile`

## P1 — 데이터 조회 및 파일 성능

### 7. 목록 조회에서 바이너리 데이터 제외

- [ ] 파일 목록은 `file_data`를 제외한 Projection으로 조회한다.
- [ ] 전표 목록은 첨부 파일 본문을 제외하고 파일 ID·이름·업로드일만 조회한다.
- [ ] 상세·다운로드에서만 실제 파일 바이트를 읽는다.

완료 기준: 목록 API 응답 크기와 MongoDB 조회량이 첨부파일 크기에 비례해 증가하지 않는다.

관련 코드: `dup/infra/repository/file_repo.py`, `dup/infra/repository/voucher_repo.py`

### 8. 파일 저장·다운로드 구조 통일

- [ ] 전표·업무 파일·위키 첨부의 저장 방식을 GridFS 또는 객체 저장소로 통일한다.
- [ ] MongoDB 문서에는 파일 메타데이터와 저장소 키만 보관한다.
- [ ] 단일 파일은 바이너리 스트리밍으로 내려준다.
- [ ] 대용량 ZIP은 메모리 전체 적재 대신 스트리밍 또는 임시 저장소를 사용한다.
- [ ] 업로드 파일 수·용량 제한과 ZIP 파일명 정제를 추가한다.

완료 기준: 큰 파일이나 다량 다운로드가 API 프로세스 메모리를 과도하게 사용하지 않는다.

### 9. 전표 검색 및 묶음 조회 최적화

- [ ] `group_key = company:voucher_date:no_acct`를 저장하거나 동등한 복합 인덱스를 만든다.
- [ ] `company + voucher_date + no_acct` 및 목록 정렬용 복합 인덱스를 추가한다.
- [ ] 검색어를 정규식에 넣기 전 이스케이프한다.
- [ ] 데이터가 커지면 묶음 확장 검색을 aggregation 기반으로 변경한다.
- [ ] 검색 결과에 직접 일치 행과 같은 묶음으로 포함된 행을 구분하는 정보를 추가한다.

완료 기준: 넓은 기간·일반 검색어에서도 전표 묶음 검색이 안정적으로 페이징되고 응답 시간이 급격히 증가하지 않는다.

관련 코드: `dup/application/voucher_service.py`, `dup/infra/repository/voucher_repo.py`, `dup/infra/db_models/voucher.py`

### 10. 전자결재 대기 목록 DB 페이징

- [ ] 모든 진행 중 결재를 메모리로 읽은 뒤 필터링하는 로직을 DB aggregation으로 옮긴다.
- [ ] 결재자·상태·단계 기준 인덱스를 설계한다.
- [ ] 페이지 요청마다 필요한 문서와 결재선만 조회한다.

완료 기준: 결재 문서 수가 증가해도 대기 목록의 메모리 사용량과 응답 시간이 페이지 크기에 가깝게 유지된다.

관련 코드: `dup/application/approval_service.py`

### 11. WebSocket 및 동기화 작업 구조 개선

- [ ] Redis 채널별 listener를 프로세스당 하나만 유지한다.
- [ ] 동기화·관리자 알림·전자결재 알림의 연결 집합을 분리한다.
- [ ] 재연결에 지수 백오프와 최대 대기 시간을 적용한다.
- [ ] WEHAGO 동기화를 API 요청과 분리한 작업 큐로 옮긴다.
- [ ] 회사·연도별 분산 락을 추가한다.
- [ ] 다중 인스턴스 환경에서 스케줄러가 중복 실행되지 않게 한다.

완료 기준: 연결 수가 늘어도 중복 알림이 발생하지 않고, 동기화가 API worker를 장시간 점유하지 않는다.

관련 코드: `dup/interface/controller/sync.py`, `dup/application/websocket_manager.py`, `dup/utils/scheduler.py`

## P2 — UX/UI 개선

### 12. 전표 검색 결과의 묶음 표현

- [x] 검색 일치 행에 `검색 일치` 표시를 한다. (2026-07-14)
- [x] 연관 행은 같은 전표 묶음으로 시각적으로 연결한다. (2026-07-14, `같은 전표` 배지)
- [x] `직접 일치 n건 / 묶음 포함 n건` 결과 요약을 제공한다. (2026-07-14)
- [ ] 전표 묶음 접기·펼치기와 묶음별 금액 합계를 제공한다.

### 13. 검색·목록 상태 개선

- [ ] 작은 화면에서도 필터와 검색 입력 영역이 화면 밖으로 넘치지 않게 한다. (드롭다운 레이어 동작을 보존하는 방식으로 재검토 필요)
- [x] 선택한 회사·기간·정렬·검색 조건을 URL 또는 로컬 저장소에 유지한다. (2026-07-14, 회사·기간·검색 조건 URL query 유지)
- [x] 결과 수, 로딩 수, 빈 상태, 오류 상태, 재시도 UI를 제공한다. (2026-07-14)
- [x] 빠르게 조건을 바꿀 때 이전 요청을 취소해 오래된 응답이 화면을 덮지 않게 한다. (2026-07-14, `AbortController`)
- [ ] 무한 스크롤 목록은 가상 스크롤을 적용한다.

### 14. 동기화 UX 개선

- [ ] 회사·연도·진행 단계·성공 건수·실패 사유를 보여주는 동기화 패널을 만든다.
- [ ] 중복 동기화 요청을 막고 완료 후 결과를 확인할 수 있게 한다.

### 15. 반응형·접근성 개선

- [x] 표 화면을 작은 화면에서 카드 또는 열 선택 방식으로 제공한다. (2026-07-15, `BaseList` 모바일 카드 레이아웃)
- [x] 모든 모달에 `role="dialog"`, `aria-modal`, 포커스 트랩, Escape 닫기를 적용한다. (2026-07-15, 앱 전역 모달 접근성 처리)
- [ ] 아이콘 버튼의 접근성 이름과 입력 필드의 명시적 label을 추가한다.
- [x] 메뉴는 `input type="button"` 대신 `button` 또는 `RouterLink`로 통일한다. (2026-07-15, 헤더 메뉴)

관련 코드: `dup_web/src/components/base/BaseList.vue`, `dup_web/src/components/Header.vue`

## P2 — 코드 품질 및 개발 경험

### 16. 프론트 API 계층 통합

- [ ] 컴포넌트에 흩어진 `authFetch` 호출을 도메인 API 모듈로 옮긴다.
- [ ] 공통 오류 처리, Refresh Token 단일 실행, AbortController를 제공한다.
- [ ] API 응답의 페이지 형식을 통일한다.
- [ ] 점진적으로 TypeScript 또는 OpenAPI 타입 생성을 도입한다.

### 17. 대형 컴포넌트와 중복 UI 분리

- [ ] 전자결재 생성·상세·목록의 상태/요청 로직을 composable로 분리한다.
- [ ] `lists`와 `extra`의 DateSearch, Dropdown, Searchbar 등 중복 컴포넌트를 통합한다.
- [ ] 파일 크기가 큰 Store와 컴포넌트를 기능 단위로 분할한다.
- [ ] 사용하지 않는 상태·주석 처리된 과거 로직을 제거한다.

### 18. 라우트 및 무거운 기능 지연 로딩

- [ ] 모든 화면 라우트를 동적 import로 전환한다.
- [ ] 위키 에디터, Prism, PDF/ZIP 관련 모듈은 실제 진입 시 로드한다.

관련 코드: `dup_web/src/router.js`

### 19. 테스트와 품질 게이트

- [ ] 프론트: lint, unit test, build 검증을 추가한다.
- [ ] 백엔드: Ruff, 타입 검사, pytest를 추가한다.
- [ ] 권한·XSS·파일 업로드·전표 묶음 검색·페이지 처리의 통합 테스트를 작성한다.
- [ ] main 배포 전 CI가 반드시 통과하도록 한다.

## P3 — 운영 및 신뢰성

### 20. 배포 안정성

- [ ] Docker `latest` 태그 대신 commit SHA 또는 이미지 digest를 사용한다.
- [ ] Vite preview 대신 Nginx/Caddy로 프론트 정적 파일을 제공한다.
- [ ] Docker 이미지를 non-root 사용자로 실행한다.
- [ ] GitHub Actions를 고정 버전 또는 commit SHA로 pin 한다.
- [ ] readiness 확인과 자동 rollback을 추가한다.

### 21. 관측성과 복구

- [ ] `/health/live`, `/health/ready`를 추가한다.
- [ ] 구조화 로그, 요청 ID, 오류율·응답 시간·큐 대기 시간 메트릭을 수집한다.
- [ ] MongoDB/파일 저장소 백업과 복구 훈련을 정례화한다.
- [ ] 파일 보존 기간과 삭제 정책을 문서화한다.

### 22. 데이터 모델 정리

- [ ] 프론트·백엔드의 회사/역할/상태 enum 계약을 문서화하거나 생성한다.
- [ ] infra 모델을 domain 인터페이스에서 직접 참조하는 의존성을 줄인다.
- [ ] 인덱스와 스키마 변경을 재현 가능한 migration으로 관리한다.

## 권장 진행 순서

1. P0-1 ~ P0-6: 권한, XSS, 토큰, 시크릿
2. P1-7 ~ P1-9: 목록 바이너리 제외, 파일 저장 구조, 전표 검색 인덱스
3. P1-10 ~ P1-11: 전자결재 및 WebSocket/동기화 확장성
4. P2-12 ~ P2-19: 검색 UX, 접근성, 프론트 구조, 테스트
5. P3-20 ~ P3-22: 배포, 관측성, 백업, 데이터 모델 정리
