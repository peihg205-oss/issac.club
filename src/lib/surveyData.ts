// ============================================================
// iSSAC_Web - Survey Data & Cross-Evaluation Storage for BCN
// ============================================================

export interface SurveyFeedbackItem {
  id: string
  event: string
  targetMemberCode: string
  targetMemberName: string
  targetDepartment: string
  targetPosition: string
  targetAvatarUrl?: string
  evaluatorMemberCode?: string
  evaluatorName: string
  evaluatorDept: string
  evaluatorRole: string
  evaluatorAvatarUrl?: string
  rating: number // 1 to 5
  feedback: string // Nhận xét sau sự kiện
  improvement: string // Mong muốn cải thiện
  criteriaScores: {
    responsibility: number // Tinh thần trách nhiệm (1-5)
    taskDelivery: number // Hoàn thành nhiệm vụ (1-5)
    collaboration: number // Phối hợp & Giao tiếp (1-5)
    initiative: number // Tác phong & Chủ động (1-5)
  }
  customAnswers?: Record<string, string | number>
  submittedAt: string
}

export const SURVEY_STORAGE_KEY = 'issac_all_survey_feedbacks_v2'

export const INITIAL_SURVEY_FEEDBACKS: SurveyFeedbackItem[] = [
  // 1. TRẦN ĐỨC THẮNG (Trưởng ban Truyền thông)
  {
    id: 'fb-thang-01',
    event: '1st Meeting',
    targetMemberCode: '24310088',
    targetMemberName: 'Trần Đức Thắng',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/duc-thang-avatar.png',
    evaluatorMemberCode: '24310069',
    evaluatorName: 'Lê Trần Thuỷ Nguyên',
    evaluatorDept: 'Ban Tư vấn',
    evaluatorRole: 'Trưởng ban Tư vấn',
    evaluatorAvatarUrl: '/thuy-nguyen-avatar.png',
    rating: 5,
    feedback: 'Phối hợp truyền thông sự kiện rất nhịp nhàng, thiết kế banner và ấn phẩm check-in đẹp mắt, đúng hạn. Trên sân khấu hỗ trợ kỹ thuật và âm thanh rất linh hoạt.',
    improvement: 'Nên gửi link tổng hợp ảnh sau sự kiện sớm hơn để ban Tư vấn gửi lời cảm ơn tân sinh viên.',
    criteriaScores: { responsibility: 5, taskDelivery: 5, collaboration: 5, initiative: 5 },
    submittedAt: '2026-11-04T10:15:00.000Z',
  },
  {
    id: 'fb-thang-02',
    event: '1st Meeting',
    targetMemberCode: '24310088',
    targetMemberName: 'Trần Đức Thắng',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/duc-thang-avatar.png',
    evaluatorMemberCode: '25070407',
    evaluatorName: 'Vũ Đình Hải',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Phó ban Truyền thông',
    evaluatorAvatarUrl: '/vu-dinh-hai-avatar.png',
    rating: 5,
    feedback: 'Anh Thắng luôn bao quát tốt toàn bộ khối truyền thông, phân công ca chụp ảnh và live story rất hợp lý, tạo không khí vui vẻ cho anh em trong ban.',
    improvement: 'Cần chú ý nghỉ ngơi và ăn uống đúng giờ trong những ngày chạy sự kiện dài.',
    criteriaScores: { responsibility: 5, taskDelivery: 5, collaboration: 4.8, initiative: 5 },
    submittedAt: '2026-11-04T11:20:00.000Z',
  },
  {
    id: 'fb-thang-03',
    event: '1st Meeting',
    targetMemberCode: '24310088',
    targetMemberName: 'Trần Đức Thắng',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/duc-thang-avatar.png',
    evaluatorMemberCode: '24070752',
    evaluatorName: 'Phùng Thị Thu Hiền',
    evaluatorDept: 'Ban Tư vấn',
    evaluatorRole: 'Phó ban Tư vấn',
    evaluatorAvatarUrl: '/phung-thi-thu-hien-avatar.png',
    rating: 4,
    feedback: 'Nhiệt tình, giao tiếp cởi mở và chủ động hỏi han các ban khác xem có cần hỗ trợ gì về máy ảnh hay mic thuyết trình không.',
    improvement: 'Đôi lúc micro bị rè một chút ở phần đầu chương trình, ban Truyền thông nên test kỹ âm thanh trước 30 phút.',
    criteriaScores: { responsibility: 4.5, taskDelivery: 4.2, collaboration: 4.7, initiative: 4.5 },
    submittedAt: '2026-11-04T12:00:00.000Z',
  },
  {
    id: 'fb-thang-04',
    event: '1st Meeting',
    targetMemberCode: '24310088',
    targetMemberName: 'Trần Đức Thắng',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/duc-thang-avatar.png',
    evaluatorMemberCode: '23070691',
    evaluatorName: 'Giang Lê Hiệp',
    evaluatorDept: 'Ban Chủ nhiệm',
    evaluatorRole: 'Phó chủ nhiệm CLB',
    evaluatorAvatarUrl: '/giang-le-hiep-avatar.png',
    rating: 5,
    feedback: 'Tác phong chững chạc, tinh thần trách nhiệm của một trưởng ban rất đáng khen. Phản ứng nhanh khi có sự thay đổi kịch bản phút chót.',
    improvement: 'Đôn đốc các bạn CTV đăng bài recap đúng khung giờ vàng để tăng tương tác fanpage.',
    criteriaScores: { responsibility: 5, taskDelivery: 4.8, collaboration: 4.8, initiative: 5 },
    submittedAt: '2026-11-04T13:45:00.000Z',
  },
  {
    id: 'fb-thang-05',
    event: '1st Meeting',
    targetMemberCode: '24310088',
    targetMemberName: 'Trần Đức Thắng',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/duc-thang-avatar.png',
    evaluatorMemberCode: '25070345',
    evaluatorName: 'Lâm Thị Bình Dương',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Phó ban Truyền thông',
    evaluatorAvatarUrl: '/lam-thi-binh-duong-avatar.png',
    rating: 5,
    feedback: 'Luôn động viên và hướng dẫn tận tình các bạn thành viên mới trong ban làm quen với máy cơ và góc chụp đẹp.',
    improvement: 'Duy trì năng lượng tích cực này cho các sự kiện lớn tiếp theo nhé anh!',
    criteriaScores: { responsibility: 5, taskDelivery: 5, collaboration: 5, initiative: 4.8 },
    submittedAt: '2026-11-04T14:10:00.000Z',
  },

  // 2. LÊ TRẦN THUỶ NGUYÊN (Trưởng ban Tư vấn)
  {
    id: 'fb-nguyen-01',
    event: '1st Meeting',
    targetMemberCode: '24310069',
    targetMemberName: 'Lê Trần Thuỷ Nguyên',
    targetDepartment: 'Ban Tư vấn',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/thuy-nguyen-avatar.png',
    evaluatorMemberCode: '24310088',
    evaluatorName: 'Trần Đức Thắng',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Trưởng ban Truyền thông',
    evaluatorAvatarUrl: '/duc-thang-avatar.png',
    rating: 5,
    feedback: 'Khâu tiếp đón đại biểu và tân sinh viên của ban Tư vấn rất chuyên nghiệp, trang phục chỉn chu và luôn nở nụ cười thân thiện.',
    improvement: 'Cần thông báo trước cho ban Truyền thông về danh sách khách mời VIP để ưu tiên chụp ảnh lưu niệm.',
    criteriaScores: { responsibility: 5, taskDelivery: 5, collaboration: 4.8, initiative: 5 },
    submittedAt: '2026-11-04T09:30:00.000Z',
  },
  {
    id: 'fb-nguyen-02',
    event: '1st Meeting',
    targetMemberCode: '24310069',
    targetMemberName: 'Lê Trần Thuỷ Nguyên',
    targetDepartment: 'Ban Tư vấn',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/thuy-nguyen-avatar.png',
    evaluatorMemberCode: '24070752',
    evaluatorName: 'Phùng Thị Thu Hiền',
    evaluatorDept: 'Ban Tư vấn',
    evaluatorRole: 'Phó ban Tư vấn',
    evaluatorAvatarUrl: '/phung-thi-thu-hien-avatar.png',
    rating: 5,
    feedback: 'Chị Nguyên điều phối các bàn tư vấn rất khoa học, không để xảy ra tình trạng ùn ứ hay sót quà tặng cho tân sinh viên.',
    improvement: 'Có thể chuẩn bị thêm một số kịch bản giải đáp nhanh cho các câu hỏi thường gặp của phụ huynh.',
    criteriaScores: { responsibility: 5, taskDelivery: 5, collaboration: 5, initiative: 4.9 },
    submittedAt: '2026-11-04T10:45:00.000Z',
  },
  {
    id: 'fb-nguyen-03',
    event: '1st Meeting',
    targetMemberCode: '24310069',
    targetMemberName: 'Lê Trần Thuỷ Nguyên',
    targetDepartment: 'Ban Tư vấn',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/thuy-nguyen-avatar.png',
    evaluatorMemberCode: '24070744',
    evaluatorName: 'Nguyễn Ngọc Anh',
    evaluatorDept: 'Ban Nhân sự',
    evaluatorRole: 'Thành viên Core',
    rating: 5,
    feedback: 'Tương tác với các bạn tân sinh viên cực kỳ khéo léo và duyên dáng, để lại ấn tượng tốt về hình ảnh đại sứ iSSAC.',
    improvement: 'Phối hợp cùng ban Nhân sự để rà soát điểm danh các bạn tham gia sau sự kiện chuẩn xác hơn.',
    criteriaScores: { responsibility: 4.8, taskDelivery: 5, collaboration: 4.8, initiative: 5 },
    submittedAt: '2026-11-04T13:10:00.000Z',
  },
  {
    id: 'fb-nguyen-04',
    event: '1st Meeting',
    targetMemberCode: '24310069',
    targetMemberName: 'Lê Trần Thuỷ Nguyên',
    targetDepartment: 'Ban Tư vấn',
    targetPosition: 'Trưởng ban',
    targetAvatarUrl: '/thuy-nguyen-avatar.png',
    evaluatorMemberCode: 'STAFF-001',
    evaluatorName: 'Nguyễn Thị Hồng Hân',
    evaluatorDept: 'Ban Chủ nhiệm',
    evaluatorRole: 'Chủ nhiệm CLB',
    rating: 4,
    feedback: 'Bao quát tốt nhân sự ban Tư vấn, xử lý tình huống phát sinh bình tĩnh, tạo dựng hình ảnh đẹp cho khoa.',
    improvement: 'Phân bổ thời gian giữa các ca trực để thành viên có thời gian nghỉ uống nước.',
    criteriaScores: { responsibility: 4.8, taskDelivery: 4.5, collaboration: 4.5, initiative: 4.7 },
    submittedAt: '2026-11-04T15:20:00.000Z',
  },

  // 3. VŨ ĐÌNH HẢI (Phó ban Truyền thông)
  {
    id: 'fb-hai-01',
    event: '1st Meeting',
    targetMemberCode: '25070407',
    targetMemberName: 'Vũ Đình Hải',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Phó ban',
    targetAvatarUrl: '/vu-dinh-hai-avatar.png',
    evaluatorMemberCode: '24310088',
    evaluatorName: 'Trần Đức Thắng',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Trưởng ban Truyền thông',
    evaluatorAvatarUrl: '/duc-thang-avatar.png',
    rating: 4,
    feedback: 'Hải luôn có mặt sớm nhất để set up máy móc, livestream mượt mà và bắt trọn nhiều khoảnh khắc xúc động của sự kiện.',
    improvement: 'Cần chủ động giao việc cho các bạn K25 mới vào để các em có cơ hội cọ xát thực tế nhiều hơn.',
    criteriaScores: { responsibility: 4.7, taskDelivery: 4.5, collaboration: 4.3, initiative: 4.6 },
    submittedAt: '2026-11-04T11:00:00.000Z',
  },
  {
    id: 'fb-hai-02',
    event: '1st Meeting',
    targetMemberCode: '25070407',
    targetMemberName: 'Vũ Đình Hải',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Phó ban',
    targetAvatarUrl: '/vu-dinh-hai-avatar.png',
    evaluatorMemberCode: '24310069',
    evaluatorName: 'Lê Trần Thuỷ Nguyên',
    evaluatorDept: 'Ban Tư vấn',
    evaluatorRole: 'Trưởng ban Tư vấn',
    evaluatorAvatarUrl: '/thuy-nguyen-avatar.png',
    rating: 4,
    feedback: 'Nhiệt tình, khi ban Tư vấn nhờ chụp ảnh nhóm hay phỏng vấn nhanh đều sẵn sàng hỗ trợ ngay.',
    improvement: 'Gửi file ảnh gốc cho team sớm hơn sau khi sự kiện kết thúc.',
    criteriaScores: { responsibility: 4.5, taskDelivery: 4.4, collaboration: 4.5, initiative: 4.4 },
    submittedAt: '2026-11-04T12:30:00.000Z',
  },
  {
    id: 'fb-hai-03',
    event: '1st Meeting',
    targetMemberCode: '25070407',
    targetMemberName: 'Vũ Đình Hải',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Phó ban',
    targetAvatarUrl: '/vu-dinh-hai-avatar.png',
    evaluatorMemberCode: '25070345',
    evaluatorName: 'Lâm Thị Bình Dương',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Phó ban Truyền thông',
    evaluatorAvatarUrl: '/lam-thi-binh-duong-avatar.png',
    rating: 5,
    feedback: 'Làm việc ăn ý, hỗ trợ quản lý thiết bị cẩn thận không để mất mát đồ đạc.',
    improvement: 'Nên thảo luận trước góc quay video để đỡ bị rung lắc khi di chuyển trong hội trường.',
    criteriaScores: { responsibility: 4.8, taskDelivery: 4.8, collaboration: 4.8, initiative: 4.7 },
    submittedAt: '2026-11-04T14:40:00.000Z',
  },

  // 4. PHÙNG THỊ THU HIỀN (Phó ban Tư vấn)
  {
    id: 'fb-hien-01',
    event: '1st Meeting',
    targetMemberCode: '24070752',
    targetMemberName: 'Phùng Thị Thu Hiền',
    targetDepartment: 'Ban Tư vấn',
    targetPosition: 'Phó ban',
    targetAvatarUrl: '/phung-thi-thu-hien-avatar.png',
    evaluatorMemberCode: '24310069',
    evaluatorName: 'Lê Trần Thuỷ Nguyên',
    evaluatorDept: 'Ban Tư vấn',
    evaluatorRole: 'Trưởng ban Tư vấn',
    evaluatorAvatarUrl: '/thuy-nguyen-avatar.png',
    rating: 5,
    feedback: 'Cánh tay phải đắc lực của ban Tư vấn, quản lý danh sách check-in và tài liệu cực kỳ tỉ mỉ, không sai sót một trường hợp nào.',
    improvement: 'Tự tin nói trước đám đông hơn nữa để có thể dẫn dắt các buổi chia sẻ quy mô lớn.',
    criteriaScores: { responsibility: 5, taskDelivery: 5, collaboration: 4.9, initiative: 4.8 },
    submittedAt: '2026-11-04T10:50:00.000Z',
  },
  {
    id: 'fb-hien-02',
    event: '1st Meeting',
    targetMemberCode: '24070752',
    targetMemberName: 'Phùng Thị Thu Hiền',
    targetDepartment: 'Ban Tư vấn',
    targetPosition: 'Phó ban',
    targetAvatarUrl: '/phung-thi-thu-hien-avatar.png',
    evaluatorMemberCode: '24310088',
    evaluatorName: 'Trần Đức Thắng',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Trưởng ban Truyền thông',
    evaluatorAvatarUrl: '/duc-thang-avatar.png',
    rating: 4,
    feedback: 'Rất vui vẻ, phối hợp đưa tin tức và tư liệu cho ban Truyền thông cập nhật fanpage theo thời gian thực.',
    improvement: 'Tiếp tục phát huy tinh thần trách nhiệm nhé Hiền ơi.',
    criteriaScores: { responsibility: 4.6, taskDelivery: 4.5, collaboration: 4.7, initiative: 4.5 },
    submittedAt: '2026-11-04T14:05:00.000Z',
  },

  // 5. LÂM THỊ BÌNH DƯƠNG (Phó ban Truyền thông)
  {
    id: 'fb-duong-01',
    event: '1st Meeting',
    targetMemberCode: '25070345',
    targetMemberName: 'Lâm Thị Bình Dương',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Phó ban',
    targetAvatarUrl: '/lam-thi-binh-duong-avatar.png',
    evaluatorMemberCode: '24310088',
    evaluatorName: 'Trần Đức Thắng',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Trưởng ban Truyền thông',
    evaluatorAvatarUrl: '/duc-thang-avatar.png',
    rating: 5,
    feedback: 'Sáng tạo nội dung TikTok và Story rất bắt trend, giúp sự kiện 1st Meeting lan tỏa mạnh mẽ trên mạng xã hội.',
    improvement: 'Cần lên kịch bản nội dung sớm từ 2 ngày trước để duyệt cùng BCN.',
    criteriaScores: { responsibility: 4.8, taskDelivery: 4.9, collaboration: 4.8, initiative: 5 },
    submittedAt: '2026-11-04T11:40:00.000Z',
  },
  {
    id: 'fb-duong-02',
    event: '1st Meeting',
    targetMemberCode: '25070345',
    targetMemberName: 'Lâm Thị Bình Dương',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Phó ban',
    targetAvatarUrl: '/lam-thi-binh-duong-avatar.png',
    evaluatorMemberCode: '25070407',
    evaluatorName: 'Vũ Đình Hải',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Phó ban Truyền thông',
    evaluatorAvatarUrl: '/vu-dinh-hai-avatar.png',
    rating: 4,
    feedback: 'Nhanh nhẹn, linh hoạt nắm bắt các khoảnh khắc thú vị hậu trường.',
    improvement: 'Phối hợp nhịp nhàng hơn với đội chụp ảnh sự kiện để không bị trùng lặp góc máy.',
    criteriaScores: { responsibility: 4.6, taskDelivery: 4.5, collaboration: 4.5, initiative: 4.7 },
    submittedAt: '2026-11-04T13:15:00.000Z',
  },

  // 6. NGUYỄN NGỌC ANH (Ban Nhân sự)
  {
    id: 'fb-anh-01',
    event: '1st Meeting',
    targetMemberCode: '24070744',
    targetMemberName: 'Nguyễn Ngọc Anh',
    targetDepartment: 'Ban Nhân sự',
    targetPosition: 'Thành viên Core',
    evaluatorMemberCode: '23070764',
    evaluatorName: 'Vũ Thị Minh Ngọc',
    evaluatorDept: 'Ban Nhân sự',
    evaluatorRole: 'Trưởng ban Nhân sự',
    rating: 5,
    feedback: 'Hậu cần chu đáo, phân bổ vị trí trực và điểm danh thành viên chính xác 100%, bảo đảm kỷ luật sự kiện.',
    improvement: 'Nhắc nhở nhẹ nhàng hơn đối với các bạn đến muộn để giữ không khí thoải mái.',
    criteriaScores: { responsibility: 5, taskDelivery: 5, collaboration: 4.8, initiative: 4.7 },
    submittedAt: '2026-11-04T12:45:00.000Z',
  },
  {
    id: 'fb-anh-02',
    event: '1st Meeting',
    targetMemberCode: '24070744',
    targetMemberName: 'Nguyễn Ngọc Anh',
    targetDepartment: 'Ban Nhân sự',
    targetPosition: 'Thành viên Core',
    evaluatorMemberCode: '24310069',
    evaluatorName: 'Lê Trần Thuỷ Nguyên',
    evaluatorDept: 'Ban Tư vấn',
    evaluatorRole: 'Trưởng ban Tư vấn',
    evaluatorAvatarUrl: '/thuy-nguyen-avatar.png',
    rating: 4,
    feedback: 'Hỗ trợ nước uống và bàn ghế cho ban Tư vấn rất kịp thời, tác phong nhanh nhẹn.',
    improvement: 'Cần có phương án dự phòng khi số lượng thành viên tham gia vượt quá dự kiến ban đầu.',
    criteriaScores: { responsibility: 4.6, taskDelivery: 4.5, collaboration: 4.7, initiative: 4.4 },
    submittedAt: '2026-11-04T14:30:00.000Z',
  },

  // 7. NGUYỄN THU THẢO (Ban Nhân sự)
  {
    id: 'fb-thao-01',
    event: '1st Meeting',
    targetMemberCode: '24070755',
    targetMemberName: 'Nguyễn Thu Thảo',
    targetDepartment: 'Ban Nhân sự',
    targetPosition: 'Thành viên Core',
    evaluatorMemberCode: '23070764',
    evaluatorName: 'Vũ Thị Minh Ngọc',
    evaluatorDept: 'Ban Nhân sự',
    evaluatorRole: 'Trưởng ban Nhân sự',
    rating: 4,
    feedback: 'Hỗ trợ khâu chuẩn bị thẻ tên và văn phòng phẩm chu đáo, tinh thần đồng đội cao.',
    improvement: 'Chủ động đề xuất ý tưởng trong các buổi họp rút kinh nghiệm.',
    criteriaScores: { responsibility: 4.6, taskDelivery: 4.5, collaboration: 4.6, initiative: 4.3 },
    submittedAt: '2026-11-04T13:20:00.000Z',
  },
  {
    id: 'fb-thao-02',
    event: '1st Meeting',
    targetMemberCode: '24070755',
    targetMemberName: 'Nguyễn Thu Thảo',
    targetDepartment: 'Ban Nhân sự',
    targetPosition: 'Thành viên Core',
    evaluatorMemberCode: '24310088',
    evaluatorName: 'Trần Đức Thắng',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Trưởng ban Truyền thông',
    evaluatorAvatarUrl: '/duc-thang-avatar.png',
    rating: 4,
    feedback: 'Phối hợp tốt với bộ phận kỹ thuật để giữ gìn trật tự và không gian sân khấu sạch sẽ.',
    improvement: 'Duy trì năng lượng tích cực này nhé Thảo!',
    criteriaScores: { responsibility: 4.5, taskDelivery: 4.4, collaboration: 4.7, initiative: 4.3 },
    submittedAt: '2026-11-04T15:00:00.000Z',
  },

  // 8. PHƯƠNG GIA HUY (Cố vấn Ban Truyền thông)
  {
    id: 'fb-huy-01',
    event: '1st Meeting',
    targetMemberCode: '24070680',
    targetMemberName: 'Phương Gia Huy',
    targetDepartment: 'Ban Truyền thông',
    targetPosition: 'Cố vấn',
    targetAvatarUrl: '/phuong-gia-huy-avatar.png',
    evaluatorMemberCode: '24310088',
    evaluatorName: 'Trần Đức Thắng',
    evaluatorDept: 'Ban Truyền thông',
    evaluatorRole: 'Trưởng ban Truyền thông',
    evaluatorAvatarUrl: '/duc-thang-avatar.png',
    rating: 5,
    feedback: 'Anh Huy luôn là chỗ dựa vững chắc cho team, đưa ra nhiều lời khuyên quý báu về xử lý khủng hoảng kỹ thuật trên sân khấu.',
    improvement: 'Mong anh tiếp tục dành thời gian tham gia các sự kiện tiếp theo cùng thế hệ Gen mới!',
    criteriaScores: { responsibility: 5, taskDelivery: 4.9, collaboration: 4.9, initiative: 5 },
    submittedAt: '2026-11-04T10:10:00.000Z',
  },

  // 9. TRẦN THANH HIỀN (Ban Tư vấn)
  {
    id: 'fb-thanhhien-01',
    event: '1st Meeting',
    targetMemberCode: '24070748',
    targetMemberName: 'Trần Thanh Hiền',
    targetDepartment: 'Ban Tư vấn',
    targetPosition: 'Thành viên Core',
    evaluatorMemberCode: '24310069',
    evaluatorName: 'Lê Trần Thuỷ Nguyên',
    evaluatorDept: 'Ban Tư vấn',
    evaluatorRole: 'Trưởng ban Tư vấn',
    evaluatorAvatarUrl: '/thuy-nguyen-avatar.png',
    rating: 4,
    feedback: 'Tận tình giải đáp từng thắc mắc của tân sinh viên, thái độ lễ phép, nhã nhặn.',
    improvement: 'Tìm hiểu sâu hơn về quy chế đào tạo tín chỉ để tư vấn tự tin hơn.',
    criteriaScores: { responsibility: 4.5, taskDelivery: 4.3, collaboration: 4.5, initiative: 4.4 },
    submittedAt: '2026-11-04T11:50:00.000Z',
  },
]

