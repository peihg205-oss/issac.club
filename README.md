# iSSAC_Web — Hệ Thống Quản Lý Hoạt Động & Điểm Đánh Giá CLB iSSAC

Hệ thống quản lý điểm hoạt động, hồ sơ 48 thành viên, điểm danh sự kiện QR/PIN và xếp hạng tự động dành cho **Câu Lạc bộ Đại sứ sinh viên Trường Quốc tế — ĐHQGHN (iSSAC)**.

---

## 🚀 Tính Năng Chính & Luồng Nghiệp Vụ

1. **Động cơ tính điểm chuẩn quy chế iSSAC (Scoring Engine)**:
   - Điểm gốc khởi điểm: **60 điểm** (chu kỳ tháng).
   - Điểm tối đa: **100 điểm**, điểm tối thiểu: **0 điểm**.
   - **Hệ số Core Team (×2)**: Tự động nhân đôi mọi mức điểm TRỪ (T01–T13) đối với thành viên Core Team/BCN. Điểm cộng giữ nguyên 1x.
   - **Trần tương tác (P04)**: Tối đa 15 điểm/tháng cho nhóm tương tác (C01, C02, C03).
   - **Cơ chế Cảnh cáo Q04 (T03)**: Trừ phần chênh lệch để bảo đảm tổng mức trừ vụ việc tối đa là -10đ (hoặc -20đ Core).

2. **Cơ chế Điểm danh & Tạo Sự Kiện Khép Kín**:
   - Khởi tạo sự kiện / phiên họp trực tiếp ngay tại tab Điểm danh (`CheckinView`) hoặc Cài đặt.
   - **Mã PIN 4 số** ngẫu nhiên trên màn hình lớn máy chiếu + **Mã QR Live Scanner**.
   - **Cơ chế chống điểm danh hộ**: Xác thực 4 số cuối số điện thoại cá nhân đã đăng ký trong hồ sơ CLB.
   - **Chốt sổ & Áp điểm (Quyền BCN)**:
     - Buổi họp bắt buộc: Đúng giờ (+1 C07), Đi muộn (-1 T04), Có phép (-2 T01), Vắng không phép (-5 T02 và cộng 1 strike T02).
     - Workshop/Teambuilding tự chọn: Người tham dự nhận điểm thưởng (+2đ), người không tham gia KHÔNG bị trừ điểm và không bị tính vắng.

3. **Phân Quyền 4 Cấp (Role-Based Access Control)**:
   - 👑 **Ban Chủ nhiệm (BCN / Admin)**: Toàn quyền phê duyệt điểm trực tiếp, khóa sổ chu kỳ, chốt điểm danh, cấp/khóa tài khoản Ban, giải quyết khiếu nại.
   - 📋 **Ban Nhân sự (HR)**: Đề xuất điểm cho tất cả thành viên 4 Ban (chờ BCN duyệt), khởi tạo sự kiện, quét mã QR/điểm danh Kiosk.
   - 💼 **Trưởng Ban chuyên môn (Dept Head)**: Đề xuất điểm cho thành viên trực thuộc Ban mình phụ trách, theo dõi tiến độ nhiệm vụ.
   - 👤 **Thành viên CLB (Member)**: Tự điểm danh, tra cứu điểm cá nhân, quét mã vé QR, đăng ký tham gia sự kiện mở, gửi khiếu nại minh chứng.

---

## 🛠️ Hướng Dẫn Triển Khai Thực Tế (Live Deployment Guide)

Hệ thống được thiết kế tối ưu để chạy trên **Supabase (Cơ sở dữ liệu PostgreSQL)** và **Vercel (Hosting Web App)** hoàn toàn miễn phí.

### BƯỚC 1: Khởi Tạo Dự Án & Nạp SQL Trên Supabase

1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập (bằng tài khoản GitHub hoặc Google).
2. Nhấn **"New Project"**:
   - **Name**: `issac-web` (hoặc tên tùy chọn).
   - **Database Password**: Đặt mật khẩu an toàn và lưu lại.
   - **Region**: Chọn `Singapore (ap-southeast-1)` để có tốc độ truy cập nhanh nhất tại Việt Nam.
   - Nhấn **"Create new project"** và đợi 1-2 phút để Supabase chuẩn bị cơ sở dữ liệu.
