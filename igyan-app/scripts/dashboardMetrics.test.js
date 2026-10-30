const assert = require('node:assert/strict');
const test = require('node:test');
const { attendanceSummary, monthCells } = require('../services/dashboardMetrics');

test('monthCells preserves every day in the requested month', () => {
  const cells = monthCells(new Date(2026, 1, 1));
  assert.equal(cells.filter(Boolean).length, 28);
  assert.equal(cells[cells.length - 1], 28);
});

test('attendanceSummary calculates average, chart data, and students at risk', () => {
  const result = attendanceSummary([
    { student_id: 'a', status: 'present', attendance_date: '2026-01-02' },
    { student_id: 'a', status: 'absent', attendance_date: '2026-01-03' },
    { student_id: 'a', status: 'absent', attendance_date: '2026-01-04' },
    { student_id: 'a', status: 'absent', attendance_date: '2026-01-05' },
    { student_id: 'b', status: 'half_day', attendance_date: '2026-01-06' },
  ], ['present', 'half_day']);

  assert.equal(result.average, 40);
  assert.equal(result.monthly[0], 40);
  assert.equal(result.atRisk, 1);
});

test('attendanceSummary uses zero for an empty analytics table', () => {
  const result = attendanceSummary([], ['present']);
  assert.equal(result.average, 0);
  assert.equal(result.atRisk, 0);
  assert.deepEqual(result.monthly, Array(12).fill(null));
});
