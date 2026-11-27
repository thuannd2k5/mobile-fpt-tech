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

## Cấu hình tài khoản nhận học phí

Ứng dụng không có sẵn tài khoản ngân hàng nhận học phí. Khi chưa được cấu hình đầy đủ, màn hình hóa đơn hướng dẫn học viên liên hệ phòng đào tạo.

Chỉ thêm các biến sau vào `.env` sau khi xác nhận thông tin nhận tiền với đơn vị đào tạo:

```env
EXPO_PUBLIC_PAYMENT_BANK_ID=<ma_BIN_ngan_hang>
EXPO_PUBLIC_PAYMENT_BANK_NAME=<ten_ngan_hang>
EXPO_PUBLIC_PAYMENT_ACCOUNT_NUMBER=<so_tai_khoan>
EXPO_PUBLIC_PAYMENT_ACCOUNT_NAME=<ten_chu_tai_khoan>
```

Đây là thông tin công khai được đưa vào ứng dụng; không đặt thông tin đăng nhập ngân hàng tại đây. Khởi động lại Expo sau khi đổi cấu hình. QR chỉ hỗ trợ điền thông tin chuyển khoản; trạng thái hóa đơn lấy từ backend, không tự đổi khi đóng hướng dẫn.

## Giới hạn lịch học

Backend hiện trả khung giờ lớp (`start_time`, `end_time`), chưa có thứ học hoặc ngày của từng buổi. Màn hình học viên hiển thị các lớp đã ghi danh và khung giờ của lớp, không suy diễn lịch từng buổi. Giảng viên quản lý lịch rảnh riêng trong tab Lịch rảnh.

## Không gian theo vai trò

| Vai trò backend | Giao diện và chức năng chính |
| --- | --- |
| SUPER ADMIN | Quản trị tài khoản, vai trò, quyền và danh mục theo quyền được cấp |
| MANAGER | Điều hành đào tạo, quản lý/tạo lớp, duyệt hồ sơ giảng viên |
| TEACHER | Lớp được phân công, lịch rảnh cá nhân, học viên của lớp phụ trách |
| STUDENT | Lớp đã ghi danh, khóa học, học phí và thông tin cá nhân |
| NORMAL USER | Khám phá khóa học, ghi danh lần đầu, đăng ký tư vấn |
| CONSULTANT | Hộp tư vấn, thông tin liên hệ, tạo yêu cầu và cập nhật theo quyền |
| ACCOUNTANT / KETOAN | Hóa đơn, công nợ và phiếu thu theo quyền thực tế |

`ACCOUNTANT` và `KETOAN` dùng chung không gian kế toán. Ứng dụng không gộp bản ghi vai trò hoặc tự cấp thêm quyền trên backend. Các thao tác tạo/sửa/xóa cần đúng quyền API được trả về trong tài khoản; vai trò chưa được hỗ trợ có màn hình thông báo và nút đăng xuất.

Sau lần ghi danh đầu tiên, ứng dụng tải lại tài khoản để chuyển từ không gian khám phá sang học viên theo vai trò backend trả về. Mỗi không gian có điều hướng riêng; phần tài khoản cá nhân và các thành phần nhận diện FPT được dùng chung.

## Kiểm tra mobile

```bash
npm test
npm run typecheck
npm run lint
npx expo export --platform all
```

## Khi iPhone không mở được Expo Go

1. Giữ terminal Expo đang chạy và kết nối iPhone cùng Wi-Fi với máy tính.
2. Trên Safari của iPhone, mở `http://<IP_LAN_MAY_TINH>:8081/status`. Kết quả đúng là `packager-status:running`. Nếu không mở được, cần xử lý mạng LAN/Firewall hoặc quyền Mạng cục bộ của Expo Go trong Cài đặt iPhone trước.
3. Đăng nhập cùng tài khoản Expo trên CLI (`npx expo login`) và trong Expo Go. Cập nhật Expo Go từ App Store để hỗ trợ SDK 58.
4. Sau khi cập nhật dependencies, dừng Metro cũ bằng Ctrl+C rồi chạy lại `npx expo start --go --clear` và quét QR mới.
5. Nếu mạng không cho phép kết nối LAN, có thể thử `npx expo start --go --tunnel --clear`. Expo có thể yêu cầu cài `@expo/ngrok` lần đầu. Tunnel này chỉ phục vụ Metro, không tự mở kết nối backend ở cổng 8000.

Không tắt toàn bộ Windows Firewall để chạy Expo. Nếu mở ngoại lệ mạng, chỉ cấp quyền cần thiết cho Node.js và các cổng phát triển đang dùng trên mạng tin cậy.
