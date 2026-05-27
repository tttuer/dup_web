import { config } from 'md-editor-v3';

config({
  editorConfig: {
    languageUserDefined: {
      'ko-KR': {
        toolbarTips: {
          bold: '굵게',
          underline: '밑줄',
          italic: '기울임꼴',
          strikeThrough: '취소선',
          title: '제목',
          sub: '아래첨자',
          sup: '위첨자',
          quote: '인용',
          unorderedList: '기호 목록',
          orderedList: '숫자 목록',
          task: '할 일 목록',
          codeRow: '인라인 코드',
          code: '코드 블록',
          link: '링크',
          image: '이미지',
          table: '표',
          mermaid: '머메이드',
          katex: '수식',
          revoke: '실행 취소',
          next: '다시 실행',
          save: '저장',
          prettier: '자동 정렬',
          pageFullscreen: '전체 화면',
          fullscreen: '전체 화면',
          preview: '미리보기',
          htmlPreview: 'HTML 미리보기',
          catalog: '목차',
          github: '소스 코드'
        },
        titleItem: {
          h1: '제목 1',
          h2: '제목 2',
          h3: '제목 3',
          h4: '제목 4',
          h5: '제목 5',
          h6: '제목 6'
        },
        imgTitleItem: {
          link: '이미지 링크 추가',
          upload: '이미지 업로드',
          clip2upload: '클립보드에서 업로드'
        },
        linkModalTips: {
          linkTitle: '링크 추가',
          imageTitle: '이미지 추가',
          descLabel: '설명:',
          descLabelPlaceHolder: '설명을 입력하세요...',
          urlLabel: '링크:',
          urlLabelPlaceHolder: '링크를 입력하세요...',
          buttonOK: '확인'
        },
        clipModalTips: {
          title: '이미지 자르기',
          buttonUpload: '업로드'
        },
        copyCode: {
          text: '코드 복사',
          successTips: '복사 성공!',
          failTips: '복사 실패!'
        },
        mermaid: {
          flow: '순서도',
          sequence: '시퀀스 다이어그램',
          gantt: '간트 차트',
          class: '클래스 다이어그램',
          state: '상태 다이어그램',
          pie: '파이 차트',
          relationship: '관계도',
          journey: '여정 다이어그램'
        },
        footer: {
          markdownTotal: '글자 수',
          scrollAuto: '자동 스크롤'
        }
      }
    }
  }
});
