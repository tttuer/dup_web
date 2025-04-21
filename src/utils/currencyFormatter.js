import { ref } from 'vue';

export function useCurrencyFormatter(initialValue = '') {
  const formatted = ref('');
  const price = ref(null); // null 또는 number

  function formatNumberWithComma(value) {
    // 앞쪽 0 제거: -01234 -> -1234
    const cleaned = value.replace(/^(-?)0+(\d)/, '$1$2');
    return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function formatCurrency(e) {
    let raw = e.target.value;
  
    // , 제거
    raw = raw.replace(/,/g, '');
  
    // 모두 삭제했을 경우
    if (raw === '') {
      formatted.value = '';
      price.value = null;
      return;
    }
  
    // 유효한 -?숫자만 허용 (첫 번째 자리만 - 허용)
    const valid = /^-?\d*$/.test(raw);
    if (!valid) return;
  
    // -가 두 번 이상 나오지 않도록 처리
    if (raw.indexOf('-') !== raw.lastIndexOf('-')) {
      raw = raw.substring(0, raw.lastIndexOf('-') + 1); // 첫 번째 -만 남기고 나머지 - 제거
    }
  
    // 숫자 변환
    const numeric = Number(raw);
    price.value = numeric;
    formatted.value = formatNumberWithComma(raw);
  }
  

  function setPrice(value) {
    if (value === null || value === '') {
      formatted.value = '';
      price.value = null;
    } else {
      price.value = value;
      formatted.value = formatNumberWithComma(String(value));
    }
  }

  return {
    formatted,
    price,
    formatCurrency,
    formatNumberWithComma,
    setPrice,
  };
}
