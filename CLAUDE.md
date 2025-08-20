# 무한 스크롤 및 그룹 접기 최적화 작업 진행 상황

## 현재 상태 (2025-08-05)
BaseList.vue에서 그룹 접기 시 무한 스크롤 연속 로딩 기능을 구현 중입니다.

### 구현된 기능
1. **로딩 오버레이**: 깔끔한 단일 스피너 + 사용자 인터랙션 차단
2. **연속 로딩 로직**: 접힌 그룹으로 화면이 비면 여러 페이지 연속 로딩
3. **적응형 조건**: 숨겨진 아이템 비율(`hiddenRatio`)에 따른 스마트 임계값
4. **무한 루프 방지**: 쿨다운 시스템 + 연속 로딩 상태 관리

### 현재 문제점
- **300개 그룹 접기 시**: 2페이지 정도만 로딩하고 중단됨
- **원인**: `isSeriouslyEmpty`가 2페이지 후 `false`로 변경되어 쿨다운 적용됨
- **증상**: `scrollableHeight < 200` 조건이 2페이지 로딩 후 만족하지 않게 됨

### 핵심 코드 위치
- 파일: `/src/components/base/BaseList.vue`
- 함수: `checkAndRequestMoreIfNeeded()` (line ~164)
- 문제 조건: `isSeriouslyEmpty = scrollableHeight < 200` (line ~176)

### 다음 해결 방안
1. `isSeriouslyEmpty` 조건을 `hiddenRatio` 기반으로 변경
2. 또는 큰 그룹 접기 시 더 오래 지속되는 연속 로딩 모드 추가
3. 숨겨진 아이템 수에 비례한 동적 임계값 설정

### 관련 변수들
- `hiddenRatio`: 숨겨진 아이템 비율 (0.7+ 시 적극적 로딩)
- `heightThreshold`: 높이 기준 (hiddenRatio에 따라 400~800px)
- `requiredRows`: 필요 행 수 (1~3배 동적 조정)
- `continuousLoading`: 연속 로딩 상태 관리

---

# 프로젝토링 분석 결과 (보관)

## 프로젝트 개요
- **프로젝트명**: dup (Vue.js 파일 관리 시스템)
- **기술 스택**: Vue 3, Vite, Pinia, TailwindCSS
- **분석일**: 2025-07-02

## 중복 컴포넌트 분석 결과

### 🔴 완전 동일한 컴포넌트 (100% 중복) - 즉시 통합 가능
1. **App.vue** (extra/ vs lists/) - 완전 동일한 Header, Main, Footer 구조
2. **Main.vue** (extra/ vs lists/) - 완전 동일한 List 컴포넌트 래퍼
3. **PdfPreview.vue** (extra/ vs lists/) - 완전 동일한 PDF 미리보기, Web Worker 사용
4. **Sentinel.vue** (extra/ vs lists/) - 완전 동일한 Intersection Observer 무한 스크롤

### 🟡 거의 동일한 컴포넌트 (95% 유사) - 쉬운 통합
1. **DateSearch.vue** (extra/ vs lists/)
   - 차이점: extra에만 `allowInput: true`, `handleBlur` 이벤트
   - 통합 방법: props로 `allowInput` 옵션 제어

### 🟢 유사하지만 기능적 차이 - 조건부 통합
1. **Dropdown.vue** (extra/ vs lists/)
   - extra: 그룹 생성/삭제, 사용자 권한 관리 기능
   - lists: 기본 드롭다운만
   - 통합 방법: props로 고급 기능 활성화/비활성화

2. **EditModal.vue** (extra/ vs lists/)
   - extra: 단일 파일 편집
   - lists: 다중 파일 편집, 파일 삭제 체크박스
   - 통합 방법: props로 단일/다중 모드 구분

3. **Searchbar.vue** (extra/ vs lists/)
   - extra: '설명+첨부파일' 옵션 하나
   - lists: '계정과목', '거래처', '적요' 세 개 옵션
   - 통합 방법: props로 검색 옵션 배열 전달

4. **UserInput.vue** (extra/ vs lists/)
   - extra: 파일 입력, 그룹 ID 지원
   - lists: 바우처 입력, 금액 필드 추가
   - 통합 방법: props로 필드 구성 제어

### ❌ 통합 불가능한 컴포넌트
1. **List.vue** (extra/ vs lists/)
   - extra: 파일 관리 시스템 (fileLists, 그룹 관리)
   - lists: 바우처 관리 시스템 (voucherLists, 회계 정보)
   - 완전히 다른 도메인 로직으로 통합 불가

## 제안 리팩토링 계획

### 1단계: 완전 중복 제거 (높은 우선순위)
```
/src/components/shared/ 폴더 생성 후 이동:
- Sentinel.vue
- PdfPreview.vue  
- Main.vue
- App.vue (extra/lists 통합)
```

### 2단계: 조건부 통합 (중간 우선순위)
```
DateSearch.vue - allowInput props 추가
Searchbar.vue - searchOptions props 배열로 전달
```