// ============================================================
// Core Evaluation Criteria (Bộ 4 tiêu chí cốt lõi)
// ============================================================
export interface CoreCriterion {
  key: 'responsibility' | 'taskDelivery' | 'collaboration' | 'initiative'
  label: string
  shortLabel: string
  description: string
  weight: number
}

export const CORE_EVALUATION_CRITERIA: CoreCriterion[] = [
  {
    key: 'responsibility',
    label: 'Tinh thần trách nhiệm',
    shortLabel: 'Trách nhiệm',
    description: 'Tỉ mỉ, đúng hạn, tận tâm và không bỏ lửng đầu việc được giao',
    weight: 1,
  },
  {
    key: 'taskDelivery',
    label: 'Thực thi nhiệm vụ',
    shortLabel: 'Thực thi nhiệm vụ',
    description: 'Chất lượng đầu ra công việc, độ chuẩn xác và cam kết tiến độ',
    weight: 1,
  },
  {
    key: 'collaboration',
    label: 'Phối hợp & Giao tiếp',
    shortLabel: 'Phối hợp & Giao tiếp',
    description: 'Tương tác nhịp nhàng, lắng nghe đồng đội và phản hồi nhanh chóng',
    weight: 1,
  },
  {
    key: 'initiative',
    label: 'Chủ động sáng tạo',
    shortLabel: 'Chủ động sáng tạo',
    description: 'Đề xuất giải pháp mới, linh hoạt ứng biến trong các tình huống phát sinh',
    weight: 1,
  },
]

