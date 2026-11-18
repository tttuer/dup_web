import { APPROVAL_STATUS, DOCUMENT_STATUS } from '../stores/useTypeStore.js';

export function canApproveRequest(request, lines, user) {
  if (!user || !request || ![DOCUMENT_STATUS.SUBMITTED, DOCUMENT_STATUS.IN_PROGRESS].includes(request.status)) {
    return false;
  }

  const userIds = [user.id, user.user_id].filter(id => id != null).map(String);
  const myLine = lines.find(line =>
    line.status === APPROVAL_STATUS.PENDING &&
    line.approver_id != null && userIds.includes(String(line.approver_id))
  );
  if (!myLine || !Number.isFinite(Number(myLine.step_order))) return false;

  // 대기 목록과 동일하게, 앞선 단계의 결재가 모두 끝나야 처리할 수 있습니다.
  return !lines.some(line =>
    line.status === APPROVAL_STATUS.REJECTED ||
    (line.status === APPROVAL_STATUS.PENDING && Number(line.step_order) < Number(myLine.step_order))
  );
}