### 3단계: 복잡한 통합 (낮은 우선순위)
```
Dropdown.vue - 고급 기능 props로 제어
EditModal.vue - 단일/다중 모드 props로 구분
UserInput.vue - 필드 구성 props로 제어
```

### 최종 구조 제안
```
/src/components/
├── shared/           # 공통 컴포넌트
│   ├── App.vue
│   ├── Main.vue
│   ├── PdfPreview.vue
│   ├── Sentinel.vue
│   ├── DateSearch.vue
│   └── Searchbar.vue
├── extra/            # 파일 관리 전용
│   ├── List.vue
│   ├── Dropdown.vue
│   ├── EditModal.vue
│   └── UserInput.vue
└── lists/            # 바우처 관리 전용
    ├── List.vue
    ├── EditModal.vue
    └── UserInput.vue
```

## 예상 효과
- **코드 감소**: 약 40% 중복 코드 제거
- **유지보수성**: 공통 컴포넌트 중앙 관리
- **일관성**: 동일 기능의 일관된 구현
- **개발 효율성**: 새 기능 개발 시 재사용성 향상

## 리팩토링 재개 방법
내일 리팩토링을 재개하려면:
1. `내 프로젝트의 CLAUDE.md 파일을 읽어서 어제 분석한 리팩토링 계획을 기반으로 리팩토링을 진행해줘`
2. 또는 `1단계 완전 중복 제거부터 시작해줘`

## 진행 상태
- [x] 프로젝트 구조 분석
- [x] 중복 코드 식별
- [x] 리팩토링 계획 수립
- [ ] 리팩토링 실행 (대기 중)

---

# 전자결재 시스템 도입 계획 (2025-08-20)

## 📋 시스템 분석 결과

### 현재 프로젝트 구조
- **기술스택**: Vue 3 + Pinia + TailwindCSS + Vite
- **주요 기능**: 바우처 관리, 파일 첨부, PDF 생성/병합, 사용자 권한 관리
- **인증 시스템**: JWT 기반, RBAC (ADMIN, VOUCHER 역할)
- **데이터 흐름**: authFetch를 통한 백엔드 API 통신

## 🎯 전자결재 기능 요구사항

### 1. 결재 상태 관리
- **결재 대기**: 상신 후 첫 번째 결재자 승인 대기
- **결재 진행중**: 일부 결재자 승인, 다음 결재자 대기  
- **결재 완료**: 모든 결재선 승인 완료
- **결재 반려**: 결재자가 반려 처리
- **결재 회수**: 상신자가 직접 회수

### 2. 결재선 구조
- **순차 결재**: 1차 → 2차 → 3차 순서대로 진행
- **병렬 결재**: 동일 단계에서 여러 결재자 동시 승인
- **필수/선택**: 필수 결재자와 참조자 구분
- **대결**: 부재 시 대리 결재자 지정

### 3. 권한별 기능
- **상신자**: 결재 요청, 진행 상황 조회, 회수
- **결재자**: 승인/반려, 의견 작성, 위임
- **관리자**: 결재선 템플릿 관리, 강제 완료/취소

## 🏗️ 구현 계획

### Phase 1: 데이터 모델 및 상태 관리 (1-2일)

#### 1.1 타입 정의 확장
```javascript
// src/stores/useTypeStore.js 확장
export const APPROVAL_STATUS = {
  DRAFT: 'DRAFT',           // 임시저장
  PENDING: 'PENDING',       // 결재 대기  
  IN_PROGRESS: 'IN_PROGRESS', // 결재 진행중
  APPROVED: 'APPROVED',     // 결재 완료
  REJECTED: 'REJECTED',     // 결재 반려
  RECALLED: 'RECALLED'      // 결재 회수
};

export const APPROVAL_ACTION = {
  SUBMIT: 'SUBMIT',         // 상신
  APPROVE: 'APPROVE',       // 승인
  REJECT: 'REJECT',         // 반려
  RECALL: 'RECALL',         // 회수
  DELEGATE: 'DELEGATE'      // 위임
};
```

#### 1.2 결재 관련 Pinia Store 생성
```javascript
// src/stores/useApprovalStore.js
- 결재선 관리 (approvalLines)
- 결재 히스토리 (approvalHistory) 
- 현재 결재 상태 (currentApprovalStatus)
- 결재 권한 확인 (canApprove, canRecall)
```

#### 1.3 사용자 관리 Store 확장
```javascript
// src/stores/useUserStore.js (신규)
- 조직도 데이터 (departments, users)
- 결재자 검색 및 선택
- 부재/대결 설정
```

### Phase 2: UI 컴포넌트 개발 (2-3일)

#### 2.1 결재선 설정 컴포넌트
```
src/components/approval/
├── ApprovalLineModal.vue      # 결재선 설정 모달
├── ApprovalUserSearch.vue     # 결재자 검색/선택
├── ApprovalLinePreview.vue    # 결재선 미리보기
└── ApprovalTemplateSelect.vue # 결재선 템플릿 선택
```