// ============================================================
// Survey Events & Questions Configuration
// ============================================================
export interface SurveyQuestionItem {
  id: string
  title: string
  description?: string
  type: 'rating_stars' | 'textarea' | 'text'
  required: boolean
  isCore?: boolean
  criteriaKey?: 'responsibility' | 'taskDelivery' | 'collaboration' | 'initiative'
}

export interface SurveyEventItem {
  id: string
  name: string
  date: string       // Ngày bắt đầu / ngày diễn ra (YYYY-MM-DD)
  endDate?: string   // Ngày kết thúc / hạn chót khảo sát (YYYY-MM-DD)
  status: 'active' | 'closed'
  description: string
  targetGroup: string
  customQuestions?: SurveyQuestionItem[]
  createdAt: string
}

export function isSurveyEventExpired(event: SurveyEventItem): boolean {
  if (event.status === 'closed') return true
  if (event.endDate) {
    const today = new Date().toISOString().slice(0, 10)
    return today > event.endDate
  }
  return false
}

export const SURVEY_EVENTS_STORAGE_KEY = 'issac_survey_events_v2'
export const SURVEY_QUESTIONS_STORAGE_KEY = 'issac_survey_custom_questions_v2'

export const INITIAL_SURVEY_EVENTS: SurveyEventItem[] = [
  {
    id: 'evt-01',
    name: '1st Meeting',
    date: '2026-10-15',
    endDate: '2026-11-30',
    status: 'active',
    description: 'Phiếu khảo sát và đánh giá chéo thành viên Core Team trong sự kiện First Meeting mở màn năm học',
    targetGroup: 'Toàn bộ Core Team (trừ BCN)',
    createdAt: '2026-10-15T08:00:00.000Z',
  },
  {
    id: 'evt-02',
    name: 'First Meeting - T10/2026',
    date: '2026-10-22',
    endDate: '2026-10-31',
    status: 'closed',
    description: 'Đánh giá sau buổi họp toàn thể ban chuyên môn tháng 10',
    targetGroup: 'Core Team các ban',
    createdAt: '2026-10-22T08:00:00.000Z',
  },
  {
    id: 'evt-03',
    name: 'Gen 3 Recruitment',
    date: '2026-10-28',
    endDate: '2026-11-04',
    status: 'closed',
    description: 'Khảo sát hiệu quả công tác tuyển quân và phỏng vấn thế hệ Gen 3',
    targetGroup: 'Core Team tham gia phỏng vấn',
    createdAt: '2026-10-28T08:00:00.000Z',
  },
  {
    id: 'evt-04',
    name: 'Workshop Sharing',
    date: '2026-11-02',
    endDate: '2026-11-05',
    status: 'closed',
    description: 'Đánh giá phối hợp tổ chức buổi chia sẻ kỹ năng và chuyên môn',
    targetGroup: 'Ban tổ chức Workshop',
    createdAt: '2026-11-02T08:00:00.000Z',
  },
]

