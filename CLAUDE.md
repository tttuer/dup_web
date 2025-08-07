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