-- ============================================================
-- SEED: Nhiệm kỳ, Ban, Tiêu chí, Settings, Mức đánh giá
-- Dữ liệu giả cho dev/test (không chứa thông tin thật)
-- ============================================================

-- ============================================================
-- 1. NHIỆM KỲ (mặc định)
-- ============================================================
INSERT INTO terms (id, name, start_date, end_date, rules_effective_from, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Nhiệm kỳ 2025–2026',
  '2025-09-01',
  '2026-08-31',
  '2025-10-01',  -- Q08: ngày hiệu lực quy định (cần xác nhận)
  true
);

-- ============================================================
-- 2. BAN (B01–B04) — với gợi ý đầu việc tính điểm (bảng D)
-- ============================================================
INSERT INTO departments (id, code, name, scoring_notes) VALUES
(
  '00000000-0000-0000-0000-000000000011',
  'B01',
  'Ban Truyền thông',
  'Bài viết, thiết kế, video, lịch đăng, báo cáo. Chất lượng: đúng brief, chính xác, dùng được, bàn giao file gốc. C04: tác nghiệp/hỗ trợ ekip/xử lý tình huống ngoài đầu việc đã chấm.'
),
(
  '00000000-0000-0000-0000-000000000012',
  'B02',
  'Ban Tư vấn',
  'Tài liệu/FAQ, ca tư vấn, báo cáo, kế hoạch sự kiện, hậu cần. Chất lượng: thông tin kiểm chứng, triển khai đủ, có bàn giao. C04: hỗ trợ học sinh/phụ huynh/điều phối tình huống sự kiện.'
),
(
  '00000000-0000-0000-0000-000000000013',
  'B03',
  'Ban Nhân sự',
  'Biên bản, mail, danh sách, điểm danh, báo cáo nhân sự, thu-chi. Chất lượng: số liệu đúng, mail đúng người, hồ sơ đủ, quỹ đối chiếu được. C04: hỗ trợ thành viên/gắn kết nội bộ/xử lý nhân sự phát sinh.'
),
(
  '00000000-0000-0000-0000-000000000014',
  'B04',
  'Ban Chủ nhiệm',
  'Kế hoạch, phân công, rà soát tiến độ, báo cáo, bàn giao thuộc trách nhiệm quản lý. Chất lượng: phân công rõ, theo dõi được, đầu ra dùng được, bàn giao đủ. C04: hỗ trợ liên ban, tháo gỡ vướng mắc.'
);

-- ============================================================
-- 3. TIÊU CHÍ CỘNG (C01–C09)
-- ============================================================
INSERT INTO criteria (code, name, description, type, base_points,
  monthly_cap_group, monthly_cap_value, is_auto, requires_approval,
  core_multiplier_applies, replaces, exclusive_group, max_per_event,
  conditions) VALUES

-- C01: Tương tác đúng hạn
('C01', 'Tương tác đúng hạn', 'Thả cảm xúc bài chính thức được giao tương tác, trước hạn.',
 'add', 1, 'interaction', 15, false, false, false,
 '{}', NULL, 1,
 '1 lần/bài; chung trần 15/tháng (P04)'),

-- C02: Tương tác kèm bình luận
('C02', 'Tương tác kèm bình luận', 'Tương tác + bình luận phù hợp, đúng hạn. Thay C01 cùng bài.',
 'add', 2, 'interaction', 15, false, false, false,
 '{C01}', 'interaction_feedback', 1,
 'Thay C01 cùng bài (tổng +2, không +3). Chung trần P04. Không tính bình luận sao chép.'),

-- C03: Xác nhận thông báo đúng hạn
('C03', 'Xác nhận thông báo đúng hạn', 'Thả tim/nhắn xác nhận theo yêu cầu; trả lời đủ câu hỏi nếu có.',
 'add', 1, 'interaction', 15, false, false, false,
 '{}', 'interaction_feedback', 1,
 '1 lần/thông báo; chung trần P04. Không đồng thời C02 và C03 cho cùng phản hồi.'),

-- C04: Tham gia nhiệt tình, đóng góp thực tế
('C04', 'Đóng góp thực tế', 'Đóng góp được sử dụng/hỗ trợ cụ thể, khác phần việc đã chấm C05/C06.',
 'add', 3, NULL, NULL, false, false, false,
 '{}', 'contribution', 1,
 '1 lần/người/hoạt động. Không cộng cùng C08/C09 cho cùng đóng góp.'),

