const fs = require('fs');
const path = require('path');

const baseSeed = fs.readFileSync('supabase/seed/001_seed_data.sql', 'utf8');

// Cut off the mock members section (from line 260 onwards)
const cutoffIndex = baseSeed.indexOf('-- 8. THÀNH VIÊN GIẢ');
const headerSeed = cutoffIndex !== -1 ? baseSeed.substring(0, cutoffIndex) : baseSeed;

// Read roster.csv
const rosterContent = fs.readFileSync('data/roster.csv', 'utf8');
const lines = rosterContent.trim().split('\n').slice(1); // skip header

const deptMap = {
  'BCN': '00000000-0000-0000-0000-000000000014',
  'Truyền thông': '00000000-0000-0000-0000-000000000011',
  'Tư vấn': '00000000-0000-0000-0000-000000000012',
  'Nhân sự': '00000000-0000-0000-0000-000000000013',
};

const termId = '00000000-0000-0000-0000-000000000001';

const memberSqlRows = [];

lines.forEach((line, index) => {
  const parts = line.split(',');
  if (parts.length < 8) return;
  const [sourceStt, dept, fullName, className, studentId, position, phone, email] = parts;
  
  const deptId = deptMap[dept.trim()];
  if (!deptId) return;

  const isCore = ['Chủ nhiệm', 'Phó chủ nhiệm', 'Trưởng ban', 'Phó ban'].includes(position.trim());
  const memberCode = studentId && studentId.trim() ? studentId.trim() : `STAFF-00${sourceStt.trim()}`;
  const studentIdVal = studentId && studentId.trim() ? `'${studentId.trim()}'` : 'NULL';
  
  // Format UUID: 10000000-0000-0000-0000-0000000000XX
  const idSuffix = String(sourceStt.trim()).padStart(12, '0');
  const memberId = `10000000-0000-0000-0000-${idSuffix}`;

  const escapeSql = (str) => str.replace(/'/g, "''");

  memberSqlRows.push(`(
  '${memberId}',
  '${escapeSql(memberCode)}',
  ${studentIdVal},
  '${escapeSql(fullName.trim())}',
  '${escapeSql(className.trim())}',
  '${escapeSql(phone.trim())}',
  '${escapeSql(email.trim())}',
  '${deptId}',
  '${escapeSql(position.trim())}',
  ${isCore},
  'active',
  60,
  0,
  '${termId}'
)`);
});

const membersSql = `
-- ============================================================
-- 8. DANH SÁCH 48 THÀNH VIÊN CHÍNH THỨC CLB ISSAC (NHIỆM KỲ 2025-2026)
-- Đầy đủ 4 ban, 11 Core Team, Điểm khởi đầu 60đ (P01)
-- ============================================================
INSERT INTO members (
  id,
  member_code,
  student_id,
  full_name,
  class_name,
  phone,
  email,
  department_id,
  position,
  is_core_team,
  status,
  current_score,
  t02_count,
  term_id
) VALUES
${memberSqlRows.join(',\n')};

-- ============================================================
-- 9. SỰ KIỆN & ĐIỂM DANH MẪU
-- ============================================================
INSERT INTO events (
  id,
  name,
  department_id,
  event_type,
  format,
  is_mandatory,
  starts_at,
  ends_at,
  status,
  checkin_token,
  short_code
) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  'Họp Ban Thường kỳ Tháng 10/2025 - Định hướng Học kỳ I',
  NULL,
  'meeting',
  'offline',
  true,
  '2025-10-15 19:30:00+07',
  '2025-10-15 21:30:00+07',
  'open',
  'token-issac-oct2025',
  '8888'
),
(
  '20000000-0000-0000-0000-000000000002',
  'Workshop Kỹ năng Tư vấn Tuyển sinh 2025',
  '00000000-0000-0000-0000-000000000012',
  'activity',
  'offline',
  false,
  '2025-10-20 14:00:00+07',
  '2025-10-20 17:00:00+07',
  'draft',
  'token-workshop-tuvan',
  '9999'
);

-- Điểm danh mẫu cho cuộc họp tháng 10
INSERT INTO attendance (
  event_id,
  member_id,
  joined_at,
  attendance_pct,
  status
) VALUES
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '2025-10-15 19:25:00+07',
  100,
  'present'
),
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '2025-10-15 19:28:00+07',
  100,
  'present'
),
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000004',
  '2025-10-15 19:20:00+07',
  100,
  'present'
);
`;

const finalSeedSql = headerSeed.trim() + '\n\n' + membersSql;
fs.writeFileSync('supabase/seed.sql', finalSeedSql, 'utf8');
console.log(`✅ Successfully generated supabase/seed.sql with ${memberSqlRows.length} members!`);
