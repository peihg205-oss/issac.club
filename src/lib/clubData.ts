// ============================================================
// iSSAC_Web - Club Data & Official Roster (48 Members)
// ============================================================

import type {
  DepartmentCode,
  DepartmentSlug,
  PublicMember,
  RatingLevelName,
} from '@/types/database'
import { getRatingLevel } from './scoring/constants'

export interface RosterMember {
  source_stt: number
  member_code: string
  full_name: string
  department_name: string
  department_code: DepartmentCode
  department_slug: DepartmentSlug
  position: string
  is_core: boolean
  class_name?: string
  student_id?: string
  phone?: string
  email: string
  current_score: number
  absent_count_t02: number
  rank_in_club?: number
  rank_in_department?: number
  delta_rank?: number // e.g. +2 (tăng 2 hạng), -1 (giảm 1 hạng), 0
  avatar_url?: string
}

export const INITIAL_MEMBERS: RosterMember[] = [
  // BCN (3)
  { source_stt: 1, member_code: 'STAFF-001', full_name: 'Nguyễn Thị Hồng Hân', department_name: 'Ban Chủ nhiệm', department_code: 'B04', department_slug: 'bcn', position: 'Chủ nhiệm', is_core: true, class_name: 'Cán bộ phòng TT&TS', email: 'hannth@vnuis.edu.vn', phone: '0837262678', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 2, member_code: '23070691', full_name: 'Giang Lê Hiệp', department_name: 'Ban Chủ nhiệm', department_code: 'B04', department_slug: 'bcn', position: 'Phó chủ nhiệm', is_core: true, class_name: 'MIS2023A', student_id: '23070691', email: 'glhiep@vnuis.edu.vn', phone: '0374140705', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 3, member_code: '22073125', full_name: 'Nguyễn Trịnh Minh Trang', department_name: 'Ban Chủ nhiệm', department_code: 'B04', department_slug: 'bcn', position: 'Phó chủ nhiệm', is_core: true, class_name: 'ACF2023A', student_id: '22073125', email: 'ngtminhtrang3204@gmail.com', phone: '0868351218', current_score: 60, absent_count_t02: 0, delta_rank: 2 },

  // Ban Truyền thông (14)
  { source_stt: 4, member_code: '24310088', full_name: 'Trần Đức Thắng', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Trưởng ban', is_core: true, class_name: 'DC2024B', student_id: '24310088', email: 'tdthang@vnuis.edu.vn', phone: '0357626105', current_score: 60, absent_count_t02: 0, delta_rank: 1, avatar_url: '/avatars/duc-thang.jpg' },
  { source_stt: 5, member_code: '25070407', full_name: 'Vũ Đình Hải', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Phó ban', is_core: true, class_name: 'MIS2025A', student_id: '25070407', email: 'vudinhhai542007@gmail.com', phone: '0354434102', current_score: 60, absent_count_t02: 0, delta_rank: 3 },
  { source_stt: 6, member_code: '25070345', full_name: 'Lâm Thị Bình Dương', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Phó ban', is_core: true, class_name: 'MIS2025A', student_id: '25070345', email: 'lamduong200907@gmail.com', phone: '0382462795', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 7, member_code: '24070680', full_name: 'Phương Gia Huy', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Cố vấn', is_core: false, class_name: 'MIS2024C', student_id: '24070680', email: '9iahuyy@gmail.com', phone: '0367361118', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 8, member_code: '24070753', full_name: 'Hoàng Thị Khánh Linh', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'BDA2024C', student_id: '24070753', email: 'hoanglinh15072006@gmail.com', phone: '0325546515', current_score: 60, absent_count_t02: 0, delta_rank: 2 },
  { source_stt: 9, member_code: '25071203', full_name: 'Lục Xuân Huy', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'MIS2025B', student_id: '25071203', email: 'huylucxuan2007@gmail.com', phone: '0985030207', current_score: 60, absent_count_t02: 0, delta_rank: 4 },
  { source_stt: 10, member_code: '25070203', full_name: 'Hoàng Thị Tú An', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'MIS2025B', student_id: '25070203', email: 'anhoang26.htta12@gmail.com', phone: '0367030748', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 11, member_code: '25070278', full_name: 'Đinh Tấn Tài', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'MIS2025A', student_id: '25070278', email: 'dinhtai691@gmail.com', phone: '0393518168', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 12, member_code: '24310108', full_name: 'Hoàng Triều Xuân', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'DC2024B', student_id: '24310108', email: 'xuanht2603nb@gmail.com', phone: '0865512672', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 13, member_code: '24310078', full_name: 'Nguyễn Tố Như', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'DC2024B', student_id: '24310078', email: 'ntonhu808@gmail.com', phone: '0813773199', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 14, member_code: '26070162', full_name: 'Ngô Ánh Dương', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'ICE2026', student_id: '26070162', email: 'ngoanhduong200@gmail.com', phone: '0867385112', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 15, member_code: '26070774', full_name: 'Tô Mai Trang', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'BEL2026', student_id: '26070774', email: 'thimaitrangto@gmail.com', phone: '0343299388', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 16, member_code: '24070608', full_name: 'Nguyễn Phú Cường', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'MIS2024', student_id: '24070608', email: 'phunguyen1234567g@gmail.com', phone: '0899138456', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 17, member_code: '26070437', full_name: 'Lê Mai Anh', department_name: 'Ban Truyền thông', department_code: 'B01', department_slug: 'truyen-thong', position: 'Thành viên', is_core: false, class_name: 'DB2026', student_id: '26070437', email: 'manhiuoi56@gmail.com', phone: '0346265628', current_score: 60, absent_count_t02: 0, delta_rank: 0 },

  // Ban Tư vấn (23)
  { source_stt: 18, member_code: '24310069', full_name: 'Lê Trần Thuỷ Nguyên', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Trưởng ban', is_core: true, class_name: 'DC2024B', student_id: '24310069', email: 'tnguyenletran@gmail.com', phone: '0912158734', current_score: 60, absent_count_t02: 0, delta_rank: 2 },
  { source_stt: 19, member_code: '24070752', full_name: 'Phùng Thị Thu Hiền', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Phó ban', is_core: true, class_name: 'AC2024C', student_id: '24070752', email: '24070752@vnu.edu.vn', phone: '0988487541', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 20, member_code: '24070622', full_name: 'Nguyễn Ngọc Anh', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Phó ban', is_core: true, class_name: 'MIS2024B', student_id: '24070622', email: 'hnacognnee@gmail.com', phone: '0385367500', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 21, member_code: '23071234', full_name: 'Nguyễn Thu Thảo', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Cố vấn', is_core: false, class_name: 'AC2023D', student_id: '23071234', email: 'nthuthao2011@gmail.com', phone: '0886493955', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 22, member_code: '24310099', full_name: 'Lê Duy Tuấn', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'DC2024A', student_id: '24310099', email: 'rudeyuitan2006@gmail.com', phone: '0763021511', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 23, member_code: '24310072', full_name: 'Nguyễn Thị Nguyệt', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'DC2024A', student_id: '24310072', email: 'nguytn7@gmail.com', phone: '0378647348', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 24, member_code: '25071139', full_name: 'Hoàng Mẫn Quỳnh Chi', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'BDA2 K24', student_id: '25071139', email: 'hoangmanquynhchi@gmail.com', phone: '0975167734', current_score: 60, absent_count_t02: 0, delta_rank: 2 },
  { source_stt: 25, member_code: '25071210', full_name: 'Nguyễn Vũ Hồng Hạnh', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'AIT1 K24', student_id: '25071210', email: 'hanhnguyenvu2007@gmail.com', phone: '0396680326', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 26, member_code: '23070355', full_name: 'Vũ Bá Quốc Hưng', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'AIT2023A', student_id: '23070355', email: 'vubaquochung@gmail.com', phone: '0373701205', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 27, member_code: '24070659', full_name: 'Nguyễn Thị Thuỳ Dương', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'MIS2024D', student_id: '24070659', email: 'duongneeeeee@gmail.com', phone: '0988917270', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 28, member_code: '24070676', full_name: 'Phan Thành Đạt', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'MIS2024B', student_id: '24070676', email: 'datbich22@gmail.com', phone: '0562440999', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 29, member_code: '25070097', full_name: 'Phạm Thị Hải Chi', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'Dual_MKT2025A', student_id: '25070097', email: 'haichidepham2305@gmail.com', phone: '0822657958', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 30, member_code: '24071358', full_name: 'Vũ Gia Linh', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'BEL2024B', student_id: '24071358', email: 'linhvg2207@gmail.com', phone: '0379854746', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 31, member_code: '24070778', full_name: 'Phùng Đình Thiệp', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'BDA2024A', student_id: '24070778', email: 'thiepphung06@gmail.com', phone: '0966551606', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 32, member_code: '25070868', full_name: 'Nguyễn Phương Thảo', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'IB2025C', student_id: '25070868', email: 'phuongthao300907@gmail.com', phone: '0977242857', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 33, member_code: '24070732', full_name: 'Nguyễn Thành Trung', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'AIT2024A', student_id: '24070732', email: 'trung170506@gmail.com', phone: '0945952292', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 34, member_code: '25070267', full_name: 'Nguyễn Thị Hải Yến', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'MIS2025B', student_id: '25070267', email: 'haiyen260827@gmail.com', phone: '0374160410', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 35, member_code: '24070845', full_name: 'Nguyễn Thị Linh Chi', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'BA2024C', student_id: '24070845', email: 'linhchii0611@gmail.com', phone: '0916327333', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 36, member_code: '25071191', full_name: 'Nguyễn Ngọc Anh Thư', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'AIT2025B', student_id: '25071191', email: 'thungan0907@gmail.com', phone: '0366883207', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 37, member_code: '25070860', full_name: 'Hoàng Thị Thuỳ Linh', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'IB2025A', student_id: '25070860', email: 'thuylinh28112007@gmail.com', phone: '0389332560', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 38, member_code: '25070857', full_name: 'Trần Mỹ Ngọc', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'IB2025B', student_id: '25070857', email: 'ngoctran26052007@gmail.com', phone: '0398669527', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 39, member_code: '25070863', full_name: 'Nguyễn Duy Khánh', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'IB2025B', student_id: '25070863', email: 'duykhanh17092007@gmail.com', phone: '0832087568', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 40, member_code: '25070193', full_name: 'Phạm Thị Phương Thảo', department_name: 'Ban Tư vấn', department_code: 'B02', department_slug: 'tu-van', position: 'Thành viên', is_core: false, class_name: 'DB2025B', student_id: '25070193', email: 'phuongthao07112007@gmail.com', phone: '0339598858', current_score: 60, absent_count_t02: 0, delta_rank: 0 },

  // Ban Nhân sự (8)
  { source_stt: 41, member_code: '23070764', full_name: 'Vũ Thị Minh Ngọc', department_name: 'Ban Nhân sự', department_code: 'B03', department_slug: 'nhan-su', position: 'Trưởng ban', is_core: true, class_name: 'MIS2023C', student_id: '23070764', email: 'minhngocvu1302@gmail.com', phone: '0372863920', current_score: 60, absent_count_t02: 0, delta_rank: 2 },
  { source_stt: 42, member_code: '23071317', full_name: 'Nguyễn Thị Hải Yến', department_name: 'Ban Nhân sự', department_code: 'B03', department_slug: 'nhan-su', position: 'Phó ban', is_core: true, class_name: 'AC2023C', student_id: '23071317', email: 'haiyennguyen2504@gmail.com', phone: '0981987546', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 43, member_code: '26070440', full_name: 'Nguyễn Khánh Linh', department_name: 'Ban Nhân sự', department_code: 'B03', department_slug: 'nhan-su', position: 'Thành viên', is_core: false, class_name: 'DB2026', student_id: '26070440', email: 'linh15112006@gmail.com', phone: '0822601720', current_score: 60, absent_count_t02: 0, delta_rank: 3 },
  { source_stt: 44, member_code: '26070775', full_name: 'Trần Bùi Thanh Thuỷ', department_name: 'Ban Nhân sự', department_code: 'B03', department_slug: 'nhan-su', position: 'Thành viên', is_core: false, class_name: 'BEL2026', student_id: '26070775', email: 'buithuy25112006@gmail.com', phone: '0828555234', current_score: 60, absent_count_t02: 0, delta_rank: 0 },
  { source_stt: 45, member_code: '26070773', full_name: 'Nguyễn Thanh Tùng', department_name: 'Ban Nhân sự', department_code: 'B03', department_slug: 'nhan-su', position: 'Thành viên', is_core: false, class_name: 'BEL2026', student_id: '26070773', email: 'tungnguyenthanh2102006@gmail.com', phone: '0867083049', current_score: 60, absent_count_t02: 0, delta_rank: -1 },
  { source_stt: 46, member_code: '25070088', full_name: 'Nguyễn Nhật Ánh', department_name: 'Ban Nhân sự', department_code: 'B03', department_slug: 'nhan-su', position: 'Thành viên', is_core: false, class_name: 'Dual_MKT2025A', student_id: '25070088', email: 'anhnguyennhat269@gmail.com', phone: '0979840286', current_score: 60, absent_count_t02: 0, delta_rank: 1 },
  { source_stt: 47, member_code: '25070014', full_name: 'Lê Hoàng Anh', department_name: 'Ban Nhân sự', department_code: 'B03', department_slug: 'nhan-su', position: 'Thành viên', is_core: false, class_name: 'Dual_FIN2025B', student_id: '25070014', email: 'hoanganhle1310@gmail.com', phone: '0981146788', current_score: 60, absent_count_t02: 0, delta_rank: -2 },
  { source_stt: 48, member_code: '26070772', full_name: 'Bùi Phương Linh', department_name: 'Ban Nhân sự', department_code: 'B03', department_slug: 'nhan-su', position: 'Thành viên', is_core: false, class_name: 'BEL2026', student_id: '26070772', email: 'linhbp2209@gmail.com', phone: '0868846328', current_score: 60, absent_count_t02: 0, delta_rank: -3 },
]

// Sẵn sàng vận hành thật: Tất cả 48 thành viên xuất phát từ điểm chuẩn 60đ theo Quy chế P01
export const INITIAL_ACTIVITY_DELTAS: Record<string, number> = {}


export const DEPARTMENTS_DATA = [
  { code: 'B04' as DepartmentCode, slug: 'bcn' as DepartmentSlug, name: 'Ban Chủ nhiệm', memberCount: 3, description: 'Lãnh đạo, định hướng chiến lược và quản lý chung toàn CLB' },
  { code: 'B01' as DepartmentCode, slug: 'truyen-thong' as DepartmentSlug, name: 'Ban Truyền thông', memberCount: 14, description: 'Sáng tạo nội dung, thiết kế ấn phẩm, truyền thông đa nền tảng và phát triển thương hiệu iSSAC' },
  { code: 'B02' as DepartmentCode, slug: 'tu-van' as DepartmentSlug, name: 'Ban Tư vấn', memberCount: 23, description: 'Tư vấn tuyển sinh, hỗ trợ tân sinh viên và giải đáp thông tin chương trình đào tạo' },
  { code: 'B03' as DepartmentCode, slug: 'nhan-su' as DepartmentSlug, name: 'Ban Nhân sự', memberCount: 8, description: 'Quản trị nhân sự, đánh giá điểm rèn luyện, gắn kết nội bộ và tổ chức sự kiện CLB' },
]

export function getRankedMembers(members: RosterMember[] = INITIAL_MEMBERS): RosterMember[] {
  const sorted = [...members].sort((a, b) => b.current_score - a.current_score)
  const ranked = sorted.map((m, idx) => ({ ...m, rank_in_club: idx + 1 }))

  const deptMap: Record<string, number> = {}
  return ranked.map((m) => {
    deptMap[m.department_slug] = (deptMap[m.department_slug] || 0) + 1
    return { ...m, rank_in_department: deptMap[m.department_slug] }
  })
}

export function getActiveRosterMembers(members: RosterMember[] = INITIAL_MEMBERS): RosterMember[] {
  return getRankedMembers(
    members.map((m) => {
      const delta = INITIAL_ACTIVITY_DELTAS[m.member_code] || 0
      return {
        ...m,
        current_score: m.current_score + delta,
      }
    })
  )
}

export function getPublicRankedMembers(members: RosterMember[] = INITIAL_MEMBERS): PublicMember[] {
  const ranked = getActiveRosterMembers(members)
  return ranked.map((m) => ({
    id: m.member_code,
    member_code: m.member_code,
    full_name: m.full_name,
    department_name: m.department_name,
    department_code: m.department_code,
    position: m.position,
    is_core_team: m.is_core,
    status: 'active',
    current_score: m.current_score,
    rating_level: getRatingLevel(m.current_score).level_name as RatingLevelName,
    rank: m.rank_in_club || 1,
    avatar_url: m.avatar_url,
  }))
}

export function getClubSummary(members: RosterMember[] = INITIAL_MEMBERS) {
  const total = members.length
  const totalScore = members.reduce((sum, m) => sum + m.current_score, 0)
  const avgScore = total > 0 ? Number((totalScore / total).toFixed(1)) : 0
  const coreCount = members.filter((m) => m.is_core).length
  const alertCount = members.filter((m) => m.current_score < 40).length
  const excellentCount = members.filter((m) => m.current_score >= 85).length

  return {
    totalMembers: total,
    avgScore,
    coreCount,
    alertCount,
    excellentCount,
  }
}
