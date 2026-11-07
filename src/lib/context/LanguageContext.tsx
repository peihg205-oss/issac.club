'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'vi' | 'en'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultText?: string) => string
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    // Nav & Sidebar
    'nav.overview': 'TỔNG QUAN',
    'nav.dashboard': 'Bảng điều khiển',
    'nav.leaderboard_section': 'XẾP HẠNG THI ĐUA',
    'nav.leaderboard': 'Bảng xếp hạng',
    'nav.management': 'QUẢN TRỊ THÀNH VIÊN',
    'nav.members': 'Danh sách thành viên',
    'nav.core_survey': 'Khảo sát Core Team',
    'nav.schedule': 'Lịch hoạt động',
    'nav.checkin': 'Điểm danh sự kiện',
    'nav.history': 'Lịch sử & Duyệt điểm',
    'nav.rules': 'Quy chế & Thang điểm',
    'nav.accounts': 'Tài khoản người dùng',
    'nav.settings': 'Cấu hình hệ thống',
    'nav.live': 'TRỰC TIẾP',
    'nav.theme': 'Giao diện',
    'nav.version': 'Phiên bản',

    // Header
    'header.search_placeholder': 'Tìm kiếm thành viên, MSSV, ban...',
    'header.home': 'Trang chủ',
    'header.news': 'Tin tức',
    'header.student_id': 'Mã sinh viên',
    'header.department': 'Ban',
    'header.logout': 'Đăng xuất',
    'header.role_title': 'Vai trò',

    // Dashboard View
    'dashboard.title': "iSSACer's Dashboard điểm hoạt động",
    'dashboard.subtitle': 'Bảng tổng hợp mức độ chuyên cần và đóng góp của thành viên iSSAC.',
    'dashboard.view_leaderboard': 'Xem bảng xếp hạng',
    'dashboard.export_report': 'Xuất báo cáo',
    'dashboard.mascot_tooltip': 'Linh vật iSSAC năng động chào bạn!',
    'dashboard.event_live': 'Đang diễn ra trực tiếp',
    'dashboard.open_checkin': 'Mở bảng điểm danh',

    // 8 KPI cards
    'dashboard.kpi_total_members': 'Tổng số thành viên',
    'dashboard.kpi_approved_month': 'Đã duyệt trong tháng',
    'dashboard.kpi_pending': 'Đang chờ duyệt',
    'dashboard.kpi_avg_attendance': 'Tỷ lệ chuyên cần TB',
    'dashboard.kpi_bonus_awarded': 'Điểm cộng đã trao',
    'dashboard.kpi_penalty_deducted': 'Điểm trừ đã phạt',
    'dashboard.kpi_penalty_attendance': 'Điểm trừ chuyên cần',
    'dashboard.kpi_avg_score': 'Điểm rèn luyện TB',
    'dashboard.view_list': 'Xem danh sách',
    'dashboard.view_history': 'Xem lịch sử',
    'dashboard.approve_now': 'Phê duyệt ngay',
    'dashboard.dept_details': 'Chi tiết các ban',
    'dashboard.view_details': 'Xem chi tiết',

    // Lower columns
    'dashboard.top5_title': 'Bảng Xếp Hạng Đóng Góp iSSACer (Top 5)',
    'dashboard.top5_desc': 'Gương mặt tiêu biểu dẫn đầu phong trào thi đua CLB',
    'dashboard.view_all_count': 'Xem tất cả 48',
    'dashboard.open_full_leaderboard': 'Mở Bảng Xếp Hạng Đầy Đủ & Bục Vinh Danh Top 3',
    'dashboard.very_active': 'Rất tích cực',
    'dashboard.active': 'Tích cực',
    'dashboard.dept_dist_title': 'Phân bổ thành viên theo Ban',
    'dashboard.dept_dist_desc': 'Cơ cấu nhân sự và điểm trung bình theo từng ban trực thuộc',
    'dashboard.dept_consulting': 'Ban Tư vấn',
    'dashboard.dept_media': 'Ban Truyền thông',
    'dashboard.dept_hr': 'Ban Nhân sự',
    'dashboard.dept_bcn': 'Ban Chủ nhiệm',
    'dashboard.members_count': 'thành viên',
    'dashboard.club_share': 'toàn CLB',
    'dashboard.avg_score_label': 'Điểm TB',
    'dashboard.box_top15': 'TOP 15 XUẤT SẮC',
    'dashboard.box_qualified': 'ĐẠT CHUẨN CLB',
    'dashboard.box_warning': 'CẢNH BÁO / KHÔNG ĐẠT',

    // Comparison Chart
    'chart.title': 'So sánh Thi đua & Hiệu suất Hoạt động',
    'chart.subtitle': 'Đối sánh trực quan điểm số, mức độ tích cực và tỷ lệ chuyên cần giữa 4 ban',
    'chart.mode_dept_score': 'Điểm trung bình các ban',
    'chart.mode_plus_vs_minus': 'Cộng vs Trừ',
    'chart.mode_monthly_trend': 'Xu hướng 3 tháng',
    'chart.period_label': 'Kỳ:',
    'chart.current_period_badge': 'ĐANG CHỌN: KỲ 1',
    'chart.sort_default': 'Thứ tự mặc định',
    'chart.sort_highest': 'Điểm cao nhất',
    'chart.sort_lowest': 'Điểm thấp nhất',
    'chart.sort_attendance': 'Chuyên cần cao nhất',
    'chart.target_label': 'Mục tiêu toàn CLB',
    'chart.club_avg_label': 'Điểm TB toàn CLB',
    'chart.baseline_label': 'Mức sàn điểm tối thiểu',
    'chart.scale_label': 'Thang điểm',
    'chart.scale_standard': 'Thang điểm chuẩn',
    'chart.target_80': 'Mục tiêu 80đ',
    'chart.dept_details_heading': 'Chi tiết từng ban',
    'chart.quick_compare_heading': 'So sánh nhanh',
    'chart.quick_compare_desc': 'Điểm thi đua và tỷ lệ chuyên cần của các ban',
    'chart.col_dept': 'Ban',
    'chart.col_avg_score': 'Điểm TB',
    'chart.col_vs_prev': 'So với kỳ trước',
    'chart.col_attendance': 'Tỷ lệ chuyên cần',
    'chart.rank_1': 'Dẫn đầu thi đua',
    'chart.rank_2': 'Xếp thứ 2',
    'chart.rank_3': 'Xếp thứ 3',
    'chart.rank_4': 'Xếp thứ 4',
    'chart.attendance_rate_label': 'Tỷ lệ chuyên cần',
    'chart.bonus_rules_tag': 'Điểm cộng thi đua (C01-C09)',
    'chart.penalty_rules_tag': 'Điểm trừ kỷ luật (T01-T13)',
    'chart.compliance_rate': 'Tỷ lệ tuân thủ toàn CLB: 93.4%',
    'chart.net_received': 'Thực nhận',
    'chart.bonus_label': 'Cộng',
    'chart.penalty_label': 'Trừ',
    'chart.month_club_avg': 'Điểm trung bình CLB',
    'chart.attendance_short': 'Chuyên cần',
    'chart.total_bonus': 'Tổng điểm cộng',
    'chart.growth_summary': 'Đánh giá tổng kết: Toàn Câu Lạc bộ duy trì đà tăng trưởng chuyên cần và điểm rèn luyện liên tục qua 3 tháng (+6.2 điểm tích luỹ).',
    'chart.term_tag': 'Nhiệm kỳ 2025 - 2026',
    'chart.new_cycle_note': 'Chu kỳ mới khởi tạo - Mốc xuất phát 60đ (chưa phát sinh điểm cộng/trừ)',
    'chart.term_period_note': 'Kỳ 1 (2025 - 2026)',

    // Checkin View
    'checkin.title': 'Quản lý điểm danh sự kiện iSSAC',
    'checkin.subtitle': 'Hệ thống kiểm soát chuyên cần thời gian thực',
    'checkin.mascot_tooltip': 'Bấm vào tớ để xem lời nhắc nhé!',
    'checkin.tab_roster': 'Sĩ số',
    'checkin.tab_tickets': 'Vé',
    'checkin.tab_kiosk': 'Cổng Kiosk',
    'checkin.tab_history': 'Lịch sử',
    'checkin.btn_qr_scanner': 'MÁY QUÉT QR',

    'checkin.status_finalized': 'ĐÃ CHỐT SỔ ĐIỂM DANH',
    'checkin.status_live': 'PHIÊN ĐIỂM DANH ĐANG DIỄN RA',
    'checkin.cat_workshop': 'Workshop chuyên đề',
    'checkin.cat_teambuilding': 'Teambuilding',
    'checkin.cat_external': 'Sự kiện ĐHQG',
    'checkin.cat_meeting': 'Sinh hoạt định kỳ CLB',
    'checkin.required_badge': 'Bắt buộc tham gia',
    'checkin.optional_badge': 'Mở đăng ký',
    'checkin.registered_badge': 'Đã đăng ký trước',
    'checkin.switch_session': 'Đổi phiên:',
    'checkin.create_event': 'Tạo sự kiện mới',

    'checkin.pin_title': 'Mã PIN máy chiếu',
    'checkin.pin_copy_title': 'Sao chép mã PIN',
    'checkin.mobile_portal': 'Cổng Mobile',
    'checkin.copy_zalo': 'Copy link Zalo',
    'checkin.copied': 'Đã copy!',

    'checkin.card_on_time': 'Đúng giờ (C07)',
    'checkin.card_on_time_pts': '+1 điểm / TV',
    'checkin.card_on_time_desc': 'Đến trước hoặc đúng giờ',
    'checkin.card_late': 'Đi muộn (T04)',
    'checkin.card_late_pts': '-1 điểm / TV',
    'checkin.card_late_desc': 'Muộn trên 15 phút',
    'checkin.card_excused': 'Có phép (T01)',
    'checkin.card_excused_pts': '-2 điểm / TV',
    'checkin.card_excused_desc': 'Gửi đơn trước >12h',
    'checkin.card_unexcused': 'Không phép (T02)',
    'checkin.card_unexcused_pts': '-5 điểm / TV',
    'checkin.card_unexcused_desc': 'Báo động kỷ luật',

    'checkin.search_placeholder': 'Tìm thành viên, MSSV...',
    'checkin.dept_all': 'Tất cả các ban',
    'checkin.status_all': 'Mọi trạng thái',
    'checkin.export_csv': 'Xuất CSV',
    'checkin.btn_finalized': 'Đã chốt sổ điểm',
    'checkin.btn_finalizing': 'Đang xử lý...',
    'checkin.btn_finalize': 'Chốt buổi họp & Áp dụng điểm (Quyền BCN)',
    'checkin.btn_finalize_bcn_only': 'Chốt buổi (Chỉ BCN)',

    'checkin.th_stt': 'STT',
    'checkin.th_member': 'Thành viên',
    'checkin.th_dept': 'Ban',
    'checkin.th_time': 'Giờ Check-in',
    'checkin.th_status': 'Trạng thái điểm danh',
    'checkin.th_actions': 'Thao tác nhanh 1 chạm',
    'checkin.th_note': 'Ghi chú',

    'checkin.badge_reg': 'Đã ĐK',
    'checkin.badge_unreg': 'Chưa ĐK',
    'checkin.not_checked_in': 'Chưa điểm danh',
    'checkin.status_on_time': 'Đúng giờ',
    'checkin.status_late': 'Đi muộn',
    'checkin.status_excused': 'Có phép',
    'checkin.status_unexcused': 'Không phép',
    'checkin.btn_ontime': 'Đúng giờ',
    'checkin.btn_late': 'Muộn',
    'checkin.btn_excused': 'Phép',
    'checkin.btn_unexcused': 'Vắng',
    'checkin.note_placeholder': 'Ghi chú lý do...',
    'checkin.no_members': 'Không tìm thấy thành viên nào phù hợp với bộ lọc',
    'checkin.reset_filter': 'Xóa bộ lọc tìm kiếm',

    // History View
    'history.title': 'Nhật ký đóng góp iSSACer',
    'history.rule_badge': 'Quy chế Q06',
    'history.subtitle': 'Ghi lại toàn bộ quá trình hoạt động và đóng góp của iSSACer.',
    'history.mascot_tooltip': 'Bấm vào tớ để nghe lời nhắc sổ điểm nhé!',
    'history.btn_dispute': 'Gửi khiếu nại (Q06)',
    'history.btn_score': 'Chấm / Duyệt điểm',
    'history.btn_propose': 'Đề xuất điểm (HR)',
    'history.btn_export': 'Xuất file (.CSV)',
    'history.kpi_total': 'Tổng số bản ghi',
    'history.kpi_total_desc': 'Dữ liệu sổ cái minh bạch 100%',
    'history.kpi_bonus': 'Lượt cộng điểm',
    'history.kpi_bonus_desc': 'Khen thưởng & cống hiến CLB',
    'history.kpi_penalty': 'Lượt trừ điểm',
    'history.kpi_penalty_desc': 'Kỷ luật chuyên cần & sự kiện',
    'history.kpi_disputes': 'Khiếu nại Q06',
    'history.kpi_disputes_desc': 'Thời hạn xử lý tối đa 7 ngày',
    'history.tab_all': 'Tất cả',
    'history.tab_add': 'Điểm cộng',
    'history.tab_deduct': 'Điểm trừ',
    'history.tab_disputes': 'Khiếu nại Q06',
    'history.status_locked': 'Đã khóa sổ',
    'history.status_open': 'Đang mở chấm điểm',
    'history.search_placeholder': 'Tìm theo tên thành viên, MSSV, mã tiêu chí, người chấm...',
    'history.dept_all': 'Tất cả các ban',
    'history.records_per_page': 'bản ghi/trang',
    'history.all_records': 'Tất cả',
    'history.th_time': 'Thời gian',
    'history.th_member': 'Thành viên',
    'history.th_code': 'Mã',
    'history.th_content': 'Nội dung',
    'history.th_points': 'Điểm',
    'history.th_type': 'Loại',
    'history.th_scorer': 'Người chấm',
    'history.th_action': 'Thao tác',
    'history.no_data': 'Không tìm thấy bản ghi lịch sử điểm nào phù hợp',
    'history.edit_score': 'Sửa điểm',
    'history.delete_score': 'Xóa',
  },

  en: {
    // Nav & Sidebar
    'nav.overview': 'OVERVIEW',
    'nav.dashboard': 'Dashboard',
    'nav.leaderboard_section': 'LEADERBOARD',
    'nav.leaderboard': 'Leaderboard',
    'nav.management': 'MEMBER MANAGEMENT',
    'nav.members': 'Member Roster',
    'nav.core_survey': 'Core Team Survey',
    'nav.schedule': 'Activity Schedule',
    'nav.checkin': 'Event Check-in',
    'nav.history': 'History & Approvals',
    'nav.rules': 'Rules & Scoring Scale',
    'nav.accounts': 'User Accounts',
    'nav.settings': 'System Settings',
    'nav.live': 'LIVE',
    'nav.theme': 'Theme',
    'nav.version': 'Version',

    // Header
    'header.search_placeholder': 'Search members, student ID, department...',
    'header.home': 'Home',
    'header.news': 'News',
    'header.student_id': 'Student ID',
    'header.department': 'Department',
    'header.logout': 'Sign Out',
    'header.role_title': 'Role',

    // Dashboard View
    'dashboard.title': "iSSACer's Activity Score Dashboard",
    'dashboard.subtitle': 'Comprehensive summary of attendance and contribution levels of iSSAC members.',
    'dashboard.view_leaderboard': 'View Leaderboard',
    'dashboard.export_report': 'Export Report',
    'dashboard.mascot_tooltip': 'Active iSSAC Mascot welcomes you!',
    'dashboard.event_live': 'Live In Progress',
    'dashboard.open_checkin': 'Open Check-in Roster',

    // 8 KPI cards
    'dashboard.kpi_total_members': 'Total Members',
    'dashboard.kpi_approved_month': 'Approved this Month',
    'dashboard.kpi_pending': 'Pending Approvals',
    'dashboard.kpi_avg_attendance': 'Avg Attendance Rate',
    'dashboard.kpi_bonus_awarded': 'Bonus Points Awarded',
    'dashboard.kpi_penalty_deducted': 'Penalties Deducted',
    'dashboard.kpi_penalty_attendance': 'Attendance Penalties',
    'dashboard.kpi_avg_score': 'Avg Activity Score',
    'dashboard.view_list': 'View roster',
    'dashboard.view_history': 'View history',
    'dashboard.approve_now': 'Review now',
    'dashboard.dept_details': 'Dept breakdown',
    'dashboard.view_details': 'View details',

    // Lower columns
    'dashboard.top5_title': 'iSSACer Contribution Leaderboard (Top 5)',
    'dashboard.top5_desc': 'Outstanding individuals leading the club campaign',
    'dashboard.view_all_count': 'View all 48',
    'dashboard.open_full_leaderboard': 'Open Full Leaderboard & Top 3 Podium',
    'dashboard.very_active': 'Highly Active',
    'dashboard.active': 'Active',
    'dashboard.dept_dist_title': 'Member Distribution by Department',
    'dashboard.dept_dist_desc': 'Personnel structure and average scores by affiliated department',
    'dashboard.dept_consulting': 'Advisory Dept',
    'dashboard.dept_media': 'Communications Dept',
    'dashboard.dept_hr': 'HR Department',
    'dashboard.dept_bcn': 'Executive Board',
    'dashboard.members_count': 'members',
    'dashboard.club_share': 'of Club',
    'dashboard.avg_score_label': 'Avg Score',
    'dashboard.box_top15': 'TOP 15 EXCELLENT',
    'dashboard.box_qualified': 'CLUB STANDARD',
    'dashboard.box_warning': 'WARNING / AT RISK',

    // Comparison Chart
    'chart.title': 'Emulation & Performance Comparison',
    'chart.subtitle': 'Visual benchmark of scores, engagement levels, and attendance rates across 4 departments',
    'chart.mode_dept_score': 'Department Average Scores',
    'chart.mode_plus_vs_minus': 'Bonus vs Penalty',
    'chart.mode_monthly_trend': '3-Month Trend',
    'chart.period_label': 'Period:',
    'chart.current_period_badge': 'SELECTED: PERIOD 1',
    'chart.sort_default': 'Default Order',
    'chart.sort_highest': 'Highest Score',
    'chart.sort_lowest': 'Lowest Score',
    'chart.sort_attendance': 'Highest Attendance',
    'chart.target_label': 'Club Goal Target',
    'chart.club_avg_label': 'Club Average Score',
    'chart.baseline_label': 'Minimum Baseline',
    'chart.scale_label': 'Score Scale',
    'chart.scale_standard': 'Standard Scale',
    'chart.target_80': 'Target 80pts',
    'chart.dept_details_heading': 'Department Details',
    'chart.quick_compare_heading': 'Quick Comparison',
    'chart.quick_compare_desc': 'Emulation scores and attendance rates across departments',
    'chart.col_dept': 'Department',
    'chart.col_avg_score': 'Avg Score',
    'chart.col_vs_prev': 'vs Prev Period',
    'chart.col_attendance': 'Attendance Rate',
    'chart.rank_1': 'Leading Dept',
    'chart.rank_2': '2nd Place',
    'chart.rank_3': '3rd Place',
    'chart.rank_4': '4th Place',
    'chart.attendance_rate_label': 'Attendance Rate',
    'chart.bonus_rules_tag': 'Emulation Bonus (C01-C09)',
    'chart.penalty_rules_tag': 'Disciplinary Penalty (T01-T13)',
    'chart.compliance_rate': 'Club-wide Compliance: 93.4%',
    'chart.net_received': 'Net Points',
    'chart.bonus_label': 'Bonus',
    'chart.penalty_label': 'Penalty',
    'chart.month_club_avg': 'Club Average Score',
    'chart.attendance_short': 'Attendance',
    'chart.total_bonus': 'Total Bonus',
    'chart.growth_summary': 'Summary: The entire Club maintained continuous growth in attendance and activity scores over 3 months (+6.2 accumulated points).',
    'chart.term_tag': 'Term 2025 - 2026',
    'chart.new_cycle_note': 'New cycle initialized - 60pts starting line (no bonus/penalty recorded yet)',
    'chart.term_period_note': 'Period 1 (2025 - 2026)',

    // Checkin View
    'checkin.title': 'iSSAC Event Attendance Management',
    'checkin.subtitle': 'Real-time attendance & diligence tracking system',
    'checkin.mascot_tooltip': 'Click me for event reminders!',
    'checkin.tab_roster': 'Roster',
    'checkin.tab_tickets': 'Tickets',
    'checkin.tab_kiosk': 'Kiosk Portal',
    'checkin.tab_history': 'History',
    'checkin.btn_qr_scanner': 'QR SCANNER',

    'checkin.status_finalized': 'ATTENDANCE CLOSED',
    'checkin.status_live': 'ATTENDANCE IN PROGRESS',
    'checkin.cat_workshop': 'Topic Workshop',
    'checkin.cat_teambuilding': 'Teambuilding',
    'checkin.cat_external': 'VNU Event',
    'checkin.cat_meeting': 'Regular Club Meeting',
    'checkin.required_badge': 'Mandatory Attendance',
    'checkin.optional_badge': 'Registration Open',
    'checkin.registered_badge': 'Pre-registered',
    'checkin.switch_session': 'Session:',
    'checkin.create_event': 'Create New Event',

    'checkin.pin_title': 'Projector PIN',
    'checkin.pin_copy_title': 'Copy PIN',
    'checkin.mobile_portal': 'Mobile Portal',
    'checkin.copy_zalo': 'Copy Zalo link',
    'checkin.copied': 'Copied!',

    'checkin.card_on_time': 'On Time (C07)',
    'checkin.card_on_time_pts': '+1 pt / member',
    'checkin.card_on_time_desc': 'Arrive on or before time',
    'checkin.card_late': 'Late (T04)',
    'checkin.card_late_pts': '-1 pt / member',
    'checkin.card_late_desc': 'Late over 15 minutes',
    'checkin.card_excused': 'Excused (T01)',
    'checkin.card_excused_pts': '-2 pts / member',
    'checkin.card_excused_desc': 'Notice sent >12h prior',
    'checkin.card_unexcused': 'Unexcused (T02)',
    'checkin.card_unexcused_pts': '-5 pts / member',
    'checkin.card_unexcused_desc': 'Disciplinary alert',

    'checkin.search_placeholder': 'Search member, student ID...',
    'checkin.dept_all': 'All departments',
    'checkin.status_all': 'All statuses',
    'checkin.export_csv': 'Export CSV',
    'checkin.btn_finalized': 'Attendance Closed',
    'checkin.btn_finalizing': 'Processing...',
    'checkin.btn_finalize': 'Finalize Meeting & Apply Scores (BCN)',
    'checkin.btn_finalize_bcn_only': 'Finalize (BCN Only)',

    'checkin.th_stt': 'NO.',
    'checkin.th_member': 'Member',
    'checkin.th_dept': 'Department',
    'checkin.th_time': 'Check-in Time',
    'checkin.th_status': 'Attendance Status',
    'checkin.th_actions': 'Quick 1-Touch Action',
    'checkin.th_note': 'Notes',

    'checkin.badge_reg': 'Registered',
    'checkin.badge_unreg': 'Not registered',
    'checkin.not_checked_in': 'Not checked in',
    'checkin.status_on_time': 'On time',
    'checkin.status_late': 'Late',
    'checkin.status_excused': 'Excused',
    'checkin.status_unexcused': 'Unexcused',
    'checkin.btn_ontime': 'On Time',
    'checkin.btn_late': 'Late',
    'checkin.btn_excused': 'Excused',
    'checkin.btn_unexcused': 'Absent',
    'checkin.note_placeholder': 'Reason / notes...',
    'checkin.no_members': 'No members found matching filter',
    'checkin.reset_filter': 'Clear search filter',

    // History View
    'history.title': "iSSACer's Contribution Log",
    'history.rule_badge': 'Rule Q06',
    'history.subtitle': 'Recording the entire journey of activities and contributions of iSSACers.',
    'history.mascot_tooltip': 'Click me to view score ledger tips!',
    'history.btn_dispute': 'Submit Appeal (Q06)',
    'history.btn_score': 'Score / Approve Points',
    'history.btn_propose': 'Propose Score (HR)',
    'history.btn_export': 'Export (.CSV)',
    'history.kpi_total': 'Total Records',
    'history.kpi_total_desc': '100% transparent ledger records',
    'history.kpi_bonus': 'Bonus Logs',
    'history.kpi_bonus_desc': 'Awards & club contributions',
    'history.kpi_penalty': 'Penalty Logs',
    'history.kpi_penalty_desc': 'Discipline, attendance & events',
    'history.kpi_disputes': 'Appeals (Q06)',
    'history.kpi_disputes_desc': 'Resolution within 7 working days',
    'history.tab_all': 'All',
    'history.tab_add': 'Bonus',
    'history.tab_deduct': 'Penalties',
    'history.tab_disputes': 'Appeals (Q06)',
    'history.status_locked': 'Ledger Locked',
    'history.status_open': 'Scoring Open',
    'history.search_placeholder': 'Search by member, student ID, rule code, scorer...',
    'history.dept_all': 'All departments',
    'history.records_per_page': 'records/page',
    'history.all_records': 'All',
    'history.th_time': 'Time',
    'history.th_member': 'Member',
    'history.th_code': 'Code',
    'history.th_content': 'Content',
    'history.th_points': 'Points',
    'history.th_type': 'Type',
    'history.th_scorer': 'Scorer',
    'history.th_action': 'Actions',
    'history.no_data': 'No matching score records found',
    'history.edit_score': 'Edit Score',
    'history.delete_score': 'Delete',
  },
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'vi',
  setLanguage: () => {},
  t: (key: string, defaultText?: string) => defaultText || key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('issac_language') as Language | null
      if (saved === 'vi' || saved === 'en') {
        setLanguageState(saved)
      }
    } catch {
      // ignore localStorage errors in SSR / restricted iframe
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('issac_language', lang)
    } catch {
      // ignore
    }
  }

  const t = (key: string, defaultText?: string): string => {
    const dict = translations[language]
    if (dict && dict[key]) {
      return dict[key]
    }
    const fallbackDict = translations.vi
    if (fallbackDict && fallbackDict[key]) {
      return fallbackDict[key]
    }
    return defaultText || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