// Default questions template for events
export const DEFAULT_EVENT_CUSTOM_QUESTIONS: SurveyQuestionItem[] = [
  {
    id: 'q-custom-1',
    title: 'Điểm ấn tượng nhất khi làm việc cùng thành viên này trong sự kiện?',
    description: 'Ghi nhận những đóng góp nổi bật hoặc khoảnh khắc hỗ trợ đồng đội tốt',
    type: 'textarea',
    required: false,
  },
]

// ============================================================
// Data access helpers
// ============================================================

export function getStoredSurveyFeedbacks(): SurveyFeedbackItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_FEEDBACKS
  try {
    const raw = localStorage.getItem(SURVEY_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(INITIAL_SURVEY_FEEDBACKS))
      return INITIAL_SURVEY_FEEDBACKS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SURVEY_FEEDBACKS
  } catch {
    return INITIAL_SURVEY_FEEDBACKS
  }
}

export function saveNewSurveyFeedback(item: SurveyFeedbackItem): SurveyFeedbackItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_FEEDBACKS
  try {
    const current = getStoredSurveyFeedbacks()
    // Check if duplicate from same evaluator for same target and event
    const filtered = current.filter(
      (f) => !(f.event === item.event && f.targetMemberCode === item.targetMemberCode && f.evaluatorMemberCode === item.evaluatorMemberCode)
    )
    const updated = [item, ...filtered]
    localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to save survey feedback:', err)
    return INITIAL_SURVEY_FEEDBACKS
  }
}