-- C05: Hoàn thành đúng deadline
('C05', 'Hoàn thành đúng deadline', 'Hoàn tất đầy đủ đúng hạn đã thống nhất.',
 'add', 2, NULL, NULL, false, false, false,
 '{}', 'task_completion', 1,
 '1 lần/đầu việc hoặc đợt. Hạn mới được duyệt TRƯỚC hạn cũ vẫn tính C05.'),

-- C06: Sản phẩm/đầu ra chất lượng
('C06', 'Sản phẩm chất lượng', 'Đạt đủ 4 điều kiện P08. Trưởng ban nghiệm thu; BCN chấm Core Team.',
 'add', 3, NULL, NULL, false, true, false,
 '{}', NULL, 1,
 'P08: (1) đúng yêu cầu & phạm vi, (2) thông tin chính xác, (3) hoàn chỉnh, bàn giao đủ, (4) không phải làm lại. C05+C06 tối đa +5/đầu việc (P07).'),

-- C07: Dự họp đầy đủ, đúng giờ
('C07', 'Dự họp đầy đủ', 'Có mặt đúng giờ và ≥ 80% thời lượng.',
 'add', 1, NULL, NULL, true, false, false,
 '{}', NULL, 1,
 '1 lần/buổi. Tự động từ check-in khi đủ điều kiện.'),

-- C08: Nhận & xử lý việc phát sinh
('C08', 'Việc phát sinh', 'Việc ngoài phân công ban đầu, được xác nhận và hoàn tất.',
 'add', 2, NULL, NULL, false, false, false,
 '{}', 'contribution', 1,
 'Không cộng cùng C04/C09 cho cùng đóng góp.'),

-- C09: Đề xuất cải tiến được áp dụng
('C09', 'Đề xuất cải tiến', 'Đã triển khai (không tính ý tưởng mới nêu).',
 'add', 2, NULL, NULL, false, false, false,
 '{}', 'contribution', 1,
 'Không cộng cùng C04/C08 cho cùng đóng góp.');

-- ============================================================
-- 4. TIÊU CHÍ TRỪ (T01–T13)
-- core_multiplier_applies: mặc định BẬT cho hầu hết,
-- TẮT cho T03 và T12 (đã có mức cố định)
-- ============================================================
INSERT INTO criteria (code, name, description, type, base_points,
  monthly_cap_group, monthly_cap_value, is_auto, requires_approval,
  core_multiplier_applies, replaces, exclusive_group, max_per_event,
  conditions) VALUES

-- T01: Vắng họp có lý do
('T01', 'Vắng họp có lý do', 'Buổi chính thức/bắt buộc, lý do được chấp nhận theo P09.',
 'deduct', -2, NULL, NULL, true, false, true,
 '{T04}', 'meeting_penalty', 1,
 'Không tính vào 3 lần T02. Xin phép ≥2h trước hoặc giải trình trong 24h.'),

-- T02: Vắng họp không lý do
('T02', 'Vắng họp không lý do', 'Không xin phép hoặc lý do không được chấp nhận.',
 'deduct', -5, NULL, NULL, true, false, true,
 '{T04,T01}', 'meeting_penalty', 1,
 'Đếm riêng; đủ 3 lần → dừng tư cách (Q05). Bộ đếm KHÔNG reset khi sang tháng.'),

-- T03: Mail cảnh cáo
('T03', 'Mail cảnh cáo', 'Mail chính thức do BCN duyệt.',
 'deduct', -10, NULL, NULL, false, true, false,  -- core_multiplier OFF
 '{}', NULL, 1,
 '1 lần/đợt. Q04: nếu xử lý vụ việc đã trừ → chỉ trừ phần chênh để đủ -10.'),

-- T04: Họp muộn / tự ý rời họp
('T04', 'Họp muộn / rời sớm', 'Muộn > 15 phút hoặc rời trước khi kết thúc.',
 'deduct', -1, NULL, NULL, true, false, true,
 '{}', 'meeting_penalty', 1,
 'Tham dự < 80% thì dùng T01/T02 thay T04 (P10).'),

-- T05: Không xác nhận thông báo bắt buộc
('T05', 'Không xác nhận thông báo', 'Quá hạn chưa xác nhận/trả lời yêu cầu cần phản hồi.',
 'deduct', -1, NULL, NULL, false, false, true,
 '{}', NULL, 1,
 'Không trừ tin trao đổi thường.'),

