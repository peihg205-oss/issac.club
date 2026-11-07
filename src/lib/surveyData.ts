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

export const SURVEY_STORAGE_KEY = 'issac_all_survey_feedbacks_v4'

export const INITIAL_SURVEY_FEEDBACKS: SurveyFeedbackItem[] = [
  {
    "id": "fb-thanhhien-01",
    "targetMemberCode": "24310150",
    "targetMemberName": "Trần Thanh Hiền",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/tran-thanh-hien-avatar.png",
    "evaluatorMemberCode": "23070448",
    "evaluatorName": "Ngô Phương Hoa",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Trưởng ban Nhân sự",
    "evaluatorAvatarUrl": "/ngo-phuong-hoa-avatar.png",
    "rating": 9.8,
    "feedback": "Hiền phụ trách điểm danh và chuẩn bị hồ sơ cho các sự kiện của CLB rất chu đáo, tỉ mỉ. Tác phong nghiêm túc, làm việc trách nhiệm và luôn hỗ trợ các bạn thành viên kịp thời.",
    "improvement": "Chủ động mở rộng thêm các hoạt động bonding gắn kết nội bộ ban Nhân sự.",
    "criteriaScores": {
      "responsibility": 9.8,
      "taskDelivery": 9.7,
      "collaboration": 9.9,
      "initiative": 9.8
    },
    "submittedAt": "2026-11-07T09:15:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-thanhhien-01-1st",
    "targetMemberCode": "24310150",
    "targetMemberName": "Trần Thanh Hiền",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/tran-thanh-hien-avatar.png",
    "evaluatorMemberCode": "23070448",
    "evaluatorName": "Ngô Phương Hoa",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Trưởng ban Nhân sự",
    "evaluatorAvatarUrl": "/ngo-phuong-hoa-avatar.png",
    "rating": 9.8,
    "feedback": "Hiền phụ trách điểm danh và chuẩn bị hồ sơ cho các sự kiện của CLB rất chu đáo, tỉ mỉ. Tác phong nghiêm túc, làm việc trách nhiệm và luôn hỗ trợ các bạn thành viên kịp thời.",
    "improvement": "Chủ động mở rộng thêm các hoạt động bonding gắn kết nội bộ ban Nhân sự.",
    "criteriaScores": {
      "responsibility": 9.8,
      "taskDelivery": 9.7,
      "collaboration": 9.9,
      "initiative": 9.8
    },
    "submittedAt": "2026-11-07T09:15:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-thanhhien-02",
    "targetMemberCode": "24310150",
    "targetMemberName": "Trần Thanh Hiền",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/tran-thanh-hien-avatar.png",
    "evaluatorMemberCode": "23070691",
    "evaluatorName": "Giang Lê Hiệp",
    "evaluatorDept": "Ban Chủ nhiệm",
    "evaluatorRole": "Phó chủ nhiệm CLB",
    "evaluatorAvatarUrl": "/giang-le-hiep-avatar.png",
    "rating": 9.8,
    "feedback": "Tác phong làm việc chỉn chu, đáng tin cậy. Quản lý danh sách thành viên và điểm rèn luyện rất rõ ràng, phối hợp hiệu quả cùng Ban Chủ nhiệm.",
    "improvement": "Tự tin chia sẻ kinh nghiệm điều phối nhân sự cho các bạn thành viên thế hệ mới.",
    "criteriaScores": {
      "responsibility": 9.9,
      "taskDelivery": 9.8,
      "collaboration": 9.8,
      "initiative": 9.7
    },
    "submittedAt": "2026-11-07T10:30:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-thanhhien-02-1st",
    "targetMemberCode": "24310150",
    "targetMemberName": "Trần Thanh Hiền",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/tran-thanh-hien-avatar.png",
    "evaluatorMemberCode": "23070691",
    "evaluatorName": "Giang Lê Hiệp",
    "evaluatorDept": "Ban Chủ nhiệm",
    "evaluatorRole": "Phó chủ nhiệm CLB",
    "evaluatorAvatarUrl": "/giang-le-hiep-avatar.png",
    "rating": 9.8,
    "feedback": "Tác phong làm việc chỉn chu, đáng tin cậy. Quản lý danh sách thành viên và điểm rèn luyện rất rõ ràng, phối hợp hiệu quả cùng Ban Chủ nhiệm.",
    "improvement": "Tự tin chia sẻ kinh nghiệm điều phối nhân sự cho các bạn thành viên thế hệ mới.",
    "criteriaScores": {
      "responsibility": 9.9,
      "taskDelivery": 9.8,
      "collaboration": 9.8,
      "initiative": 9.7
    },
    "submittedAt": "2026-11-07T10:30:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-hoa-01",
    "targetMemberCode": "23070448",
    "targetMemberName": "Ngô Phương Hoa",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/ngo-phuong-hoa-avatar.png",
    "evaluatorMemberCode": "STAFF-001",
    "evaluatorName": "Nguyễn Thị Hồng Hân",
    "evaluatorDept": "Ban Chủ nhiệm",
    "evaluatorRole": "Chủ nhiệm CLB",
    "rating": 9.6,
    "feedback": "Hoa dẫn dắt ban Nhân sự rất vững vàng, điều phối công việc khoa học, quản lý quy chế và điểm rèn luyện minh bạch, chính xác.",
    "improvement": "Nên phân quyền sâu hơn cho các phó ban và thành viên nòng cốt để giảm tải áp lực cá nhân.",
    "criteriaScores": {
      "responsibility": 9.7,
      "taskDelivery": 9.6,
      "collaboration": 9.5,
      "initiative": 9.6
    },
    "submittedAt": "2026-11-07T09:40:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-hoa-01-1st",
    "targetMemberCode": "23070448",
    "targetMemberName": "Ngô Phương Hoa",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/ngo-phuong-hoa-avatar.png",
    "evaluatorMemberCode": "STAFF-001",
    "evaluatorName": "Nguyễn Thị Hồng Hân",
    "evaluatorDept": "Ban Chủ nhiệm",
    "evaluatorRole": "Chủ nhiệm CLB",
    "rating": 9.6,
    "feedback": "Hoa dẫn dắt ban Nhân sự rất vững vàng, điều phối công việc khoa học, quản lý quy chế và điểm rèn luyện minh bạch, chính xác.",
    "improvement": "Nên phân quyền sâu hơn cho các phó ban và thành viên nòng cốt để giảm tải áp lực cá nhân.",
    "criteriaScores": {
      "responsibility": 9.7,
      "taskDelivery": 9.6,
      "collaboration": 9.5,
      "initiative": 9.6
    },
    "submittedAt": "2026-11-07T09:40:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-hoa-02",
    "targetMemberCode": "23070448",
    "targetMemberName": "Ngô Phương Hoa",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/ngo-phuong-hoa-avatar.png",
    "evaluatorMemberCode": "24310150",
    "evaluatorName": "Trần Thanh Hiền",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Phó ban Nhân sự",
    "evaluatorAvatarUrl": "/tran-thanh-hien-avatar.png",
    "rating": 9.6,
    "feedback": "Trưởng ban tận tâm, luôn lắng nghe và hỗ trợ các bạn trong ban tháo gỡ khó khăn trong quá trình làm việc.",
    "improvement": "Tiếp tục duy trì lửa nhiệt huyết và tinh thần đoàn kết trong ban nhé chị!",
    "criteriaScores": {
      "responsibility": 9.6,
      "taskDelivery": 9.6,
      "collaboration": 9.7,
      "initiative": 9.5
    },
    "submittedAt": "2026-11-07T11:20:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-hoa-02-1st",
    "targetMemberCode": "23070448",
    "targetMemberName": "Ngô Phương Hoa",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/ngo-phuong-hoa-avatar.png",
    "evaluatorMemberCode": "24310150",
    "evaluatorName": "Trần Thanh Hiền",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Phó ban Nhân sự",
    "evaluatorAvatarUrl": "/tran-thanh-hien-avatar.png",
    "rating": 9.6,
    "feedback": "Trưởng ban tận tâm, luôn lắng nghe và hỗ trợ các bạn trong ban tháo gỡ khó khăn trong quá trình làm việc.",
    "improvement": "Tiếp tục duy trì lửa nhiệt huyết và tinh thần đoàn kết trong ban nhé chị!",
    "criteriaScores": {
      "responsibility": 9.6,
      "taskDelivery": 9.6,
      "collaboration": 9.7,
      "initiative": 9.5
    },
    "submittedAt": "2026-11-07T11:20:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-nguyen-01",
    "targetMemberCode": "24310069",
    "targetMemberName": "Lê Trần Thuỷ Nguyên",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/thuy-nguyen-avatar.png",
    "evaluatorMemberCode": "24310088",
    "evaluatorName": "Trần Đức Thắng",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Trưởng ban Truyền thông",
    "evaluatorAvatarUrl": "/duc-thang-avatar.png",
    "rating": 9.5,
    "feedback": "Khâu tiếp đón đại biểu và tân sinh viên của ban Tư vấn rất chuyên nghiệp, trang phục chỉn chu và luôn nở nụ cười thân thiện.",
    "improvement": "Cần thông báo trước cho ban Truyền thông về danh sách khách mời VIP để ưu tiên chụp ảnh lưu niệm.",
    "criteriaScores": {
      "responsibility": 9.6,
      "taskDelivery": 9.5,
      "collaboration": 9.4,
      "initiative": 9.5
    },
    "submittedAt": "2026-11-07T09:30:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-nguyen-01-1st",
    "targetMemberCode": "24310069",
    "targetMemberName": "Lê Trần Thuỷ Nguyên",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/thuy-nguyen-avatar.png",
    "evaluatorMemberCode": "24310088",
    "evaluatorName": "Trần Đức Thắng",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Trưởng ban Truyền thông",
    "evaluatorAvatarUrl": "/duc-thang-avatar.png",
    "rating": 9.5,
    "feedback": "Khâu tiếp đón đại biểu và tân sinh viên của ban Tư vấn rất chuyên nghiệp, trang phục chỉn chu và luôn nở nụ cười thân thiện.",
    "improvement": "Cần thông báo trước cho ban Truyền thông về danh sách khách mời VIP để ưu tiên chụp ảnh lưu niệm.",
    "criteriaScores": {
      "responsibility": 9.6,
      "taskDelivery": 9.5,
      "collaboration": 9.4,
      "initiative": 9.5
    },
    "submittedAt": "2026-11-07T09:30:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-nguyen-02",
    "targetMemberCode": "24310069",
    "targetMemberName": "Lê Trần Thuỷ Nguyên",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/thuy-nguyen-avatar.png",
    "evaluatorMemberCode": "24070752",
    "evaluatorName": "Phùng Thị Thu Hiền",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Phó ban Tư vấn",
    "evaluatorAvatarUrl": "/phung-thi-thu-hien-avatar.png",
    "rating": 9.5,
    "feedback": "Chị Nguyên điều phối các bàn tư vấn rất khoa học, không để xảy ra tình trạng ùn ứ hay sót quà tặng cho tân sinh viên.",
    "improvement": "Có thể chuẩn bị thêm một số kịch bản giải đáp nhanh cho các câu hỏi thường gặp của phụ huynh.",
    "criteriaScores": {
      "responsibility": 9.5,
      "taskDelivery": 9.5,
      "collaboration": 9.6,
      "initiative": 9.4
    },
    "submittedAt": "2026-11-07T10:45:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-nguyen-02-1st",
    "targetMemberCode": "24310069",
    "targetMemberName": "Lê Trần Thuỷ Nguyên",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/thuy-nguyen-avatar.png",
    "evaluatorMemberCode": "24070752",
    "evaluatorName": "Phùng Thị Thu Hiền",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Phó ban Tư vấn",
    "evaluatorAvatarUrl": "/phung-thi-thu-hien-avatar.png",
    "rating": 9.5,
    "feedback": "Chị Nguyên điều phối các bàn tư vấn rất khoa học, không để xảy ra tình trạng ùn ứ hay sót quà tặng cho tân sinh viên.",
    "improvement": "Có thể chuẩn bị thêm một số kịch bản giải đáp nhanh cho các câu hỏi thường gặp của phụ huynh.",
    "criteriaScores": {
      "responsibility": 9.5,
      "taskDelivery": 9.5,
      "collaboration": 9.6,
      "initiative": 9.4
    },
    "submittedAt": "2026-11-07T10:45:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-nguyen-03",
    "targetMemberCode": "24310069",
    "targetMemberName": "Lê Trần Thuỷ Nguyên",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/thuy-nguyen-avatar.png",
    "evaluatorMemberCode": "STAFF-001",
    "evaluatorName": "Nguyễn Thị Hồng Hân",
    "evaluatorDept": "Ban Chủ nhiệm",
    "evaluatorRole": "Chủ nhiệm CLB",
    "rating": 9.5,
    "feedback": "Bao quát tốt nhân sự ban Tư vấn, xử lý tình huống phát sinh bình tĩnh, tạo dựng hình ảnh đẹp cho khoa.",
    "improvement": "Phân bổ thời gian giữa các ca trực để thành viên có thời gian nghỉ uống nước.",
    "criteriaScores": {
      "responsibility": 9.6,
      "taskDelivery": 9.4,
      "collaboration": 9.5,
      "initiative": 9.5
    },
    "submittedAt": "2026-11-07T14:20:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-nguyen-03-1st",
    "targetMemberCode": "24310069",
    "targetMemberName": "Lê Trần Thuỷ Nguyên",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/thuy-nguyen-avatar.png",
    "evaluatorMemberCode": "STAFF-001",
    "evaluatorName": "Nguyễn Thị Hồng Hân",
    "evaluatorDept": "Ban Chủ nhiệm",
    "evaluatorRole": "Chủ nhiệm CLB",
    "rating": 9.5,
    "feedback": "Bao quát tốt nhân sự ban Tư vấn, xử lý tình huống phát sinh bình tĩnh, tạo dựng hình ảnh đẹp cho khoa.",
    "improvement": "Phân bổ thời gian giữa các ca trực để thành viên có thời gian nghỉ uống nước.",
    "criteriaScores": {
      "responsibility": 9.6,
      "taskDelivery": 9.4,
      "collaboration": 9.5,
      "initiative": 9.5
    },
    "submittedAt": "2026-11-07T14:20:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-thang-01",
    "targetMemberCode": "24310088",
    "targetMemberName": "Trần Đức Thắng",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/duc-thang-avatar.png",
    "evaluatorMemberCode": "24310069",
    "evaluatorName": "Lê Trần Thuỷ Nguyên",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Trưởng ban Tư vấn",
    "evaluatorAvatarUrl": "/thuy-nguyen-avatar.png",
    "rating": 9.5,
    "feedback": "Phối hợp truyền thông sự kiện rất nhịp nhàng, thiết kế banner và ấn phẩm check-in đẹp mắt, đúng hạn. Trên sân khấu hỗ trợ kỹ thuật và âm thanh rất linh hoạt.",
    "improvement": "Nên gửi link tổng hợp ảnh sau sự kiện sớm hơn để ban Tư vấn gửi lời cảm ơn tân sinh viên.",
    "criteriaScores": {
      "responsibility": 9.6,
      "taskDelivery": 9.5,
      "collaboration": 9.4,
      "initiative": 9.5
    },
    "submittedAt": "2026-11-07T10:15:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-thang-01-1st",
    "targetMemberCode": "24310088",
    "targetMemberName": "Trần Đức Thắng",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/duc-thang-avatar.png",
    "evaluatorMemberCode": "24310069",
    "evaluatorName": "Lê Trần Thuỷ Nguyên",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Trưởng ban Tư vấn",
    "evaluatorAvatarUrl": "/thuy-nguyen-avatar.png",
    "rating": 9.5,
    "feedback": "Phối hợp truyền thông sự kiện rất nhịp nhàng, thiết kế banner và ấn phẩm check-in đẹp mắt, đúng hạn. Trên sân khấu hỗ trợ kỹ thuật và âm thanh rất linh hoạt.",
    "improvement": "Nên gửi link tổng hợp ảnh sau sự kiện sớm hơn để ban Tư vấn gửi lời cảm ơn tân sinh viên.",
    "criteriaScores": {
      "responsibility": 9.6,
      "taskDelivery": 9.5,
      "collaboration": 9.4,
      "initiative": 9.5
    },
    "submittedAt": "2026-11-07T10:15:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-thang-02",
    "targetMemberCode": "24310088",
    "targetMemberName": "Trần Đức Thắng",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/duc-thang-avatar.png",
    "evaluatorMemberCode": "25070407",
    "evaluatorName": "Vũ Đình Hải",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Phó ban Truyền thông",
    "evaluatorAvatarUrl": "/vu-dinh-hai-avatar.png",
    "rating": 9.4,
    "feedback": "Anh Thắng luôn bao quát tốt toàn bộ khối truyền thông, phân công ca chụp ảnh và live story rất hợp lý, tạo không khí vui vẻ cho anh em trong ban.",
    "improvement": "Cần chú ý nghỉ ngơi và ăn uống đúng giờ trong những ngày chạy sự kiện dài.",
    "criteriaScores": {
      "responsibility": 9.5,
      "taskDelivery": 9.4,
      "collaboration": 9.3,
      "initiative": 9.4
    },
    "submittedAt": "2026-11-07T11:20:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-thang-02-1st",
    "targetMemberCode": "24310088",
    "targetMemberName": "Trần Đức Thắng",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/duc-thang-avatar.png",
    "evaluatorMemberCode": "25070407",
    "evaluatorName": "Vũ Đình Hải",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Phó ban Truyền thông",
    "evaluatorAvatarUrl": "/vu-dinh-hai-avatar.png",
    "rating": 9.4,
    "feedback": "Anh Thắng luôn bao quát tốt toàn bộ khối truyền thông, phân công ca chụp ảnh và live story rất hợp lý, tạo không khí vui vẻ cho anh em trong ban.",
    "improvement": "Cần chú ý nghỉ ngơi và ăn uống đúng giờ trong những ngày chạy sự kiện dài.",
    "criteriaScores": {
      "responsibility": 9.5,
      "taskDelivery": 9.4,
      "collaboration": 9.3,
      "initiative": 9.4
    },
    "submittedAt": "2026-11-07T11:20:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-thang-03",
    "targetMemberCode": "24310088",
    "targetMemberName": "Trần Đức Thắng",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/duc-thang-avatar.png",
    "evaluatorMemberCode": "23070691",
    "evaluatorName": "Giang Lê Hiệp",
    "evaluatorDept": "Ban Chủ nhiệm",
    "evaluatorRole": "Phó chủ nhiệm CLB",
    "evaluatorAvatarUrl": "/giang-le-hiep-avatar.png",
    "rating": 9.3,
    "feedback": "Tác phong chững chạc, tinh thần trách nhiệm của một trưởng ban rất đáng khen. Phản ứng nhanh khi có sự thay đổi kịch bản phút chót.",
    "improvement": "Đôn đốc các bạn CTV đăng bài recap đúng khung giờ vàng để tăng tương tác fanpage.",
    "criteriaScores": {
      "responsibility": 9.4,
      "taskDelivery": 9.3,
      "collaboration": 9.2,
      "initiative": 9.3
    },
    "submittedAt": "2026-11-07T13:45:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-thang-03-1st",
    "targetMemberCode": "24310088",
    "targetMemberName": "Trần Đức Thắng",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Trưởng ban",
    "targetAvatarUrl": "/duc-thang-avatar.png",
    "evaluatorMemberCode": "23070691",
    "evaluatorName": "Giang Lê Hiệp",
    "evaluatorDept": "Ban Chủ nhiệm",
    "evaluatorRole": "Phó chủ nhiệm CLB",
    "evaluatorAvatarUrl": "/giang-le-hiep-avatar.png",
    "rating": 9.3,
    "feedback": "Tác phong chững chạc, tinh thần trách nhiệm của một trưởng ban rất đáng khen. Phản ứng nhanh khi có sự thay đổi kịch bản phút chót.",
    "improvement": "Đôn đốc các bạn CTV đăng bài recap đúng khung giờ vàng để tăng tương tác fanpage.",
    "criteriaScores": {
      "responsibility": 9.4,
      "taskDelivery": 9.3,
      "collaboration": 9.2,
      "initiative": 9.3
    },
    "submittedAt": "2026-11-07T13:45:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-hai-01",
    "targetMemberCode": "25070407",
    "targetMemberName": "Vũ Đình Hải",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/vu-dinh-hai-avatar.png",
    "evaluatorMemberCode": "24310088",
    "evaluatorName": "Trần Đức Thắng",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Trưởng ban Truyền thông",
    "evaluatorAvatarUrl": "/duc-thang-avatar.png",
    "rating": 9.2,
    "feedback": "Hải luôn có mặt sớm nhất để set up máy móc, livestream mượt mà và bắt trọn nhiều khoảnh khắc xúc động của sự kiện.",
    "improvement": "Cần chủ động giao việc cho các bạn K25 mới vào để các em có cơ hội cọ xát thực tế nhiều hơn.",
    "criteriaScores": {
      "responsibility": 9.3,
      "taskDelivery": 9.1,
      "collaboration": 9.2,
      "initiative": 9.2
    },
    "submittedAt": "2026-11-07T11:00:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-hai-01-1st",
    "targetMemberCode": "25070407",
    "targetMemberName": "Vũ Đình Hải",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/vu-dinh-hai-avatar.png",
    "evaluatorMemberCode": "24310088",
    "evaluatorName": "Trần Đức Thắng",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Trưởng ban Truyền thông",
    "evaluatorAvatarUrl": "/duc-thang-avatar.png",
    "rating": 9.2,
    "feedback": "Hải luôn có mặt sớm nhất để set up máy móc, livestream mượt mà và bắt trọn nhiều khoảnh khắc xúc động của sự kiện.",
    "improvement": "Cần chủ động giao việc cho các bạn K25 mới vào để các em có cơ hội cọ xát thực tế nhiều hơn.",
    "criteriaScores": {
      "responsibility": 9.3,
      "taskDelivery": 9.1,
      "collaboration": 9.2,
      "initiative": 9.2
    },
    "submittedAt": "2026-11-07T11:00:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-hai-02",
    "targetMemberCode": "25070407",
    "targetMemberName": "Vũ Đình Hải",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/vu-dinh-hai-avatar.png",
    "evaluatorMemberCode": "25070345",
    "evaluatorName": "Lâm Thị Bình Dương",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Phó ban Truyền thông",
    "evaluatorAvatarUrl": "/lam-thi-binh-duong-avatar.png",
    "rating": 9.2,
    "feedback": "Làm việc ăn ý, hỗ trợ quản lý thiết bị cẩn thận không để mất mát đồ đạc.",
    "improvement": "Nên thảo luận trước góc quay video để đỡ bị rung lắc khi di chuyển trong hội trường.",
    "criteriaScores": {
      "responsibility": 9.2,
      "taskDelivery": 9.2,
      "collaboration": 9.3,
      "initiative": 9.1
    },
    "submittedAt": "2026-11-07T14:40:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-hai-02-1st",
    "targetMemberCode": "25070407",
    "targetMemberName": "Vũ Đình Hải",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/vu-dinh-hai-avatar.png",
    "evaluatorMemberCode": "25070345",
    "evaluatorName": "Lâm Thị Bình Dương",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Phó ban Truyền thông",
    "evaluatorAvatarUrl": "/lam-thi-binh-duong-avatar.png",
    "rating": 9.2,
    "feedback": "Làm việc ăn ý, hỗ trợ quản lý thiết bị cẩn thận không để mất mát đồ đạc.",
    "improvement": "Nên thảo luận trước góc quay video để đỡ bị rung lắc khi di chuyển trong hội trường.",
    "criteriaScores": {
      "responsibility": 9.2,
      "taskDelivery": 9.2,
      "collaboration": 9.3,
      "initiative": 9.1
    },
    "submittedAt": "2026-11-07T14:40:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-duong-01",
    "targetMemberCode": "25070345",
    "targetMemberName": "Lâm Thị Bình Dương",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/lam-thi-binh-duong-avatar.png",
    "evaluatorMemberCode": "24310088",
    "evaluatorName": "Trần Đức Thắng",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Trưởng ban Truyền thông",
    "evaluatorAvatarUrl": "/duc-thang-avatar.png",
    "rating": 9.1,
    "feedback": "Sáng tạo nội dung TikTok và Story rất bắt trend, giúp sự kiện lan tỏa mạnh mẽ trên mạng xã hội.",
    "improvement": "Cần lên kịch bản nội dung sớm từ 2 ngày trước để duyệt cùng BCN.",
    "criteriaScores": {
      "responsibility": 9.2,
      "taskDelivery": 9,
      "collaboration": 9.1,
      "initiative": 9.1
    },
    "submittedAt": "2026-11-07T11:40:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-duong-01-1st",
    "targetMemberCode": "25070345",
    "targetMemberName": "Lâm Thị Bình Dương",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/lam-thi-binh-duong-avatar.png",
    "evaluatorMemberCode": "24310088",
    "evaluatorName": "Trần Đức Thắng",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Trưởng ban Truyền thông",
    "evaluatorAvatarUrl": "/duc-thang-avatar.png",
    "rating": 9.1,
    "feedback": "Sáng tạo nội dung TikTok và Story rất bắt trend, giúp sự kiện lan tỏa mạnh mẽ trên mạng xã hội.",
    "improvement": "Cần lên kịch bản nội dung sớm từ 2 ngày trước để duyệt cùng BCN.",
    "criteriaScores": {
      "responsibility": 9.2,
      "taskDelivery": 9,
      "collaboration": 9.1,
      "initiative": 9.1
    },
    "submittedAt": "2026-11-07T11:40:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-duong-02",
    "targetMemberCode": "25070345",
    "targetMemberName": "Lâm Thị Bình Dương",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/lam-thi-binh-duong-avatar.png",
    "evaluatorMemberCode": "25070407",
    "evaluatorName": "Vũ Đình Hải",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Phó ban Truyền thông",
    "evaluatorAvatarUrl": "/vu-dinh-hai-avatar.png",
    "rating": 9.1,
    "feedback": "Nhanh nhẹn, linh hoạt nắm bắt các khoảnh khắc thú vị hậu trường.",
    "improvement": "Phối hợp nhịp nhàng hơn với đội chụp ảnh sự kiện để không bị trùng lặp góc máy.",
    "criteriaScores": {
      "responsibility": 9.1,
      "taskDelivery": 9.1,
      "collaboration": 9,
      "initiative": 9.2
    },
    "submittedAt": "2026-11-07T13:15:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-duong-02-1st",
    "targetMemberCode": "25070345",
    "targetMemberName": "Lâm Thị Bình Dương",
    "targetDepartment": "Ban Truyền thông",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/lam-thi-binh-duong-avatar.png",
    "evaluatorMemberCode": "25070407",
    "evaluatorName": "Vũ Đình Hải",
    "evaluatorDept": "Ban Truyền thông",
    "evaluatorRole": "Phó ban Truyền thông",
    "evaluatorAvatarUrl": "/vu-dinh-hai-avatar.png",
    "rating": 9.1,
    "feedback": "Nhanh nhẹn, linh hoạt nắm bắt các khoảnh khắc thú vị hậu trường.",
    "improvement": "Phối hợp nhịp nhàng hơn với đội chụp ảnh sự kiện để không bị trùng lặp góc máy.",
    "criteriaScores": {
      "responsibility": 9.1,
      "taskDelivery": 9.1,
      "collaboration": 9,
      "initiative": 9.2
    },
    "submittedAt": "2026-11-07T13:15:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-hien-01",
    "targetMemberCode": "24070752",
    "targetMemberName": "Phùng Thị Thu Hiền",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/phung-thi-thu-hien-avatar.png",
    "evaluatorMemberCode": "24310069",
    "evaluatorName": "Lê Trần Thuỷ Nguyên",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Trưởng ban Tư vấn",
    "evaluatorAvatarUrl": "/thuy-nguyen-avatar.png",
    "rating": 9,
    "feedback": "Cánh tay phải đắc lực của ban Tư vấn, quản lý danh sách check-in và tài liệu cực kỳ tỉ mỉ, không sai sót một trường hợp nào.",
    "improvement": "Tự tin nói trước đám đông hơn nữa để có thể dẫn dắt các buổi chia sẻ quy mô lớn.",
    "criteriaScores": {
      "responsibility": 9.2,
      "taskDelivery": 9,
      "collaboration": 8.9,
      "initiative": 8.9
    },
    "submittedAt": "2026-11-07T10:50:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-hien-01-1st",
    "targetMemberCode": "24070752",
    "targetMemberName": "Phùng Thị Thu Hiền",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/phung-thi-thu-hien-avatar.png",
    "evaluatorMemberCode": "24310069",
    "evaluatorName": "Lê Trần Thuỷ Nguyên",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Trưởng ban Tư vấn",
    "evaluatorAvatarUrl": "/thuy-nguyen-avatar.png",
    "rating": 9,
    "feedback": "Cánh tay phải đắc lực của ban Tư vấn, quản lý danh sách check-in và tài liệu cực kỳ tỉ mỉ, không sai sót một trường hợp nào.",
    "improvement": "Tự tin nói trước đám đông hơn nữa để có thể dẫn dắt các buổi chia sẻ quy mô lớn.",
    "criteriaScores": {
      "responsibility": 9.2,
      "taskDelivery": 9,
      "collaboration": 8.9,
      "initiative": 8.9
    },
    "submittedAt": "2026-11-07T10:50:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-hien-02",
    "targetMemberCode": "24070752",
    "targetMemberName": "Phùng Thị Thu Hiền",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/phung-thi-thu-hien-avatar.png",
    "evaluatorMemberCode": "24070622",
    "evaluatorName": "Nguyễn Ngọc Anh",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Phó ban Tư vấn",
    "evaluatorAvatarUrl": "/nguyen-ngoc-anh-avatar.png",
    "rating": 9,
    "feedback": "Rất vui vẻ, phối hợp đưa tin tức và tư liệu cho ban cập nhật theo thời gian thực.",
    "improvement": "Tiếp tục phát huy tinh thần trách nhiệm nhé Hiền ơi.",
    "criteriaScores": {
      "responsibility": 9,
      "taskDelivery": 9,
      "collaboration": 9.1,
      "initiative": 8.9
    },
    "submittedAt": "2026-11-07T14:05:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-hien-02-1st",
    "targetMemberCode": "24070752",
    "targetMemberName": "Phùng Thị Thu Hiền",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/phung-thi-thu-hien-avatar.png",
    "evaluatorMemberCode": "24070622",
    "evaluatorName": "Nguyễn Ngọc Anh",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Phó ban Tư vấn",
    "evaluatorAvatarUrl": "/nguyen-ngoc-anh-avatar.png",
    "rating": 9,
    "feedback": "Rất vui vẻ, phối hợp đưa tin tức và tư liệu cho ban cập nhật theo thời gian thực.",
    "improvement": "Tiếp tục phát huy tinh thần trách nhiệm nhé Hiền ơi.",
    "criteriaScores": {
      "responsibility": 9,
      "taskDelivery": 9,
      "collaboration": 9.1,
      "initiative": 8.9
    },
    "submittedAt": "2026-11-07T14:05:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-anh-01",
    "targetMemberCode": "24070622",
    "targetMemberName": "Nguyễn Ngọc Anh",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/nguyen-ngoc-anh-avatar.png",
    "evaluatorMemberCode": "24310069",
    "evaluatorName": "Lê Trần Thuỷ Nguyên",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Trưởng ban Tư vấn",
    "evaluatorAvatarUrl": "/thuy-nguyen-avatar.png",
    "rating": 8.9,
    "feedback": "Tương tác với các bạn tân sinh viên cực kỳ khéo léo và duyên dáng, để lại ấn tượng tốt về hình ảnh đại sứ iSSAC.",
    "improvement": "Phối hợp cùng ban Nhân sự để rà soát điểm danh các bạn tham gia sau sự kiện chuẩn xác hơn.",
    "criteriaScores": {
      "responsibility": 9,
      "taskDelivery": 8.9,
      "collaboration": 8.8,
      "initiative": 8.9
    },
    "submittedAt": "2026-11-07T12:45:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-anh-01-1st",
    "targetMemberCode": "24070622",
    "targetMemberName": "Nguyễn Ngọc Anh",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/nguyen-ngoc-anh-avatar.png",
    "evaluatorMemberCode": "24310069",
    "evaluatorName": "Lê Trần Thuỷ Nguyên",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Trưởng ban Tư vấn",
    "evaluatorAvatarUrl": "/thuy-nguyen-avatar.png",
    "rating": 8.9,
    "feedback": "Tương tác với các bạn tân sinh viên cực kỳ khéo léo và duyên dáng, để lại ấn tượng tốt về hình ảnh đại sứ iSSAC.",
    "improvement": "Phối hợp cùng ban Nhân sự để rà soát điểm danh các bạn tham gia sau sự kiện chuẩn xác hơn.",
    "criteriaScores": {
      "responsibility": 9,
      "taskDelivery": 8.9,
      "collaboration": 8.8,
      "initiative": 8.9
    },
    "submittedAt": "2026-11-07T12:45:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-anh-02",
    "targetMemberCode": "24070622",
    "targetMemberName": "Nguyễn Ngọc Anh",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/nguyen-ngoc-anh-avatar.png",
    "evaluatorMemberCode": "24070752",
    "evaluatorName": "Phùng Thị Thu Hiền",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Phó ban Tư vấn",
    "evaluatorAvatarUrl": "/phung-thi-thu-hien-avatar.png",
    "rating": 8.9,
    "feedback": "Hỗ trợ bàn tư vấn chu đáo, tác phong nhanh nhẹn và luôn giữ nụ cười thân thiện.",
    "improvement": "Chủ động nắm thêm thông tin các học bổng để tư vấn cho tân sinh viên.",
    "criteriaScores": {
      "responsibility": 8.9,
      "taskDelivery": 8.9,
      "collaboration": 8.9,
      "initiative": 8.9
    },
    "submittedAt": "2026-11-07T14:30:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-anh-02-1st",
    "targetMemberCode": "24070622",
    "targetMemberName": "Nguyễn Ngọc Anh",
    "targetDepartment": "Ban Tư vấn",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/nguyen-ngoc-anh-avatar.png",
    "evaluatorMemberCode": "24070752",
    "evaluatorName": "Phùng Thị Thu Hiền",
    "evaluatorDept": "Ban Tư vấn",
    "evaluatorRole": "Phó ban Tư vấn",
    "evaluatorAvatarUrl": "/phung-thi-thu-hien-avatar.png",
    "rating": 8.9,
    "feedback": "Hỗ trợ bàn tư vấn chu đáo, tác phong nhanh nhẹn và luôn giữ nụ cười thân thiện.",
    "improvement": "Chủ động nắm thêm thông tin các học bổng để tư vấn cho tân sinh viên.",
    "criteriaScores": {
      "responsibility": 8.9,
      "taskDelivery": 8.9,
      "collaboration": 8.9,
      "initiative": 8.9
    },
    "submittedAt": "2026-11-07T14:30:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-minhngoc-01",
    "targetMemberCode": "23070764",
    "targetMemberName": "Vũ Thị Minh Ngọc",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Trưởng ban",
    "evaluatorMemberCode": "23070448",
    "evaluatorName": "Ngô Phương Hoa",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Trưởng ban Nhân sự",
    "evaluatorAvatarUrl": "/ngo-phuong-hoa-avatar.png",
    "rating": 8.8,
    "feedback": "Quản lý nhân sự có nguyên tắc, hỗ trợ chuẩn bị văn phòng phẩm và kỷ luật sự kiện tốt, đồng hành sát sao cùng các sự kiện của CLB.",
    "improvement": "Cần tăng cường kết nối và phân bổ thời gian hợp lý giữa các buổi họp ban.",
    "criteriaScores": {
      "responsibility": 8.9,
      "taskDelivery": 8.8,
      "collaboration": 8.7,
      "initiative": 8.8
    },
    "submittedAt": "2026-11-07T13:20:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-minhngoc-01-1st",
    "targetMemberCode": "23070764",
    "targetMemberName": "Vũ Thị Minh Ngọc",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Trưởng ban",
    "evaluatorMemberCode": "23070448",
    "evaluatorName": "Ngô Phương Hoa",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Trưởng ban Nhân sự",
    "evaluatorAvatarUrl": "/ngo-phuong-hoa-avatar.png",
    "rating": 8.8,
    "feedback": "Quản lý nhân sự có nguyên tắc, hỗ trợ chuẩn bị văn phòng phẩm và kỷ luật sự kiện tốt, đồng hành sát sao cùng các sự kiện của CLB.",
    "improvement": "Cần tăng cường kết nối và phân bổ thời gian hợp lý giữa các buổi họp ban.",
    "criteriaScores": {
      "responsibility": 8.9,
      "taskDelivery": 8.8,
      "collaboration": 8.7,
      "initiative": 8.8
    },
    "submittedAt": "2026-11-07T13:20:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-minhngoc-02",
    "targetMemberCode": "23070764",
    "targetMemberName": "Vũ Thị Minh Ngọc",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Trưởng ban",
    "evaluatorMemberCode": "23071317",
    "evaluatorName": "Nguyễn Thị Hải Yến",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Phó ban Nhân sự",
    "evaluatorAvatarUrl": "/vu-hong-hai-yen-avatar.png",
    "rating": 8.8,
    "feedback": "Luôn gương mẫu trong việc tuân thủ giờ giấc và quy chế của CLB, hỗ trợ ban rất nhiều trong công tác hậu cần.",
    "improvement": "Tiếp tục phát huy tinh thần trách nhiệm trong các đợt hoạt động tới.",
    "criteriaScores": {
      "responsibility": 8.8,
      "taskDelivery": 8.8,
      "collaboration": 8.8,
      "initiative": 8.8
    },
    "submittedAt": "2026-11-07T15:00:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-minhngoc-02-1st",
    "targetMemberCode": "23070764",
    "targetMemberName": "Vũ Thị Minh Ngọc",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Trưởng ban",
    "evaluatorMemberCode": "23071317",
    "evaluatorName": "Nguyễn Thị Hải Yến",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Phó ban Nhân sự",
    "evaluatorAvatarUrl": "/vu-hong-hai-yen-avatar.png",
    "rating": 8.8,
    "feedback": "Luôn gương mẫu trong việc tuân thủ giờ giấc và quy chế của CLB, hỗ trợ ban rất nhiều trong công tác hậu cần.",
    "improvement": "Tiếp tục phát huy tinh thần trách nhiệm trong các đợt hoạt động tới.",
    "criteriaScores": {
      "responsibility": 8.8,
      "taskDelivery": 8.8,
      "collaboration": 8.8,
      "initiative": 8.8
    },
    "submittedAt": "2026-11-07T15:00:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-haiyen-01",
    "targetMemberCode": "23071317",
    "targetMemberName": "Nguyễn Thị Hải Yến",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/vu-hong-hai-yen-avatar.png",
    "evaluatorMemberCode": "23070764",
    "evaluatorName": "Vũ Thị Minh Ngọc",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Trưởng ban Nhân sự",
    "rating": 8.7,
    "feedback": "Hỗ trợ khâu hậu cần và theo dõi điểm danh rất chăm chỉ, luôn có mặt sớm để hỗ trợ ban tổ chức.",
    "improvement": "Chủ động phát biểu và đề xuất giải pháp hơn trong các cuộc họp giao ban Core Team.",
    "criteriaScores": {
      "responsibility": 8.8,
      "taskDelivery": 8.7,
      "collaboration": 8.7,
      "initiative": 8.6
    },
    "submittedAt": "2026-11-07T11:50:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-haiyen-01-1st",
    "targetMemberCode": "23071317",
    "targetMemberName": "Nguyễn Thị Hải Yến",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/vu-hong-hai-yen-avatar.png",
    "evaluatorMemberCode": "23070764",
    "evaluatorName": "Vũ Thị Minh Ngọc",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Trưởng ban Nhân sự",
    "rating": 8.7,
    "feedback": "Hỗ trợ khâu hậu cần và theo dõi điểm danh rất chăm chỉ, luôn có mặt sớm để hỗ trợ ban tổ chức.",
    "improvement": "Chủ động phát biểu và đề xuất giải pháp hơn trong các cuộc họp giao ban Core Team.",
    "criteriaScores": {
      "responsibility": 8.8,
      "taskDelivery": 8.7,
      "collaboration": 8.7,
      "initiative": 8.6
    },
    "submittedAt": "2026-11-07T11:50:00.000Z",
    "event": "1st Meeting"
  },
  {
    "id": "fb-haiyen-02",
    "targetMemberCode": "23071317",
    "targetMemberName": "Nguyễn Thị Hải Yến",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/vu-hong-hai-yen-avatar.png",
    "evaluatorMemberCode": "24310150",
    "evaluatorName": "Trần Thanh Hiền",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Phó ban Nhân sự",
    "evaluatorAvatarUrl": "/tran-thanh-hien-avatar.png",
    "rating": 8.7,
    "feedback": "Phối hợp tốt với bộ phận kỹ thuật để giữ gìn trật tự và không gian sự kiện sạch sẽ, gọn gàng.",
    "improvement": "Duy trì năng lượng tích cực này nhé Yến!",
    "criteriaScores": {
      "responsibility": 8.7,
      "taskDelivery": 8.7,
      "collaboration": 8.8,
      "initiative": 8.6
    },
    "submittedAt": "2026-11-07T14:15:00.000Z",
    "event": "Đánh giá hoạt động Core Team T10"
  },
  {
    "id": "fb-haiyen-02-1st",
    "targetMemberCode": "23071317",
    "targetMemberName": "Nguyễn Thị Hải Yến",
    "targetDepartment": "Ban Nhân sự",
    "targetPosition": "Phó ban",
    "targetAvatarUrl": "/vu-hong-hai-yen-avatar.png",
    "evaluatorMemberCode": "24310150",
    "evaluatorName": "Trần Thanh Hiền",
    "evaluatorDept": "Ban Nhân sự",
    "evaluatorRole": "Phó ban Nhân sự",
    "evaluatorAvatarUrl": "/tran-thanh-hien-avatar.png",
    "rating": 8.7,
    "feedback": "Phối hợp tốt với bộ phận kỹ thuật để giữ gìn trật tự và không gian sự kiện sạch sẽ, gọn gàng.",
    "improvement": "Duy trì năng lượng tích cực này nhé Yến!",
    "criteriaScores": {
      "responsibility": 8.7,
      "taskDelivery": 8.7,
      "collaboration": 8.8,
      "initiative": 8.6
    },
    "submittedAt": "2026-11-07T14:15:00.000Z",
    "event": "1st Meeting"
  }
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

export const SURVEY_EVENTS_STORAGE_KEY = 'issac_survey_events_v3'
export const SURVEY_QUESTIONS_STORAGE_KEY = 'issac_survey_custom_questions_v2'
export const SURVEY_DELETED_EVENTS_STORAGE_KEY = 'issac_deleted_survey_event_ids'

export function getDeletedSurveyEventIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SURVEY_DELETED_EVENTS_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

export function addDeletedSurveyEventId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const set = getDeletedSurveyEventIds()
    set.add(id)
    localStorage.setItem(SURVEY_DELETED_EVENTS_STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch (err) {
    console.error('Failed to save deleted survey event id:', err)
  }
}

export function removeDeletedSurveyEventId(id: string): void {
  if (typeof window === 'undefined') return
  try {
    const set = getDeletedSurveyEventIds()
    set.delete(id)
    localStorage.setItem(SURVEY_DELETED_EVENTS_STORAGE_KEY, JSON.stringify(Array.from(set)))
  } catch (err) {
    console.error('Failed to remove deleted survey event id:', err)
  }
}

export const INITIAL_SURVEY_EVENTS: SurveyEventItem[] = [
  {
    id: 'evt-core-t10',
    name: 'Đánh giá hoạt động Core Team T10',
    date: '2026-11-07',
    endDate: '2026-11-08',
    status: 'active',
    description: 'Đánh giá khách quan quá trình đồng hành làm việc với nhau, đánh giá đúng và chuẩn, nếu đánh giá qua qua BCN sẽ note thái độ làm việc của chính thành viên đánh giá.',
    targetGroup: 'Toàn bộ Core Team (trừ BCN)',
    createdAt: '2026-11-07T08:00:00.000Z',
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

export function normalizeFeedbacksToScale10(feedbacks: SurveyFeedbackItem[]): SurveyFeedbackItem[] {
  if (!Array.isArray(feedbacks)) return []
  return feedbacks.map((f) => {
    // If rating is <= 5, convert it to 10-point scale (e.g. 5 -> 10, 4.8 -> 9.6)
    const isScale5 = f.rating <= 5
    const newRating = isScale5 ? Number((f.rating * 2).toFixed(1)) : f.rating
    const newScores = f.criteriaScores
      ? {
          responsibility: f.criteriaScores.responsibility <= 5 ? Number((f.criteriaScores.responsibility * 2).toFixed(1)) : f.criteriaScores.responsibility,
          taskDelivery: f.criteriaScores.taskDelivery <= 5 ? Number((f.criteriaScores.taskDelivery * 2).toFixed(1)) : f.criteriaScores.taskDelivery,
          collaboration: f.criteriaScores.collaboration <= 5 ? Number((f.criteriaScores.collaboration * 2).toFixed(1)) : f.criteriaScores.collaboration,
          initiative: f.criteriaScores.initiative <= 5 ? Number((f.criteriaScores.initiative * 2).toFixed(1)) : f.criteriaScores.initiative,
        }
      : {
          responsibility: newRating,
          taskDelivery: newRating,
          collaboration: newRating,
          initiative: newRating,
        }
    return {
      ...f,
      rating: newRating,
      criteriaScores: newScores,
    }
  })
}

export function getStoredSurveyFeedbacks(): SurveyFeedbackItem[] {
  if (typeof window === 'undefined') return normalizeFeedbacksToScale10(INITIAL_SURVEY_FEEDBACKS)
  try {
    const raw = localStorage.getItem(SURVEY_STORAGE_KEY)
    if (raw === null) {
      const normalized = normalizeFeedbacksToScale10(INITIAL_SURVEY_FEEDBACKS)
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? normalizeFeedbacksToScale10(parsed) : []
  } catch {
    return []
  }
}

export function deleteFeedbacksByEvent(eventName: string): SurveyFeedbackItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SURVEY_STORAGE_KEY)
    const current: SurveyFeedbackItem[] = raw !== null ? (JSON.parse(raw) || []) : INITIAL_SURVEY_FEEDBACKS
    if (Array.isArray(current)) {
      const updated = current.filter((f) => f.event !== eventName)
      localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify(updated))
      return updated
    }
    return []
  } catch (err) {
    console.error('Failed to delete feedbacks for event:', err)
    return []
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
    const deletedIds = getDeletedSurveyEventIds()
    const raw = localStorage.getItem(SURVEY_EVENTS_STORAGE_KEY)
    if (raw === null) {
      // Nếu có sự kiện T10 trong v2 cũ thì lấy, nếu không khởi tạo INITIAL_SURVEY_EVENTS
      const legacyRaw = localStorage.getItem('issac_survey_events_v2')
      if (legacyRaw) {
        try {
          const parsedLegacy = JSON.parse(legacyRaw)
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            const hasT10 = parsedLegacy.some((e) => e.name.includes('Core Team T10'))
            if (hasT10) {
              const filtered = parsedLegacy.filter((e) => !deletedIds.has(e.id))
              localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(filtered))
              return filtered
            }
          }
        } catch {}
      }
      const initial = INITIAL_SURVEY_EVENTS.filter((e) => !deletedIds.has(e.id))
      localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(initial))
      return initial
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.filter((e) => !deletedIds.has(e.id))
    }
    return INITIAL_SURVEY_EVENTS.filter((e) => !deletedIds.has(e.id))
  } catch {
    return INITIAL_SURVEY_EVENTS
  }
}