export function getStoredSurveyEvents(): SurveyEventItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_EVENTS
  try {
    const raw = localStorage.getItem(SURVEY_EVENTS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_SURVEY_EVENTS))
      return INITIAL_SURVEY_EVENTS
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_SURVEY_EVENTS
  } catch {
    return INITIAL_SURVEY_EVENTS
  }
}

export function saveNewSurveyEvent(item: SurveyEventItem): SurveyEventItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_EVENTS
  try {
    const current = getStoredSurveyEvents()
    const filtered = current.filter((e) => e.id !== item.id && e.name.toLowerCase() !== item.name.toLowerCase())
    const updated = [item, ...filtered]
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to save survey event:', err)
    return INITIAL_SURVEY_EVENTS
  }
}

export function updateSurveyEventStatus(id: string, status: 'active' | 'closed'): SurveyEventItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_EVENTS
  try {
    const current = getStoredSurveyEvents()
    const updated = current.map((e) => (e.id === id ? { ...e, status } : e))
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to update survey event status:', err)
    return INITIAL_SURVEY_EVENTS
  }
}

export function deleteSurveyEvent(id: string): SurveyEventItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_EVENTS
  try {
    const current = getStoredSurveyEvents()
    const updated = current.filter((e) => e.id !== id)
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to delete survey event:', err)
    return INITIAL_SURVEY_EVENTS
  }
}