-- T06: Mất liên lạc khi đang nhận việc
('T06', 'Mất liên lạc', 'Sau 48h và ≥ 2 lần liên hệ vẫn không phản hồi.',
 'deduct', -3, NULL, NULL, false, false, true,
 '{T05}', NULL, 1,
 'Thay T05 cùng yêu cầu. Tính theo vụ việc, không theo số tin.'),

-- T07: Trễ deadline đến 24 giờ
('T07', 'Trễ deadline ≤ 24h', 'Trễ ≤ 24h, chưa được duyệt gia hạn.',
 'deduct', -2, NULL, NULL, false, false, true,
 '{}', 'task_completion', 1,
 'Không nhận C05 cho đầu việc này.'),

-- T08: Trễ deadline trên 24 giờ
('T08', 'Trễ deadline > 24h', 'Trễ > 24h, chưa được duyệt gia hạn.',
 'deduct', -4, NULL, NULL, false, false, true,
 '{T07}', 'task_completion', 1,
 'Thay T07, không cộng dồn.'),

-- T09: Bỏ việc / để người khác làm thay
('T09', 'Bỏ việc', 'Tự ý bỏ nhiệm vụ/không hoàn thành khiến người khác làm thay.',
 'deduct', -5, NULL, NULL, false, true, true,
 '{T07,T08}', 'task_completion', 1,
 'Thay mức trễ hạn cùng vụ việc.'),

-- T10: Lỗi chủ quan khiến phải làm lại
('T10', 'Lỗi chủ quan', 'Sai thông tin/nghiệp vụ, bỏ yêu cầu đã nêu.',
 'deduct', -2, NULL, NULL, false, false, true,
 '{}', NULL, 1,
 'Không tính chỉnh sửa biên tập thông thường.'),

-- T11: Tự ý đăng/gửi nội dung chưa duyệt
('T11', 'Nội dung chưa duyệt', 'Đăng/gửi nội dung chính thức dưới danh nghĩa CLB khi chưa qua thẩm quyền.',
 'deduct', -5, NULL, NULL, false, true, true,
 '{}', NULL, 1, NULL),

-- T12: Gian lận minh chứng/điểm danh
('T12', 'Gian lận', 'Khai khống, điểm danh hộ, làm giả minh chứng.',
 'deduct', -10, NULL, NULL, false, true, false,  -- core_multiplier OFF
 '{}', NULL, 1,
 'BCN xem xét thêm tư cách thành viên.'),

-- T13: Vi phạm quy trình quản lý quỹ
('T13', 'Vi phạm quản lý quỹ', 'Chi quỹ chưa phê duyệt hoặc không kê khai/bàn giao thu-chi.',
 'deduct', -5, NULL, NULL, false, true, true,
 '{}', NULL, 1,
 'Bổ sung hồ sơ và báo BCN.');

-- ============================================================
-- 5. QUY TẮC CHUNG (P01–P10) — lưu dạng tiêu chí type='rule'
-- ============================================================
INSERT INTO criteria (code, name, description, type, base_points,
  is_auto, requires_approval, core_multiplier_applies, conditions) VALUES
('P01', 'Điểm khởi đầu', 'Điểm khởi đầu 60/thành viên, tính khi quy định có hiệu lực hoặc khi được tiếp nhận.',
 'rule', 60, true, false, false, NULL),
('P02', 'Thang điểm 0-100', 'score = MAX(0, MIN(100, score + delta)). Phần cộng vượt 100 KHÔNG giữ.',
 'rule', 0, true, false, false, NULL),
('P03', 'Tích lũy trong nhiệm kỳ', 'Chốt báo cáo hàng tháng; điểm tích lũy, không reset đầu tháng.',
 'rule', 0, true, false, false, NULL),
('P04', 'Trần tương tác 15/tháng', 'Tổng C01+C02+C03 tối đa 15/tháng. Vượt mức vẫn ghi ledger nhưng applied_delta=0.',
 'rule', 0, true, false, false, NULL),
('P05', 'Hạn mặc định 12h', 'Hạn tương tác/xác nhận mặc định 12 giờ từ lúc thông báo.',
 'rule', 0, true, false, false, NULL),
