import assert from 'node:assert/strict';
import test from 'node:test';
import { canApproveRequest } from '../src/utils/approvalPermissions.js';

const user = { id: 7, user_id: 'jay0425' };
const line = { approver_id: 'jay0425', step_order: 1, status: 'PENDING' };

test('상신완료 문서는 저장된 현재 단계가 0이어도 첫 결재자가 처리할 수 있다', () => {
  assert.equal(canApproveRequest({ status: 'SUBMITTED', current_step: 0 }, [line], user), true);
});

test('진행 중 문서의 차례는 앞선 결재선의 처리 여부로 판단한다', () => {
  const request = { status: 'IN_PROGRESS', current_step: 0 };
  const next = { ...line, step_order: '2' };
  const previous = { approver_id: 'other', step_order: '1', status: 'PENDING' };
  assert.equal(canApproveRequest(request, [previous, next], user), false);
  assert.equal(canApproveRequest(request, [{ ...previous, status: 'APPROVED' }, next], user), true);
});

test('숫자 식별자와 같은 단계의 병렬 결재를 지원한다', () => {
  const lines = [{ ...line, approver_id: '7' }, { ...line, approver_id: 'other' }];
  assert.equal(canApproveRequest({ status: 'SUBMITTED' }, lines, user), true);
});

test('다른 사용자, 처리 완료, 반려된 문서와 비활성 상태에는 허용하지 않는다', () => {
  const request = { status: 'SUBMITTED' };
  assert.equal(canApproveRequest(request, [line], { id: 'other' }), false);
  assert.equal(canApproveRequest(request, [line], null), false);
  assert.equal(canApproveRequest(request, [], user), false);
  assert.equal(canApproveRequest(request, [{ ...line, status: 'APPROVED' }], user), false);
  assert.equal(canApproveRequest(request, [line, { ...line, status: 'REJECTED' }], user), false);
  for (const status of ['DRAFT', 'APPROVED', 'REJECTED', 'CANCELLED']) {
    assert.equal(canApproveRequest({ status }, [line], user), false);
  }
});
