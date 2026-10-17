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
-- 8. THÀNH VIÊN GIẢ (cho dev/test — KHÔNG dùng dữ liệu thật)
-- ============================================================
INSERT INTO members (id, member_code, student_id, full_name, class_name,
  department_id, position, is_core_team, term_id) VALUES
-- BCN
('10000000-0000-0000-0000-000000000001', 'STAFF-001', NULL,
 'Nguyễn Văn Admin', 'Cán bộ phòng',
 '00000000-0000-0000-0000-000000000014', 'Chủ nhiệm', true,
 '00000000-0000-0000-0000-000000000001'),

('10000000-0000-0000-0000-000000000002', '99990002', '99990002',
 'Trần Thị Phó CN', 'TEST2023A',
 '00000000-0000-0000-0000-000000000014', 'Phó chủ nhiệm', true,
 '00000000-0000-0000-0000-000000000001'),

-- Truyền thông
('10000000-0000-0000-0000-000000000003', '99990003', '99990003',
 'Lê Văn Trưởng TT', 'TEST2024A',
 '00000000-0000-0000-0000-000000000011', 'Trưởng ban', true,
 '00000000-0000-0000-0000-000000000001'),

('10000000-0000-0000-0000-000000000004', '99990004', '99990004',
 'Phạm Thị TV TT', 'TEST2025A',
 '00000000-0000-0000-0000-000000000011', 'Thành viên', false,
 '00000000-0000-0000-0000-000000000001'),

-- Tư vấn
('10000000-0000-0000-0000-000000000005', '99990005', '99990005',
 'Hoàng Văn Trưởng TV', 'TEST2024B',
 '00000000-0000-0000-0000-000000000012', 'Trưởng ban', true,
 '00000000-0000-0000-0000-000000000001'),

('10000000-0000-0000-0000-000000000006', '99990006', '99990006',
 'Đỗ Thị TV TV', 'TEST2025B',
 '00000000-0000-0000-0000-000000000012', 'Thành viên', false,
 '00000000-0000-0000-0000-000000000001'),

-- Nhân sự
('10000000-0000-0000-0000-000000000007', '99990007', '99990007',
 'Vũ Văn Trưởng NS', 'TEST2023B',
 '00000000-0000-0000-0000-000000000013', 'Trưởng ban', true,
 '00000000-0000-0000-0000-000000000001'),

('10000000-0000-0000-0000-000000000008', '99990008', '99990008',
 'Mai Thị TV NS', 'TEST2025C',
 '00000000-0000-0000-0000-000000000013', 'Thành viên', false,
 '00000000-0000-0000-0000-000000000001');