('P06', 'C02 đã gồm C01', 'Tương tác kèm bình luận tổng +2, không +3. C02/C03 không đồng thời.',
 'rule', 0, true, false, false, NULL),
('P07', 'C05+C06 tối đa +5', 'Chốt đầu việc trước khi giao. C05+C06 cùng đầu việc tối đa +5.',
 'rule', 0, true, false, false, NULL),
('P08', 'Chất lượng 4 điều kiện', '4 checkbox: đúng yêu cầu, thông tin chính xác, hoàn chỉnh, không làm lại.',
 'rule', 0, true, false, false, NULL),
('P09', 'Xin phép vắng', 'Báo ≥ 2h trước buổi họp; đột xuất giải trình trong 24h sau.',
 'rule', 0, true, false, false, NULL),
('P10', 'Tham gia ≥ 80%', 'Tham gia ≥ 80% thời lượng = có mặt. Cùng buổi chỉ mức phạt cao nhất.',
 'rule', 0, true, false, false, NULL);

-- ============================================================
-- 6. SETTINGS — Bảng cấu hình
-- ============================================================
INSERT INTO settings (key, value, description) VALUES
('initial_score', '60', 'Điểm khởi đầu khi gia nhập CLB (P01)'),
('score_min', '0', 'Sàn điểm (P02)'),
('score_max', '100', 'Trần điểm (P02)'),
('monthly_interaction_cap', '15', 'Trần tương tác C01+C02+C03 mỗi tháng (P04)'),
('default_interaction_deadline_hours', '12', 'Hạn tương tác/xác nhận mặc định (P05)'),
('attendance_threshold_pct', '80', 'Ngưỡng % tham dự tính có mặt (P10)'),
('late_threshold_minutes', '15', 'Muộn > phút này → T04'),
('lost_contact_hours', '48', 'Mất liên lạc sau giờ này → T06'),
('excuse_before_hours', '2', 'Xin phép vắng trước giờ này (P09)'),
('excuse_after_hours', '24', 'Giải trình đột xuất trong giờ này sau buổi họp (P09)'),
('dispute_deadline_business_days', '3', 'Hạn đề nghị sửa điểm Q06'),
('improvement_deadline_days', '7', 'Hạn cải thiện sau nhắc nhở mức "Cần cải thiện"'),
('t02_termination_count', '3', 'Số lần T02 dẫn đến xem xét dừng tư cách (Q05)'),
('core_team_multiplier', '2', 'Hệ số nhân cho điểm trừ Core Team'),
('core_team_multiplier_enabled', 'true', 'Bật/tắt hệ số Core Team'),
('weekend_days', '6,0', 'Ngày nghỉ (0=CN, 6=T7) để tính ngày làm việc'),
('task_max_bonus_per_task', '5', 'Tối đa C05+C06 cùng đầu việc (P07)'),
('checkin_token_expiry_minutes', '180', 'Thời hạn token check-in (phút)'),
('short_code_expiry_minutes', '5', 'Thời hạn mã ngắn check-in xoay vòng (phút)'),
('checkin_max_per_device', '3', 'Số check-in tối đa trên 1 thiết bị / 1 sự kiện');

-- ============================================================
-- 7. MỨC ĐÁNH GIÁ (bảng E, mục 5.6)
-- ============================================================
INSERT INTO rating_levels (min_score, max_score, level_name, action_required, confirmer, display_order) VALUES
(90, 100, 'Rất tích cực', 'Ghi nhận tổng kết tháng', 'Trưởng ban / BCN', 1),
(75, 89, 'Tích cực', 'Duy trì, cân đối công việc', 'Trưởng ban / BCN', 2),
(60, 74, 'Đạt cơ bản', 'Theo dõi nhiệm vụ & đóng góp', 'Trưởng ban / BCN', 3),
(45, 59, 'Cần cải thiện', 'Nhắc nhở; thống nhất việc cải thiện trong 7 ngày', 'Trưởng ban + Nhân sự', 4),
(30, 44, 'Diện cảnh cáo', 'BCN yêu cầu giải trình; chỉ trừ T03 khi mail được phát hành', 'BCN', 5),
(0, 29, 'Xem xét dừng tư cách', 'BCN xem xét sau giải trình, đối chiếu. Chưa tự động thay quy trình 3 lần vắng', 'BCN', 6);