#### 2.2 결재 진행 상황 컴포넌트  
```
src/components/approval/
├── ApprovalStatus.vue         # 결재 상태 표시
├── ApprovalHistory.vue        # 결재 히스토리
├── ApprovalActionButtons.vue  # 승인/반려 버튼
└── ApprovalComments.vue       # 결재 의견
```

#### 2.3 결재 관리 페이지
```
src/components/approval/
├── ApprovalDashboard.vue      # 결재 대시보드
├── MyApprovalList.vue         # 내가 올린 결재
├── PendingApprovalList.vue    # 결재 대기 목록
└── CompletedApprovalList.vue  # 완료된 결재
```

### Phase 3: 기존 시스템 통합 (2-3일)

#### 3.1 바우처 시스템 통합
- `src/components/lists/List.vue`에 결재 상태 컬럼 추가
- 결재 완료된 바우처만 수정 가능하도록 제한
- 결재 진행중인 항목 시각적 구분

#### 3.2 파일 시스템 통합  
- `src/components/extra/List.vue`에 결재 플로우 적용
- 파일 업로드 시 자동 결재선 적용 옵션
- 결재 완료 후 파일 잠금 처리

#### 3.3 권한 시스템 확장
```javascript
// 새로운 역할 추가
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  VOUCHER: 'VOUCHER', 
  APPROVER: 'APPROVER',     // 결재자
  SUBMITTER: 'SUBMITTER'    // 상신자
};
```

### Phase 4: API 연동 및 최적화 (1-2일)

#### 4.1 백엔드 API 연동
```javascript
// src/utils/approvalApi.js
- submitApproval()      // 결재 상신
- approveItem()         // 승인 처리  
- rejectItem()          // 반려 처리
- recallApproval()      // 회수 처리
- getApprovalHistory()  // 결재 히스토리 조회
```

#### 4.2 실시간 알림 시스템
- WebSocket 또는 SSE를 통한 결재 상태 실시간 업데이트
- 결재 요청/완료 시 관련자에게 알림

#### 4.3 성능 최적화
- 결재 히스토리 무한 스크롤
- 결재선 설정 캐싱
- 대용량 파일 결재 시 진행률 표시

## 📱 UI/UX 설계 원칙

### 1. 기존 디자인 시스템 활용
- TailwindCSS 컬러 팔레트 유지
- 기존 버튼/모달 스타일 일관성 유지
- Lucide 아이콘 활용

### 2. 사용성 우선 설계
- 결재선 설정: 드래그 앤 드롭으로 직관적 순서 변경
- 상태 표시: 컬러 코딩으로 한눈에 파악 가능
- 모바일 반응형: 스마트폰에서도 결재 가능

### 3. 접근성 고려
- 키보드 네비게이션 지원
- 스크린 리더 호환성
- 고대비 모드 지원

## 🚀 개발 일정

### Week 1 (1-3일차)
- [x] 요구사항 분석 및 설계
- [ ] 데이터 모델 및 Store 구현
- [ ] 기본 컴포넌트 구조 설계

### Week 2 (4-6일차)  
- [ ] 결재선 설정 UI 구현
- [ ] 결재 상태 표시 컴포넌트
- [ ] 승인/반려 기능 구현

### Week 3 (7-9일차)
- [ ] 기존 바우처/파일 시스템 통합
- [ ] API 연동 및 테스트
- [ ] 사용자 권한 시스템 확장

### Week 4 (10-12일차)
- [ ] 실시간 알림 시스템
- [ ] 성능 최적화 및 버그 수정
- [ ] 사용자 테스트 및 피드백 반영

## 🎯 다음 작업 재개 방법

### 즉시 시작 가능한 작업
1. **데이터 모델 구현**: `src/stores/useTypeStore.js`에 결재 상태 타입 추가
2. **결재 Store 생성**: `src/stores/useApprovalStore.js` 파일 생성
3. **사용자 Store 생성**: `src/stores/useUserStore.js` 파일 생성

### 재개 명령어 예시
```
전자결재 시스템 개발을 이어서 진행해줘. CLAUDE.md의 Phase 1부터 시작해줘.
```

## 📝 중요 참고사항

### 기존 코드와의 호환성
- 기존 `authFetch` 패턴 유지
- BaseList.vue의 무한 스크롤 로직 재활용
- 기존 모달 스타일과 일관성 유지

### 보안 고려사항
- 결재 권한 서버사이드 검증 필수
- 결재 히스토리 위변조 방지
- 민감한 결재 정보 암호화 전송

### 성능 고려사항
- 대용량 결재 목록 가상 스크롤링
- 결재선 설정 템플릿 캐싱
- 실시간 알림 최적화

---

## 프로젝트 현재 상태 (2025-08-20)
- **무한 스크롤 최적화**: 완료 (BaseList.vue)
- **리팩토링 계획**: 수립 완료, 실행 대기
- **전자결재 시스템**: 계획 수립 완료, 구현 시작 대기