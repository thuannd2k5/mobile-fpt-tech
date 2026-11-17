# FPT Education Mobile App (`mobile_tech`)

Ứng dụng di động đa nền tảng (iOS / Android) dành cho Hệ sinh thái Đào tạo Công nghệ FPT, được xây dựng hoàn toàn bằng **React Native (Expo Managed Workflow)**, **Expo Router**, **NativeWind (Tailwind CSS)** và **Redux Toolkit**.

---

## 📱 CÔNG NGHỆ & TÍNH NĂNG ĐÃ TRIỂN KHAI

* **Expo SDK 58** & **Expo Router v4/v5** (File-based Routing phân theo vai trò `(auth)`, `(student)`, `(teacher)`, `(consultant)`, `(common)`).
* **NativeWind v4** (Tailwind CSS cho mobile với bảng màu chuẩn nhận diện thương hiệu FPT `#F26522`, `#0050B3`).
* **Hệ thống Quản lý Trạng thái**: Redux Toolkit (`accountSlice` đồng bộ token, role, permissions từ NestJS backend).
* **Tương thích Backend 100% không cần sửa server**:
  * Tự động bóc tách cookie và lưu trữ an toàn trong `expo-secure-store`.
  * Tự động đính kèm header `Cookie: refresh_token=...` khi gọi `/auth/refresh` và retry request với mutex chống race-condition.
* **Các phân hệ hoàn chỉnh**:
  1. **Xác thực (Auth)**: Splash auto-login, Đăng nhập, Đăng ký học viên.
  2. **Học viên (Student)**: Dashboard tổng quan, Khám phá khóa học & Chi tiết lớp học, Đăng ký ghi danh, Thời khóa biểu dạng thanh trượt ngày/tuần, Quản lý hóa đơn & QR code nộp học phí VietQR, Hồ sơ cá nhân.
  3. **Giảng viên (Teacher)**: Lịch dạy hàng tuần, Quản lý lớp học phụ trách, Danh sách học viên có nút gọi điện/gửi email trực tiếp.
  4. **Tư vấn viên (Consultant)**: Hộp thư tiếp nhận khách hàng (Leads CRM), lọc trạng thái tư vấn, cập nhật ghi chú và gọi điện trực tiếp.
  5. **Hệ thống chung (Common)**: Đổi mật khẩu bảo mật, Hộp thư tin nhắn và phòng chat trao đổi.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY TRÊN IPHONE QUA EXPO GO

### Bước 1: Kết nối cùng mạng Wi-Fi
* Đảm bảo iPhone và máy tính của bạn đang kết nối vào **cùng một mạng Wi-Fi**.

### Bước 2: Kiểm tra cấu hình IP LAN
* Mở tệp `.env` bên trong thư mục `mobile_tech`:
  ```env
  EXPO_PUBLIC_BACKEND_URL=http://<IP_LAN_MAY_TINH>:8000/api/v1
  ```
  *(Ví dụ IP máy tính hiện tại: `http://192.168.1.7:8000/api/v1`)*

### Bước 3: Khởi động Backend NestJS
* Mở terminal tại thư mục `backend-tech-fpt`:
  ```bash
  npm run start:dev
  ```
  *(Đảm bảo cổng 8000 được phép đi qua Windows Firewall).*

### Bước 4: Khởi động Ứng dụng Expo
* Mở terminal tại thư mục `mobile_tech`:
  ```bash
  npx expo start -c
  ```
* Mở ứng dụng **Camera** trên iPhone hoặc ứng dụng **Expo Go** trên App Store, quét mã QR hiển thị trên màn hình terminal để bắt đầu trải nghiệm ứng dụng!