-- ============================================================


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
(
  '10000000-0000-0000-0000-000000000001',
  'STAFF-001',
  NULL,
  'Nguyễn Thị Hồng Hân',
  'Cán bộ phòng TT&TS',
  '0837262678',
  'hannth@vnuis.edu.vn',
  '00000000-0000-0000-0000-000000000014',
  'Chủ nhiệm',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000002',
  '23070691',
  '23070691',
  'Giang Lê Hiệp',
  'MIS2023A',
  '0374140705',
  'glhiep@vnuis.edu.vn',
  '00000000-0000-0000-0000-000000000014',
  'Phó chủ nhiệm',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000003',
  '22073125',
  '22073125',
  'Nguyễn Trịnh Minh Trang',
  'ACF2023A',
  '0868351218',
  'ngtminhtrang3204@gmail.com',
  '00000000-0000-0000-0000-000000000014',
  'Phó chủ nhiệm',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000004',
  '24310088',
  '24310088',
  'Trần Đức Thắng',
  'DC2024B',
  '0357626105',
  'tdthang@vnuis.edu.vn',
  '00000000-0000-0000-0000-000000000011',
  'Trưởng ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000005',
  '25070407',
  '25070407',
  'Vũ Đình Hải',
  'MIS2025A',
  '0354434102',
  'vudinhhai542007@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000006',
  '25070345',
  '25070345',
  'Lâm Thị Bình Dương',
  'MIS2025A',
  '0382462795',
  'lamduong200907@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000007',
  '24070680',
  '24070680',
  'Phương Gia Huy',
  'MIS2024C',
  '0367361118',
  '9iahuyy@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Cố vấn',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000008',
  '24070753',
  '24070753',
  'Hoàng Thị Khánh Linh',
  'BDA2024C',
  '0325546515',
  'hoanglinh15072006@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000009',
  '25071203',
  '25071203',
  'Lục Xuân Huy',
  'MIS2025B',
  '0985030207',
  'huylucxuan2007@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000010',
  '25070203',
  '25070203',
  'Hoàng Thị Tú An',
  'MIS2025B',
  '0367030748',
  'anhoang26.htta12@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000011',
  '25070278',
  '25070278',
  'Đinh Tấn Tài',
  'MIS2025A',
  '0393518168',
  'dinhtai691@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000012',
  '24310108',
  '24310108',
  'Hoàng Triều Xuân',
  'DC2024B',
  '0865512672',
  'xuanht2603nb@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000013',
  '24310078',
  '24310078',
  'Nguyễn Tố Như',
  'DC2024B',
  '0813773199',
  'ntonhu808@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000014',
  '26070162',
  '26070162',
  'Ngô Ánh Dương',
  'ICE2026',
  '0867385112',
  'ngoanhduong200@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000015',
  '26070774',
  '26070774',
  'Tô Mai Trang',
  'BEL2026',
  '0343299388',
  'thimaitrangto@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000016',
  '24070608',
  '24070608',
  'Nguyễn Phú Cường',
  'MIS2024',
  '0899138456',
  'phunguyen1234567g@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000017',
  '26070437',
  '26070437',
  'Lê Mai Anh',
  'DB2026',
  '0346265628',
  'manhiuoi56@gmail.com',
  '00000000-0000-0000-0000-000000000011',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000018',
  '24310069',
  '24310069',
  'Lê Trần Thuỷ Nguyên',
  'DC2024B',
  '0912158734',
  'tnguyenletran@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Trưởng ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000019',
  '24070752',
  '24070752',
  'Phùng Thị Thu Hiền',
  'AC2024C',
  '0988487541',
  '24070752@vnu.edu.vn',
  '00000000-0000-0000-0000-000000000012',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000020',
  '24070622',
  '24070622',
  'Nguyễn Ngọc Anh',
  'MIS2024B',
  '0385367500',
  'hnacognnee@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000021',
  '23071234',
  '23071234',
  'Nguyễn Thu Thảo',
  'AC2023D',
  '0886493955',
  'nthuthao2011@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Cố vấn',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000022',
  '24310099',
  '24310099',
  'Lê Duy Tuấn',
  'DC2024A',
  '0763021511',
  'rudeyuitan2006@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000023',
  '24310072',
  '24310072',
  'Nguyễn Thị Nguyệt',
  'DC2024A',
  '0378647348',
  'nguytn7@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000024',
  '25071139',
  '25071139',
  'Hoàng Mẫn Quỳnh Chi',
  'BDA2 K24',
  '0975167734',
  'hoangmanquynhchi@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000025',
  '25071210',
  '25071210',
  'Nguyễn Vũ Hồng Hạnh',
  'AIT1 K24',
  '0396680326',
  'hanhnguyenvu2007@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000026',
  '23070355',
  '23070355',
  'Vũ Bá Quốc Hưng',
  'AIT2023A',
  '0373701205',
  'vubaquochung@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000027',
  '24070659',
  '24070659',
  'Nguyễn Thị Thuỳ Dương',
  'MIS2024D',
  '0988917270',
  'duongneeeeee@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000028',
  '24070676',
  '24070676',
  'Phan Thành Đạt',
  'MIS2024B',
  '0562440999',
  'datbich22@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000029',
  '25070097',
  '25070097',
  'Phạm Thị Hải Chi',
  'Dual_MKT2025A',
  '0822657958',
  'haichidepham2305@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000030',
  '25073060',
  '25073060',
  'Vũ Hồng Hải Yến',
  'VISK2025A',
  '0366237866',
  'vhhyen24@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000031',
  '25070642',
  '25070642',
  'Đỗ Trần Ái Linh',
  'DC2025A',
  '0396190937',
  'lyhdo.93@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000032',
  '26070454',
  '26070454',
  'Phạm Thanh Hải',
  'DC2026',
  '0862583973',
  'thanhhaipham281107@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000033',
  '25070140',
  '25070140',
  'Hoàng Chí Công',
  'ISEL2025',
  '0972257259',
  'conghoangvy2007@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000034',
  '25070170',
  '25070170',
  'Bùi Việt Hưng',
  'ISEL2026',
  '0886230707',
  'hungbuiviet512@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000035',
  '24310073',
  '24310073',
  'Hoàng Thị Lan Nhi',
  'DC2024B',
  '0967960624',
  'lannhitdt@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000036',
  '25070040',
  '25070040',
  'Nguyễn Gia Khánh',
  'MIS2025A',
  '0985038376',
  'nguyengiakhanh09092007@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000037',
  '26070004',
  '26070004',
  'Bùi Bảo Anh',
  'DC2026',
  '0858130626',
  '26070004@vnu.edu.vn',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000038',
  '26073033',
  '26073033',
  'Nguyễn Ngọc Duy',
  'VISK2026',
  '0985419948',
  '26073033@vnu.edu.vn',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000039',
  '26070583',
  '26070583',
  'Đặng Thị Lê Na',
  'IB2026',
  '0858130626',
  'lenadangthi2@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000040',
  '26070329',
  '26070329',
  'Hoàng Quốc Việt',
  'DB2026',
  '0344978620',
  'hoangquocvietnb2008@gmail.com',
  '00000000-0000-0000-0000-000000000012',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000041',
  '23070448',
  '23070448',
  'Ngô Phương Hoa',
  'AIT2023A',
  '0983605270',
  '23070448@vnu.edu.vn',
  '00000000-0000-0000-0000-000000000013',
  'Trưởng ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000042',
  '24310150',
  '24310150',
  'Trần Thanh Hiền',
  'DB2024B',
  '0337905649',
  'hien.danity.k@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Phó ban',
  true,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000043',
  '23073151',
  '23073151',
  'Phạm Thanh Vân',
  'VISK2025B',
  '0365917966',
  'thanhvanpham051799@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000044',
  '25073044',
  '25073044',
  'Đỗ Ngọc Ly',
  'VISK2025',
  '0362227656',
  'dongocly150106@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000045',
  '26070180',
  '26070180',
  'Ngô Bảo Anh',
  'FDB2026',
  '0332653385',
  'daothingan19899@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000046',
  '25073039',
  '25073039',
  'Trần Phương Linh',
  'VISK2025',
  '0975255107',
  'tranplinh2517@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000047',
  '26070316',
  '26070316',
  'Nguyễn Mai Thanh Hương',
  'DB2026',
  '0332856508',
  'huongth484@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
),
(
  '10000000-0000-0000-0000-000000000048',
  '26070324',
  '26070324',
  'Hoàng Công Minh',
  'DB2027',
  '0989402311',
  'hoangcongminh.cm@gmail.com',
  '00000000-0000-0000-0000-000000000013',
  'Thành viên',
  false,
  'active',
  60,
  0,
  '00000000-0000-0000-0000-000000000001'
);

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