export function getStoredCustomQuestions(eventId: string): SurveyQuestionItem[] {
  if (typeof window === 'undefined') return DEFAULT_EVENT_CUSTOM_QUESTIONS
  try {
    const raw = localStorage.getItem(`${SURVEY_QUESTIONS_STORAGE_KEY}_${eventId}`)
    if (!raw) {
      return DEFAULT_EVENT_CUSTOM_QUESTIONS
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (q) => q.id !== 'q-custom-2' && !q.title.includes('Mức độ sẵn sàng tiếp tục đồng hành')
      )
    }
    return DEFAULT_EVENT_CUSTOM_QUESTIONS
  } catch {
    return DEFAULT_EVENT_CUSTOM_QUESTIONS
  }
}

export function saveCustomQuestions(eventId: string, questions: SurveyQuestionItem[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${SURVEY_QUESTIONS_STORAGE_KEY}_${eventId}`, JSON.stringify(questions))
    window.dispatchEvent(new Event('storage'))
  } catch (err) {
    console.error('Failed to save custom questions:', err)
  }
}

export const EVENT_EVALS_PREFIX = 'issac_survey_evaluations_'

export function getStoredEventEvaluations(eventName: string): Record<string, any> | null {
  if (typeof window === 'undefined') return null
  try {
    const key = `${EVENT_EVALS_PREFIX}${encodeURIComponent(eventName)}`
    const raw = localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw)
    }
    return null
  } catch {
    return null
  }
}

export function saveStoredEventEvaluations(eventName: string, evals: Record<string, any>): void {
  if (typeof window === 'undefined') return
  try {
    const key = `${EVENT_EVALS_PREFIX}${encodeURIComponent(eventName)}`
    localStorage.setItem(key, JSON.stringify(evals))
    window.dispatchEvent(new Event('storage'))
  } catch (err) {
    console.error('Failed to save event evaluations:', err)
  }
}