export function saveNewSurveyEvent(item: SurveyEventItem): SurveyEventItem[] {
  if (typeof window === 'undefined') return [item]
  try {
    removeDeletedSurveyEventId(item.id)
    const current = getStoredSurveyEvents()
    const filtered = current.filter((e) => e.id !== item.id && e.name.toLowerCase() !== item.name.toLowerCase())
    const updated = [item, ...filtered]
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to save survey event:', err)
    return [item]
  }
}

export function updateSurveyEventStatus(id: string, status: 'active' | 'closed'): SurveyEventItem[] {
  if (typeof window === 'undefined') return []
  try {
    const current = getStoredSurveyEvents()
    const updated = current.map((e) => (e.id === id ? { ...e, status } : e))
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to update survey event status:', err)
    return []
  }
}

export function deleteSurveyEvent(id: string): SurveyEventItem[] {
  if (typeof window === 'undefined') return []
  try {
    const current = getStoredSurveyEvents()
    const targetEvent = current.find((e) => e.id === id)
    addDeletedSurveyEventId(id)
    const updated = current.filter((e) => e.id !== id)
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(updated))

    // Dọn dẹp sạch sẽ toàn bộ dữ liệu phụ thuộc của sự kiện bị xóa
    if (targetEvent) {
      try {
        localStorage.removeItem(`issac_survey_evaluations_${encodeURIComponent(targetEvent.name)}`)
        localStorage.removeItem(`${SURVEY_QUESTIONS_STORAGE_KEY}_${targetEvent.id}`)
        localStorage.removeItem(`${SURVEY_QUESTIONS_STORAGE_KEY}_${encodeURIComponent(targetEvent.name)}`)
        deleteFeedbacksByEvent(targetEvent.name)
      } catch (cleanErr) {
        console.error('Error cleaning event artifacts:', cleanErr)
      }
    }

    window.dispatchEvent(new Event('storage'))
    return updated
  } catch (err) {
    console.error('Failed to delete survey event:', err)
    return []
  }
}

export function restoreDefaultSurveyEvents(): SurveyEventItem[] {
  if (typeof window === 'undefined') return INITIAL_SURVEY_EVENTS
  try {
    localStorage.removeItem(SURVEY_DELETED_EVENTS_STORAGE_KEY)
    localStorage.setItem(SURVEY_EVENTS_STORAGE_KEY, JSON.stringify(INITIAL_SURVEY_EVENTS))
    window.dispatchEvent(new Event('storage'))
    return INITIAL_SURVEY_EVENTS
  } catch (err) {
    console.error('Failed to restore default survey events:', err)
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