3. Nạp cấu trúc bảng và dữ liệu mẫu:
   - Ở thanh điều hướng bên trái Supabase, nhấn vào biểu tượng **SQL Editor** (icon `>_`).
   - Nhấn **"New query"**.
   - Mở file [supabase/full_schema_and_seed.sql](supabase/full_schema_and_seed.sql) trong thư mục dự án này, copy toàn bộ nội dung và dán vào ô soạn thảo SQL Editor.
   - Nhấn nút **"Run"** (hoặc phím tắt `Ctrl + Enter` / `Cmd + Enter`).
   - Thông báo `Success. No rows returned` xuất hiện: Toàn bộ bảng, hàm tính điểm, trigger chống sửa điểm, chính sách bảo mật RLS và danh sách 48 thành viên CLB iSSAC đã được khởi tạo hoàn tất!
4. Lấy thông tin kết nối (API Keys):
   - Nhấn vào biểu tượng **Project Settings** (bánh răng ở góc dưới bên trái).
   - Chọn mục **Data API** (hoặc **API**):
     - Copy **Project URL** (`https://xxxxxxxxxxxx.supabase.co`).
     - Copy **anon public key** (`eyJhbGciOiJIUzI1Ni...`).
     - Copy **service_role secret key** (nhấn Reveal để xem và copy).

---

### BƯỚC 2: Đẩy Code Lên GitHub

1. Khởi tạo Git repo và commit toàn bộ dự án:
   ```bash
   git init
   git add .
   git commit -m "feat: complete iSSAC Web system for production deployment"
   ```
2. Tạo một repository mới trên GitHub (ví dụ: `issac-web` ở chế độ Private hoặc Public).
3. Liên kết và đẩy code lên:
   ```bash
   git remote add origin https://github.com/<tai-khoan-github-cua-ban>/issac-web.git
   git branch -M main
   git push -u origin main
   ```

---

### BƯỚC 3: Triển Khai (Deploy) Trực Tiếp Qua Vercel.app

1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
2. Nhấn nút **"Add New..."** -> Chọn **"Project"**.
3. Tại danh sách GitHub Repositories, tìm dự án `issac-web` và nhấn **"Import"**.
4. Cấu hình biến môi trường (**Environment Variables**):
   - Mở rộng mục **Environment Variables** và thêm các biến sau (lấy từ Bước 1 trên Supabase):
     - `NEXT_PUBLIC_SUPABASE_URL`: `<URL Supabase của bạn>`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `<Anon Key của bạn>`
     - `SUPABASE_SERVICE_ROLE_KEY`: `<Service Role Key của bạn>`
     - `NEXT_PUBLIC_APP_URL`: Để trống hoặc điền tạm tên miền sau khi deploy (vd: `https://issac-web.vercel.app`)
     - `NEXT_PUBLIC_APP_NAME`: `iSSAC_Web`
5. Nhấn **"Deploy"**!
6. Vercel sẽ tự động build Next.js App Router (sử dụng Turbopack) trong khoảng 1 phút.
7. Sau khi hoàn thành, bạn sẽ nhận được đường link website chính thức dạng:
   👉 **`https://issac-web.vercel.app`** (hoặc tên miền tùy chỉnh của CLB).

---

## 🔒 Tài Khoản Đăng Nhập Mặc Định

| Họ tên | Vai trò | MSSV / Email | Mật khẩu mặc định |
| :--- | :--- | :--- | :--- |
| **Ban Chủ nhiệm CLB** | BCN (Chủ nhiệm) | `STAFF-001` / `ambassadors.club@vnuis.edu.vn` | `ISSAC2026@tuyenquan` |
| **Giang Lê Hiệp** | BCN (Phó chủ nhiệm) | `23070691` / `23070691@vnu.edu.vn` | `issac2025` |
| **Vũ Thị Minh Ngọc** | HR (Trưởng Ban Nhân sự) | `23070764` / `23070764@vnu.edu.vn` | `ISSAC2026@ngoc` |
| **Trần Đức Thắng** | Dept Head (Trưởng Ban TT) | `24310088` / `24310088@vnu.edu.vn` | `ISSAC2026@thang` |
| **Nguyễn Ngọc Anh** | Dept Head (Phó Ban Tư vấn) | `24070622` / `24070622@vnu.edu.vn` | `ISSAC2026@tuvan` |
