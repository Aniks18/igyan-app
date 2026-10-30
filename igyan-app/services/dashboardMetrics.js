const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthCells(month) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: firstDay + days }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  return cells.filter(Boolean).length === days ? cells : [];
}

function attendanceSummary(records, presentStatuses) {
  const monthly = Array(12).fill(null);
  const totals = Array.from({ length: 12 }, () => ({ present: 0, total: 0 }));
  const students = {};

  (records || []).forEach((record) => {
    const date = record.attendance_date ? new Date(record.attendance_date) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const month = date.getMonth();
    const isPresent = presentStatuses.includes(record.status);
    totals[month].total += 1;
    if (isPresent) totals[month].present += 1;
    if (record.student_id) {
      students[record.student_id] ||= { total: 0, absent: 0 };
      students[record.student_id].total += 1;
      if (record.status === 'absent') students[record.student_id].absent += 1;
    }
  });

  totals.forEach((month, index) => {
    if (month.total) monthly[index] = Math.round((month.present / month.total) * 100);
  });

  const total = totals.reduce((sum, month) => sum + month.total, 0);
  const present = totals.reduce((sum, month) => sum + month.present, 0);
  const average = total ? Math.round((present / total) * 100) : 0;

  return {
    monthly,
    average,
    atRisk: Object.values(students).filter((student) => student.absent >= 3 || student.absent / student.total > 0.25).length,
  };
}

module.exports = { MONTHS, monthCells, attendanceSummary };
