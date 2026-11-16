# BẢN ĐẶC TẢ KIẾN TRÚC & KẾ HOẠCH TRIỂN KHAI TOÀN DIỆN MOBILE APP (FPT EDUCATION)
> **Mã dự án**: `mobile_tech`  
> **Nền tảng**: React Native (Expo Managed Workflow) - Chạy tối ưu trên Expo Go (iPhone/iOS & Android)  
> **Nguyên tắc bất biến**: **TUYỆT ĐỐI KHÔNG CHỈNH SỬA CODE** tại `backend-tech-fpt` và `frontend_fpt_tech`. Mọi tương thích, mapping dữ liệu và kết nối đều được xử lý 100% bên trong thư mục `mobile_tech`.

---

## MỤC LỤC TỔNG QUAN
1. [I. TỔNG QUAN HỆ THỐNG & NGUYÊN TẮC BẤT BIẾN](#i-tổng-quan-hệ-thống--nguyên-tắc-bất-biến)
2. [II. BẢNG SO SÁNH & CHUYỂN ĐỔI GIAO DIỆN TỪ WEB SANG MOBILE](#ii-bảng-so-sánh--chuyển-đổi-giao-diện-từ-web-sang-mobile)
3. [III. KIẾN TRÚC KỸ THUẬT & GIẢI PHÁP TƯƠNG THÍCH BACKEND](#iii-kiến-trúc-kỹ-thuật--giải-pháp-tương-thích-backend)
4. [IV. BẢN ĐỒ PHÂN QUYỀN & CẤU TRÚC ĐIỀU HƯỚNG (ROLE-BASED ROUTING)](#iv-bản-đồ-phân-quyền--cấu-trúc-điều-hướng-role-based-routing)
5. [V. ĐẶC TẢ 10 LUỒNG NGHIỆP VỤ CỐT LÕI (END-TO-END FLOWS)](#v-đặc-tả-10-luồng-nghiệp-vụ-cốt-lõi-end-to-end-flows)
6. [VI. KẾ HOẠCH CHIA NHỎ THEO PROMPTS TRIỂN KHAI (PROMPT-DRIVEN ROADMAP)](#vi-kế-hoạch-chia-nhỏ-theo-prompts-triển-khai-prompt-driven-roadmap)
   * [Prompt 01: Khởi tạo Project Expo, Expo Router, NativeWind & Cấu hình môi trường](#prompt-01-khởi-tạo-project-expo-expo-router-nativewind--cấu-hình-môi-trường)
   * [Prompt 02: Đồng bộ Type System & Design System FPT Tech Tokens](#prompt-02-đồng-bộ-type-system--design-system-fpt-tech-tokens)
   * [Prompt 03: Thiết lập Network Layer (Axios Interceptors, Cookie Header cho Refresh Token & LAN IP)](#prompt-03-thiết-lập-network-layer-axios-interceptors-cookie-header-cho-refresh-token--lan-ip)
   * [Prompt 04: Xây dựng Redux Toolkit Store & Account Slice đồng bộ](#prompt-04-xây-dựng-redux-toolkit-store--account-slice-đồng-bộ)
   * [Prompt 05: Xây dựng Bộ Thư Viện UI Components Chuẩn FPT Mobile](#prompt-05-xây-dựng-bộ-thư-viện-ui-components-chuẩn-fpt-mobile)
   * [Prompt 06: Phân hệ Xác thực (Splash, Đăng nhập & Đăng ký tài khoản)](#prompt-06-phân-hệ-xác-thực-splash-đăng-nhập--đăng-ký-tài-khoản)
   * [Prompt 07: Root Layout, Phân Luồng Định Tuyến Theo Vai Trò (Role Router & Bottom Tabs)](#prompt-07-root-layout-phân-luồng-định-tuyến-theo-vai-trò-role-router--bottom-tabs)
   * [Prompt 08: Học viên - Trang chủ (Dashboard) & Khám phá Khóa học (Courses List & Detail)](#prompt-08-học-viên---trang-chủ-dashboard--khám-phá-khóa-học-courses-list--detail)
   * [Prompt 09: Học viên - Lịch học (Schedule Timeline/Calendar) & Lớp học của tôi](#prompt-09-học-viên---lịch-học-schedule-timelinecalendar--lớp-học-của-tôi)
   * [Prompt 10: Học viên - Quản lý Học phí & Hóa đơn (Invoices & Payment History)](#prompt-10-học-viên---quản-lý-học-phí--hóa-đơn-invoices--payment-history)
   * [Prompt 11: Trang Cá Nhân (Profile), Đổi Mật Khẩu & Đăng Xuất (Dùng chung các Role)](#prompt-11-trang-cá-nhân-profile-đổi-mật-khẩu--đăng-xuất-dùng-chung-các-role)
   * [Prompt 12: Giảng viên - Lịch dạy, Danh sách Lớp học & Danh sách Học viên](#prompt-12-giảng-viên---lịch-dạy-danh-sách-lớp-học--danh-sách-học-viên)
   * [Prompt 13: Tư vấn viên - Quản lý Khách hàng tiềm năng (Leads) & Đăng ký ghi danh](#prompt-13-tư-vấn-viên---quản-lý-khách-hàng-tiềm-năng-leads--đăng-ký-ghi-danh)
   * [Prompt 14: Phân hệ Tin nhắn / Trò chuyện (Chat & Conversations)](#prompt-14-phân-hệ-tin-nhắn--trò-chuyện-chat--conversations)
   * [Prompt 15: Kiểm thử hoàn thiện trên iPhone qua Expo Go, Safe Area & Tối ưu hiệu năng](#prompt-15-kiểm-thử-hoàn-thiện-trên-iphone-qua-expo-go-safe-area--tối-ưu-hiệu-năng)

---

## I. TỔNG QUAN HỆ THỐNG & NGUYÊN TẮC BẤT BIẾN

### 1. Hiện trạng hệ thống sẵn có
* **Backend (`backend-tech-fpt`)**: NestJS (REST API tại port 8000), MongoDB Atlas, xác thực JWT (Access token gửi qua Authorization Header; Refresh token lưu trong `HttpOnly` Cookie `refresh_token`), quản lý Role/Permission chặt chẽ.
* **Frontend Web (`frontend_fpt_tech`)**: React 18, Vite, Ant Design v5 (`antd`), Redux Toolkit, Axios. Chứa 6 cổng thông tin (Admin, Manager, Teacher, Student, Accountant, Consultant).
* **Ứng dụng Mobile (`mobile_tech`)**: Thư mục mới khởi tạo, hướng đến trải nghiệm native mượt mà trên iPhone/Android qua Expo Go.

### 2. Ba Nguyên Tắc Kỷ Luật Vàng (Golden Rules)
1. **Zero Impact on Backend & Web**:
   * Tuyệt đối không thêm, xóa, sửa bất kỳ dòng code, migration, endpoint hay cấu hình nào của `backend-tech-fpt` và `frontend_fpt_tech`.
   * Mọi sự khác biệt về cơ chế Cookie, LocalStorage, hiển thị dữ liệu đều phải thích nghi từ phía ứng dụng Mobile (`mobile_tech`).
2. **Design Language FPT Tech**:
   * Giữ màu sắc thương hiệu đặc trưng: Màu cam FPT (`#F26522` / `#FA541C`), Xanh Hải Quân (`#1D39C4` / `#0050B3`), Trắng (`#FFFFFF`), Xám nhẹ (`#F5F5F5`), Viền bo góc tròn mềm mại (`rounded-2xl`), Đổ bóng tinh tế (`shadow-sm` chuẩn iOS).
3. **Trải nghiệm Mobile-First & Đa nền tảng**:
   * Không sao chép máy móc giao diện dạng bảng nhiều cột của Web.
   * Tối ưu hóa cử chỉ vuốt chạm (Pull-to-refresh, Infinite scroll, Tap feedback, KeyboardAvoidingView, Safe Area cho tai thỏ và Dynamic Island).

---

## II. BẢNG SO SÁNH & CHUYỂN ĐỔI GIAO DIỆN TỪ WEB SANG MOBILE

| Thành phần trên Web (`frontend_fpt_tech`) | Giới hạn khi lên Mobile | Giải pháp chuyển đổi trên Mobile (`mobile_tech`) |
| :--- | :--- | :--- |
| **Bảng dữ liệu (Antd Table / ProTable)** | Màn hình 6 inch bị tràn ngang, chữ nhỏ, khó đọc 10–15 cột | Chuyển thành **Danh sách Thẻ (Card List / FlatList)** hiển thị các thông tin tóm tắt cốt lõi, có Badge trạng thái màu và nút mở rộng chi tiết. |
| **Drawer trượt ngang từ phải sang** | Chiếm hết màn hình hoặc gây khó vuốt back trên iOS | Chuyển thành **Bottom Sheet** (kéo từ đáy lên) hoặc **Modal toàn màn hình** theo phong cách iOS Navigation. |
| **Bảng thời khóa biểu dạng lưới (Grid)** | Khó cuộn ngang 7 ngày và nhiều ca học | Chuyển thành **Lịch ngày/tuần dạng thanh trượt (Horizontal Day Strip)** kết hợp danh sách ca học Timeline trực quan bên dưới. |
| **Hộp thoại xác nhận (Modal.confirm)** | Modal web thô, không theo chuẩn giao diện điện thoại | Sử dụng **`Alert.alert` native của iOS/Android** hoặc Custom Bottom Confirmation Sheet với haptic feedback. |
| **Thanh Menu bên trái (Sider)** | Không phù hợp với thao tác một tay | Chuyển thành **Bottom Tab Bar** (4-5 icon chính) kết hợp Trang cá nhân / Menu phụ. |
| **Quản trị Admin & Báo cáo Kế toán** | Thao tác nhập liệu nặng, xuất Excel hàng nghìn dòng | Giữ nghiệp vụ nặng trên Web; Mobile tập trung tối đa cho **Học viên**, **Giảng viên**, **Tư vấn viên** và Dashboard tóm tắt. |

---

## III. KIẾN TRÚC KỸ THUẬT & GIẢI PHÁP TƯƠNG THÍCH BACKEND

### 1. Xử lý "Cookie Refresh Token" trên React Native mà không sửa Backend
* **Vấn đề**: Backend NestJS dùng `request.cookies['refresh_token']` để cấp lại Access Token mới tại endpoint `/api/v1/auth/refresh`. Tuy nhiên, React Native không tự động gửi và lưu cookie như trình duyệt web.
* **Giải pháp trong `mobile_tech`**:
  * Khi người dùng đăng nhập thành công (`/api/v1/auth/login`), response header sẽ trả về `set-cookie: refresh_token=...;`.
  * Mobile Axios Interceptor sẽ bắt chuỗi cookie này, bóc tách giá trị `refresh_token` và lưu an toàn vào **`expo-secure-store`**.
  * Khi gọi API refresh token (`/api/v1/auth/refresh`), Axios Interceptor tự động đính kèm header:
    ```http
    Cookie: refresh_token=<giá_trị_đã_lưu>
    ```
  * Nhờ đó, middleware `cookie-parser` của NestJS vẫn đọc được cookie bình thường mà không cần sửa 1 dòng code backend nào.

### 2. Xử lý Kết nối mạng với Backend từ iPhone qua Expo Go
* Khi điện thoại iPhone chạy Expo Go, `localhost` trỏ về chính điện thoại, không trỏ về máy tính chạy NestJS.
* **Giải pháp**:
  * Cấu hình file `.env` với biến `EXPO_PUBLIC_BACKEND_URL=http://<IP_LAN_MAY_TINH>:8000/api/v1` (ví dụ: `http://192.168.1.15:8000/api/v1`).
  * Xây dựng cơ chế fallback thông minh: Tự động phát hiện nếu đang chạy trên thiết bị thật, máy ảo Android (`10.0.2.2:8000`) hay máy ảo iOS Simulator (`localhost:8000`).

---

## IV. BẢN ĐỒ PHÂN QUYỀN & CẤU TRÚC ĐIỀU HƯỚNG (ROLE-BASED ROUTING)

Hệ thống điều hướng dùng **Expo Router** với cấu trúc nhóm thư mục:

```text
mobile_tech/
├── app/
│   ├── _layout.tsx                     # Root Layout: Redux Provider, Font loader, Auth Guard
│   ├── (auth)/                         # Nhóm màn hình chưa đăng nhập
│   │   ├── _layout.tsx                 # Stack Navigation
│   │   ├── login.tsx                   # Đăng nhập
│   │   └── register.tsx                # Đăng ký
│   │
│   ├── (student)/                      # Dành cho role STUDENT & NORMAL USER
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx             # Bottom Tabs (Trang chủ, Khóa học, Lịch học, Học phí, Cá nhân)
│   │   │   ├── index.tsx               # Dashboard học viên
│   │   │   ├── courses.tsx             # Danh sách khóa học
│   │   │   ├── schedule.tsx            # Thời khóa biểu
│   │   │   ├── invoices.tsx            # Học phí & Hóa đơn
│   │   │   └── profile.tsx             # Tài khoản cá nhân
│   │   ├── course/[id].tsx             # Chi tiết khóa học & Đăng ký
│   │   └── class/[id].tsx              # Chi tiết lớp học
│   │
│   ├── (teacher)/                      # Dành cho role TEACHER
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx             # Bottom Tabs (Lịch dạy, Lớp học, Trò chuyện, Cá nhân)
│   │   │   ├── index.tsx               # Lịch dạy của giảng viên
│   │   │   ├── classes.tsx             # Danh sách lớp phụ trách
│   │   │   ├── chat.tsx                # Tin nhắn trao đổi
│   │   │   └── profile.tsx             # Cá nhân
│   │   └── class-detail/[id].tsx       # Chi tiết lớp & Danh sách sinh viên
│   │
│   ├── (consultant)/                   # Dành cho role CONSULTANT
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx             # Bottom Tabs (Hộp thư Leads, Khóa học, Trò chuyện, Cá nhân)
│   │   │   ├── index.tsx               # Danh sách khách hàng tiềm năng (Leads Inbox)
│   │   │   ├── courses.tsx             # Khóa học
│   │   │   ├── chat.tsx                # Chat tư vấn
│   │   │   └── profile.tsx             # Cá nhân
│   │   └── lead/[id].tsx               # Chi tiết xử lý Lead
│   │
│   ├── (common)/                       # Màn hình dùng chung
│   │   ├── change-password.tsx         # Đổi mật khẩu
│   │   └── chat-room/[id].tsx          # Phòng chat chi tiết
│   │
│   └── splash.tsx                      # Màn hình chờ kiểm tra phiên đăng nhập
```

---

## V. ĐẶC TẢ 10 LUỒNG NGHIỆP VỤ CỐT LÕI (END-TO-END FLOWS)

### Luồng 1: Khởi động app & Tự động đăng nhập (Auto-login / Splash)
1. Khi app mở, hiển thị màn hình `splash.tsx` với Logo FPT Education.
2. Kiểm tra `access_token` trong `SecureStore`:
   * **Nếu có**: Gọi API `/api/v1/auth/account`.
     * Thành công: Lưu thông tin người dùng vào Redux `accountSlice`, lấy `role.name`, chuẩn hóa role qua hàm `getPortalRole(roleName)` và điều hướng vào đúng nhóm `(student)`, `(teacher)` hoặc `(consultant)`.
     * Thất bại (401 do token hết hạn): Gọi tiếp `/api/v1/auth/refresh` bằng `refresh_token` trong `SecureStore`. Nếu refresh thành công, lưu access token mới và điều hướng vào app. Nếu refresh thất bại, xóa storage và điều hướng về `(auth)/login`.
   * **Nếu không có**: Điều hướng về `(auth)/login`.

### Luồng 2: Đăng nhập & Đăng ký
1. **Đăng nhập**: Nhập email/username và mật khẩu -> Gọi POST `/api/v1/auth/login`. Lấy `access_token` và `refresh_token` (từ cookie) lưu vào `SecureStore` -> Cập nhật Redux -> Điều hướng theo role.
2. **Đăng ký**: Nhập họ tên, email, mật khẩu, tuổi, giới tính, địa chỉ -> Gọi POST `/api/v1/auth/register` -> Thành công thì chuyển hướng về Login với thông báo thành công.

### Luồng 3: Học viên - Khám phá Khóa học & Đăng ký lớp
1. Học viên vào Tab Khóa học -> Gọi GET `/api/v1/courses?pageSize=50`.
2. Hiển thị danh sách khóa học (tên, hình minh họa, học phí định dạng VNĐ, thời lượng, cấp độ).
3. Bấm vào một khóa học -> Chuyển đến màn hình `course/[id]`.
4. Gọi GET `/api/v1/classrooms/course/{id}/open` để hiển thị danh sách các lớp đang mở (`OPEN`).
5. Học viên chọn lớp học mong muốn -> Bấm "Đăng ký ghi danh" -> Gọi POST `/api/v1/enrollments/register` với `{ student_id, class_id }`.
6. Hệ thống tạo bản ghi Enrollment ở trạng thái `WAITING_PAYMENT` và tự động sinh Invoice tương ứng -> Chuyển hướng học viên đến tab Hóa đơn.

### Luồng 4: Học viên - Thời khóa biểu (Schedule) & Điểm danh
1. Vào Tab Lịch học -> Gọi GET `/api/v1/enrollments/me`.
2. Lọc các lớp học đang tham gia (`status === 'STUDYING'`).
3. Lấy thông tin lớp học (giờ bắt đầu `start_time`, giờ kết thúc `end_time`, phòng học `room`, giáo viên phụ trách).
4. Hiển thị dạng thanh trượt chọn ngày trong tuần (Thứ 2 đến Chủ nhật) kèm Card các ca học trong ngày đó.

### Luồng 5: Học viên - Quản lý Học phí & Hóa đơn
1. Vào Tab Hóa đơn -> Gọi GET `/api/v1/invoices/me`.
2. Hiển thị danh sách hóa đơn theo trạng thái (Chờ thanh toán, Đã thanh toán).
3. Thẻ hóa đơn hiển thị: Tên khóa học, số tiền gốc, giảm giá, số tiền thực nộp, mã hóa đơn.
4. Nút bấm "Xem hướng dẫn thanh toán": Hiển thị modal thông tin chuyển khoản ngân hàng (QR Code Napas 24/7, Số tài khoản FPT, Cú pháp chuyển khoản).

### Luồng 6: Giảng viên - Quản lý Lịch dạy & Danh sách lớp
1. Giảng viên đăng nhập -> Tự động chuyển vào tab `(teacher)`.
2. Gọi API `/api/v1/classrooms?teacher_id={currentUserId}&populate=course_id`.
3. Hiển thị danh sách các lớp phụ trách kèm lịch dạy hàng tuần.
4. Bấm vào lớp học -> Gọi `/api/v1/enrollments?class_id={classId}&populate=student_id` để xem danh sách toàn bộ học viên trong lớp kèm thông tin liên lạc (Email, SĐT).

### Luồng 7: Tư vấn viên - Quản lý Khách hàng tiềm năng (Leads)
1. Tư vấn viên vào Tab `(consultant)`.
2. Gọi GET `/api/v1/leads/consultant-inbox` để lấy danh sách khách hàng để lại thông tin quan tâm.
3. Mỗi thẻ Lead hiển thị: Họ tên, Số điện thoại, Khóa học quan tâm, Trạng thái (`NEW`, `CONTACTED`, `ENROLLED`, `REJECTED`).
4. Thao tác nhanh: Nút "Gọi điện" (kích hoạt `Linking.openURL('tel:...')`), nút "Cập nhật ghi chú / Trạng thái" (gọi PATCH `/api/v1/leads/{id}`).

### Luồng 8: Hệ thống Trò chuyện (Chat & Trao đổi)
1. Vào tab Tin nhắn -> Gọi GET `/api/v1/conversations/my-conversations`.
2. Hiển thị danh sách các cuộc trò chuyện (với giảng viên, bạn học hoặc tư vấn viên).
3. Bấm vào một hội thoại -> Mở màn hình `chat-room/[id]`.
4. Gọi GET `/api/v1/messages?conversation_id={id}` để tải lịch sử tin nhắn.
5. Soạn tin và gửi -> Gọi POST `/api/v1/messages`.

### Luồng 9: Trang Cá nhân & Đổi mật khẩu
1. Hiển thị thông tin người dùng từ Redux: Avatar, Tên, Email, Vai trò, Địa chỉ, Tuổi, Giới tính.
2. Cập nhật hồ sơ cá nhân: Gọi PATCH `/api/v1/users/{id}` (tương tự hàm `callUpdateMyProfile` trên Web).
3. Đổi mật khẩu: Gọi PATCH `/api/v1/users/{id}` với mật khẩu mới.
4. Đăng xuất: Gọi POST `/api/v1/auth/logout`, xóa sạch token trong `SecureStore` và Redux, đưa người dùng về `(auth)/login`.

---

## VI. KẾ HOẠCH CHIA NHỎ THEO PROMPTS TRIỂN KHAI (PROMPT-DRIVEN ROADMAP)

Mỗi prompt dưới đây được thiết kế **độc lập, đầy đủ ngữ cảnh, rõ ràng đầu vào - đầu ra** để bạn có thể copy gửi vào AI cho từng bước thực hiện mà không bao giờ bị lỗi xáo trộn hay ảnh hưởng đến backend/frontend.

---

### Prompt 01: Khởi tạo Project Expo, Expo Router, NativeWind & Cấu hình môi trường
```text
BẠN ĐANG THỰC HIỆN BƯỚC 1 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Khởi tạo một dự án Expo hoàn toàn mới bên trong thư mục `mobile_tech` bằng lệnh:
   npx create-expo-app@latest . --template blank-typescript
   (Lưu ý chạy trực tiếp trong thư mục mobile_tech).
2. Cài đặt các thư viện cốt lõi cho Navigation và Styling:
   - expo-router, expo-constants, expo-status-bar, react-native-safe-area-context, react-native-screens
   - nativewind, tailwindcss@^3.3.0
   - @expo/vector-icons
3. Cấu hình Expo Router theo chuẩn tài liệu chính thức:
   - Cập nhật "main": "expo-router/entry" trong `package.json`.
   - Cấu hình scheme trong `app.json`.
4. Cấu hình Tailwind CSS (NativeWind):
   - Tạo file `tailwind.config.js` với content quét toàn bộ app/**/*.{js,jsx,ts,tsx} và src/**/*.{js,jsx,ts,tsx}.
   - Khai báo bảng màu FPT trong tailwind config:
     fpt: {
       orange: '#F26522',
       orangeDark: '#D95214',
       blue: '#0050B3',
       blueDark: '#003A8C',
       grayBg: '#F8F9FA'
     }
   - Tạo file `global.css` và cấu hình `babel.config.js` với plugin của NativeWind.
5. Tạo file `.env` mẫu và file `src/config/env.ts` để đọc biến `EXPO_PUBLIC_BACKEND_URL` với giá trị mặc định trỏ tới IP LAN máy tính port 8000.
6. Tạo cấu trúc thư mục rỗng chuẩn mực: `src/api`, `src/components`, `src/redux`, `src/types`, `src/utils`, `app`.
7. Kiểm tra `npx expo start` đảm bảo dự án chạy trơn tru không có lỗi package hay syntax.
```

---

### Prompt 02: Đồng bộ Type System & Design System FPT Tech Tokens
```text
BẠN ĐANG THỰC HIỆN BƯỚC 2 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Đọc tệp `frontend_fpt_tech/src/types/backend.d.ts` để hiểu cấu trúc toàn bộ dữ liệu trả về từ NestJS.
2. Tạo tệp `mobile_tech/src/types/backend.ts` xuất đầy đủ các interface và type tương đương:
   - IBackendRes<T>, IModelPaginate<T>
   - IAccount, IGetAccount, IUser, IUserSummary, IRole, IPermission
   - ICourse, IClassroom, IClassroomWithDetails
   - IEnrollment, IPortalEnrollment
   - IInvoice, IPortalInvoice, IPayment, IPortalPayment
   - ILead, IConversation, IMessage, INotification
3. Tạo tệp `mobile_tech/src/types/portal.ts`:
   - Định nghĩa type PortalRole = 'STUDENT' | 'TEACHER' | 'CONSULTANT' | 'MANAGER' | 'ACCOUNTANT'.
   - Viết các hàm helper chuẩn hóa vai trò (sao chép logic từ `frontend_fpt_tech/src/config/portal.tsx`):
     + normalizeRole(value: unknown): string
     + getPortalRole(roleName?: string): PortalRole
     + isBackofficeRole(roleName?: string): boolean
4. Tạo tệp `mobile_tech/src/constants/theme.ts`:
   - Xuất các hằng số màu sắc FPT Colors, kích thước font chữ, khoảng cách spacing, shadow chuẩn mực để tái sử dụng thống nhất trên toàn app.
```

---

### Prompt 03: Thiết lập Network Layer (Axios Interceptors, Cookie Header cho Refresh Token & LAN IP)
```text
BẠN ĐANG THỰC HIỆN BƯỚC 3 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Cài đặt các thư viện cần thiết:
   npx expo install expo-secure-store @react-native-async-storage/async-storage
   npm install axios async-mutex
2. Xây dựng module quản lý lưu trữ an toàn `src/utils/storage.ts`:
   - Hàm lưu/đọc/xóa `access_token`, `refresh_token`, `user_id`.
   - Sử dụng `expo-secure-store` (kèm fallback `AsyncStorage` an toàn).
3. Xây dựng Axios Instance tại `src/api/axios-customize.ts`:
   - Cấu hình `baseURL` lấy từ `EXPO_PUBLIC_BACKEND_URL` (ví dụ: http://<LAN_IP>:8000/api/v1).
   - **Request Interceptor**: Tự động lấy `access_token` từ storage và gắn header `Authorization: Bearer <token>`.
   - **Response Interceptor xử lý Cookie Refresh Token**:
     + Khi đăng nhập hoặc gọi API có trả về header `set-cookie`, tự động trích xuất chuỗi `refresh_token` và lưu vào storage.
     + Khi gặp lỗi 401 (ngoại trừ route /auth/login), kích hoạt mutex để gọi `/auth/refresh`.
     + **ĐẶC BIỆT**: Do backend NestJS đọc `request.cookies['refresh_token']`, hãy đính kèm thủ công header `Cookie: refresh_token=${storedRefreshToken}` khi gọi `/auth/refresh`.
     + Sau khi refresh thành công, lưu `access_token` mới và tự động retry lại request ban đầu.
     + Nếu refresh thất bại, xóa storage và bắn sự kiện yêu cầu đăng nhập lại.
4. Tạo tệp `src/api/index.ts` khai báo các hàm gọi API tương tự `frontend_fpt_tech/src/config/api.ts`:
   - callLogin, callRegister, callFetchAccount, callRefreshToken, callLogout, callUpdateMyProfile
   - callFetchCourse, callFetchCourseById, callFetchOpenClassroomsForCourse
   - callFetchMyEnrollments, callRegisterForCourse, callCancelMyEnrollment
   - callFetchMyInvoices, callFetchMyPayments
   - callFetchMyTeachingClassrooms, callFetchMyStudents
   - callFetchLeadsForConsultants, callUpdateLead
   - callFetchMyConversations, callFetchMessage, callCreateMessage
```

---

### Prompt 04: Xây dựng Redux Toolkit Store & Account Slice đồng bộ
```text
BẠN ĐANG THỰC HIỆN BƯỚC 4 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Cài đặt Redux Toolkit và React Redux:
   npm install @reduxjs/toolkit react-redux
2. Xây dựng `src/redux/slice/accountSlice.ts` đồng bộ logic với `frontend_fpt_tech/src/redux/slice/accountSlide.ts`:
   - State gồm:
     + isAuthenticated: boolean
     + isLoading: boolean
     + isRefreshToken: boolean
     + errorRefreshToken: string
     + user: { _id, email, name, role: { _id, name }, permissions }
   - AsyncThunk `fetchAccount`: Gọi API `callFetchAccount()` để lấy thông tin phiên đăng nhập.
   - Reducers:
     + `setUserLoginInfo`: Cập nhật user info sau khi login thành công, lưu `user_id` vào storage.
     + `setLogoutAction`: Xóa user info trong state, xóa token trong storage.
     + `setProfileAction`: Cập nhật lại tên/thông tin cá nhân khi chỉnh sửa.
     + `setRefreshTokenAction`: Cập nhật trạng thái refresh token.
3. Tạo `src/redux/store.ts`:
   - Cấu hình Redux store với `accountSlice`.
   - Export RootState và AppDispatch.
4. Tạo `src/redux/hooks.ts`:
   - Export `useAppDispatch` và `useAppSelector` có đầy đủ typing chuẩn TypeScript.
```

---

### Prompt 05: Xây dựng Bộ Thư Viện UI Components Chuẩn FPT Mobile
```text
BẠN ĐANG THỰC HIỆN BƯỚC 5 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
Xây dựng các component UI cơ bản tại `src/components/common` sử dụng NativeWind, tuân thủ Design System FPT:
1. `FptButton.tsx`:
   - Hỗ trợ các variant: 'primary' (màu cam FPT #F26522), 'secondary' (xanh navy), 'outline', 'ghost'.
   - Trạng thái: loading (ActivityIndicator), disabled, icon trái/phải, haptic feedback khi chạm.
2. `FptInput.tsx`:
   - Thiết kế viền mượt bo tròn, label rõ ràng, hiển thị icon, hỗ trợ ẩn/hiện mật khẩu (toggle eye icon), hiển thị dòng thông báo lỗi validation màu đỏ.
3. `FptCard.tsx`:
   - Card nền trắng, bo góc `rounded-2xl`, bóng đổ `shadow-sm`, viền mỏng xám nhẹ, hỗ trợ padding linh hoạt.
4. `FptBadge.tsx`:
   - Hiển thị nhãn trạng thái (OPEN: xanh lá, STUDYING: xanh dương, WAITING_PAYMENT: vàng cam, CANCELLED: đỏ, COMPLETED: tím).
5. `FptHeader.tsx`:
   - Header chuẩn cho màn hình mobile: Tiêu đề căn giữa/trái, nút Back thông minh, hỗ trợ nút hành động bên phải.
6. `FptLoading.tsx` & `FptEmptyState.tsx`:
   - Loading indicator chuyên nghiệp kèm logo FPT hoặc spinner.
   - EmptyState hiển thị minh họa, tiêu đề và nút kêu gọi hành động khi danh sách rỗng.
```

---

### Prompt 06: Phân hệ Xác thực (Splash, Đăng nhập & Đăng ký tài khoản)
```text
BẠN ĐANG THỰC HIỆN BƯỚC 6 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng màn hình `app/splash.tsx`:
   - Hiển thị logo FPT Education, slogan và hiệu ứng loading nhẹ nhàng.
   - Kích hoạt kiểm tra token:
     + Lấy access token từ SecureStore -> dispatch `fetchAccount()`.
     + Nếu thành công: Lấy roleName của user, kiểm tra qua `getPortalRole(roleName)` và dùng `router.replace` chuyển tới `(student)`, `(teacher)` hoặc `(consultant)`.
     + Nếu không có token hoặc token hết hạn/lỗi: Chuyển hướng tới `(auth)/login`.
2. Xây dựng màn hình `app/(auth)/login.tsx`:
   - Giao diện hiện đại: Banner thương hiệu FPT Tech, tiêu đề "Chào mừng trở lại!", form đăng nhập gồm Username/Email và Mật khẩu.
   - Xử lý KeyboardAvoidingView và TouchableWithoutFeedback để bàn phím không che form.
   - Xử lý submit: Gọi `callLogin(username, password)`.
   - Hiển thị thông báo lỗi chi tiết nếu đăng nhập sai.
   - Thành công: Lưu token, dispatch `setUserLoginInfo` và điều hướng theo role.
   - Nút dẫn sang trang Đăng ký.
3. Xây dựng màn hình `app/(auth)/register.tsx`:
   - Form đăng ký học viên mới: Họ và tên, Email, Mật khẩu, Tuổi, Giới tính, Địa chỉ.
   - Validation cơ bản (email đúng định dạng, mật khẩu >= 6 ký tự, các trường bắt buộc).
   - Gọi `callRegister(...)` -> Báo thành công và chuyển về màn hình đăng nhập.
```

---

### Prompt 07: Root Layout, Phân Luồng Định Tuyến Theo Vai Trò (Role Router & Bottom Tabs)
```text
BẠN ĐANG THỰC HIỆN BƯỚC 7 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng `app/_layout.tsx`:
   - Bọc toàn bộ ứng dụng trong Redux Provider (`store`), `SafeAreaProvider`.
   - Nạp font và xử lý khởi tạo app.
   - Cấu hình Slot hoặc Stack chứa các phân nhóm: `splash`, `(auth)`, `(student)`, `(teacher)`, `(consultant)`, `(common)`.
2. Xây dựng Bottom Tab Navigation cho Học viên tại `app/(student)/(tabs)/_layout.tsx`:
   - Tab 1: "Tổng quan" (`index`) - Icon Home.
   - Tab 2: "Khóa học" (`courses`) - Icon Book.
   - Tab 3: "Lịch học" (`schedule`) - Icon Calendar.
   - Tab 4: "Học phí" (`invoices`) - Icon CreditCard / Receipt.
   - Tab 5: "Cá nhân" (`profile`) - Icon User.
   - Tùy chỉnh màu sắc Tab Bar: Active màu cam FPT (`#F26522`), Inactive màu xám (`#8C8C8C`), hiệu ứng chuẩn iOS.
3. Tạo các file tab giữ chỗ tạm thời (`index.tsx`, `courses.tsx`, `schedule.tsx`, `invoices.tsx`, `profile.tsx`) hiển thị tên màn hình để kiểm tra chuyển tab mượt mà.
```

---

### Prompt 08: Học viên - Trang chủ (Dashboard) & Khám phá Khóa học (Courses List & Detail)
```text
BẠN ĐANG THỰC HIỆN BƯỚC 8 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng màn hình Dashboard Học viên `app/(student)/(tabs)/index.tsx`:
   - Header chào mừng: "Xin chào, {user.name}!" kèm Avatar và Badge vai trò "Học viên".
   - Widget thống kê nhanh: Số khóa đang học, số buổi học trong tuần, hóa đơn cần đóng.
   - Section "Khóa học nổi bật" (dạng danh sách cuộn ngang) và "Lịch học hôm nay".
   - Kéo để làm mới dữ liệu (Pull-to-refresh).
2. Xây dựng màn hình Danh sách Khóa học `app/(student)/(tabs)/courses.tsx`:
   - Thanh tìm kiếm theo tên khóa học.
   - Gọi API `callFetchCourse('pageSize=50')`.
   - Hiển thị danh sách khóa học dạng Card (FlatList): Tên khóa, mô tả ngắn, hình minh họa mẫu, cấp độ (Level), thời lượng, học phí định dạng tiền tệ Việt Nam (VNĐ).
   - Bấm vào Card chuyển tới `app/(student)/course/[id].tsx`.
3. Xây dựng màn hình Chi tiết Khóa học `app/(student)/course/[id].tsx`:
   - Gọi `callFetchCourseById(id)`.
   - Hiển thị thông tin chi tiết: Đề cương, mục tiêu khóa học, học phí.
   - Gọi `callFetchOpenClassroomsForCourse(id)` để lấy danh sách các lớp học đang mở (`OPEN`).
   - Hiển thị từng lớp: Tên lớp, giảng viên phụ trách, phòng học, lịch học trong tuần, ngày khai giảng.
   - Nút "Đăng ký khóa học":
     + Học viên chọn 1 lớp học mở.
     + Nhấn "Xác nhận đăng ký" -> Gọi `callRegisterForCourse({ student_id: user._id, class_id: selectedClassId })`.
     + Hiển thị thông báo đăng ký thành công và gợi ý chuyển sang màn hình Hóa đơn để xem thông tin học phí.
```

---

### Prompt 09: Học viên - Lịch học (Schedule Timeline/Calendar) & Lớp học của tôi
```text
BẠN ĐANG THỰC HIỆN BƯỚC 9 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng màn hình Lịch học `app/(student)/(tabs)/schedule.tsx`:
   - Gọi API `callFetchMyEnrollments()` để lấy các lớp học của học viên đang có trạng thái `STUDYING`.
   - Thiết kế giao diện Lịch theo chuẩn Mobile:
     + Thanh trượt chọn ngày trong tuần hiện tại (Thứ 2, 3, 4, 5, 6, 7, CN).
     + Nút chuyển tuần trước / tuần sau hoặc nút "Hôm nay".
     + Phần nội dung bên dưới: Hiển thị danh sách ca học diễn ra trong ngày được chọn.
     + Thẻ ca học: Thời gian bắt đầu - kết thúc, tên môn/lớp, phòng học, giảng viên phụ trách, trạng thái lớp học.
   - Nếu ngày được chọn không có lịch học, hiển thị `FptEmptyState` với thông điệp: "Hôm nay bạn không có lịch học. Hãy nghỉ ngơi hoặc ôn bài nhé!".
2. Xây dựng màn hình Chi tiết Lớp học `app/(student)/class/[id].tsx`:
   - Xem thông tin chi tiết lớp học: Sĩ số, ngày bắt đầu - kết thúc, phòng học, giảng viên phụ trách.
   - Danh sách bạn cùng lớp (nếu có quyền xem).
```

---

### Prompt 10: Học viên - Quản lý Học phí & Hóa đơn (Invoices & Payment History)
```text
BẠN ĐANG THỰC HIỆN BƯỚC 10 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng màn hình Hóa đơn Học viên `app/(student)/(tabs)/invoices.tsx`:
   - Gọi API `callFetchMyInvoices()`.
   - Bộ lọc trạng thái: "Tất cả", "Chờ thanh toán", "Đã thanh toán".
   - Mỗi Card hóa đơn hiển thị:
     + Mã hóa đơn, Tên khóa học / lớp học tương ứng.
     + Số tiền học phí, số tiền giảm trừ, số tiền cần thanh toán thực tế (format VNĐ).
     + Ngày tạo hóa đơn.
     + Badge trạng thái (Vàng: Chờ thanh toán, Xanh lá: Đã thanh toán).
2. Xử lý tính năng "Xem Hướng dẫn Thanh toán / Chuyển khoản":
   - Khi bấm vào hóa đơn chưa thanh toán, mở Bottom Sheet hoặc Modal:
     + Hiển thị thông tin tài khoản ngân hàng của trường (Ngân hàng, Số tài khoản, Chủ tài khoản).
     + Tự động sinh mã VietQR chuyển khoản (dùng API sinh ảnh VietQR chuẩn: https://img.vietqr.io/image/...).
     + Cú pháp chuyển khoản chuẩn (Mã hóa đơn + Số điện thoại).
     + Nút "Sao chép số tài khoản" và "Sao chép nội dung chuyển khoản" (sử dụng Clipboard của React Native).
3. Tab con hoặc mục "Lịch sử thanh toán": Gọi API `callFetchMyPayments()` để xem các phiếu thu đã xác nhận.
```

---

### Prompt 11: Trang Cá Nhân (Profile), Đổi Mật Khẩu & Đăng Xuất (Dùng chung các Role)
```text
BẠN ĐANG THỰC HIỆN BƯỚC 11 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng màn hình Cá nhân `app/(student)/(tabs)/profile.tsx` (và dùng chung logic cho Teacher/Consultant):
   - Card hồ sơ: Avatar chữ cái đầu, Họ và tên, Email, Badge Vai trò người dùng.
   - Menu danh mục cài đặt & thông tin:
     + Chỉnh sửa thông tin cá nhân (Họ tên, SĐT, Địa chỉ, Tuổi, Giới tính).
     + Đổi mật khẩu tài khoản.
     + Điều khoản & Chính sách bảo mật.
     + Thông tin phiên bản ứng dụng (FPT Tech Mobile v1.0.0).
   - Nút "Đăng xuất" (màu đỏ nổi bật).
2. Xây dựng modal/màn hình Cập nhật Thông tin cá nhân:
   - Cho phép sửa: Tên, SĐT, Địa chỉ, Giới tính, Tuổi.
   - Gọi `callUpdateMyProfile(...)` -> Cập nhật lại Redux state -> Báo thành công.
3. Xây dựng màn hình `app/(common)/change-password.tsx`:
   - Form nhập: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới.
   - Kiểm tra trùng khớp mật khẩu mới.
   - Gọi API cập nhật mật khẩu -> Thông báo thành công và yêu cầu đăng nhập lại.
4. Xử lý Đăng xuất an toàn:
   - Hiển thị hộp thoại xác nhận `Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?")`.
   - Khi đồng ý: Gọi `callLogout()` -> Xóa toàn bộ token trong `SecureStore` -> Dispatch `setLogoutAction()` -> Chuyển về `(auth)/login`.
```

---

### Prompt 12: Giảng viên - Lịch dạy, Danh sách Lớp học & Danh sách Học viên
```text
BẠN ĐANG THỰC HIỆN BƯỚC 12 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng Bottom Tabs cho Giảng viên tại `app/(teacher)/(tabs)/_layout.tsx`:
   - Tab 1: "Lịch dạy" (`index`).
   - Tab 2: "Lớp học" (`classes`).
   - Tab 3: "Tin nhắn" (`chat`).
   - Tab 4: "Cá nhân" (`profile`).
2. Xây dựng màn hình Lịch dạy `app/(teacher)/(tabs)/index.tsx`:
   - Gọi API `callFetchMyTeachingClassrooms()`.
   - Hiển thị lịch dạy theo ngày trong tuần, phòng học, khung giờ bắt đầu/kết thúc.
3. Xây dựng màn hình Quản lý Lớp học `app/(teacher)/(tabs)/classes.tsx`:
   - Danh sách các lớp giảng viên đang phụ trách.
   - Mỗi thẻ lớp: Tên lớp, Khóa học, Phòng học, Số lượng sinh viên, Ngày bắt đầu/kết thúc.
   - Nhấn vào lớp chuyển tới `app/(teacher)/class-detail/[id].tsx`.
4. Xây dựng màn hình Chi tiết Lớp học của Giảng viên `app/(teacher)/class-detail/[id].tsx`:
   - Thông tin tổng quan của lớp.
   - Tab danh sách học viên: Gọi `callFetchMyStudents(classId)` hiển thị toàn bộ học viên ghi danh vào lớp.
   - Mỗi học viên hiển thị: Tên, Email, SĐT, Trạng thái (Đang học, Chờ thanh toán).
   - Nút liên hệ nhanh (Bấm để gọi điện thoại hoặc gửi email trực tiếp).
```

---

### Prompt 13: Tư vấn viên - Quản lý Khách hàng tiềm năng (Leads) & Đăng ký ghi danh
```text
BẠN ĐANG THỰC HIỆN BƯỚC 13 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng Bottom Tabs cho Tư vấn viên tại `app/(consultant)/(tabs)/_layout.tsx`:
   - Tab 1: "Khách hàng" (`index`).
   - Tab 2: "Khóa học" (`courses`).
   - Tab 3: "Tin nhắn" (`chat`).
   - Tab 4: "Cá nhân" (`profile`).
2. Xây dựng màn hình Quản lý Lead `app/(consultant)/(tabs)/index.tsx`:
   - Gọi API `callFetchLeadsForConsultants()`.
   - Lọc theo trạng thái: Mới (`NEW`), Đã liên hệ (`CONTACTED`), Đã ghi danh (`ENROLLED`), Hủy (`CANCELLED`).
   - Thẻ Lead hiển thị: Họ tên khách hàng, Số điện thoại, Email, Khóa học quan tâm, Ghi chú gần nhất.
   - Nút hành động nhanh:
     + Nút gọi điện thoại (`Linking.openURL('tel:${phone}')`).
     + Nút cập nhật trạng thái tư vấn (mở Bottom Sheet để đổi trạng thái và ghi chú nội dung tư vấn -> gọi `callUpdateLead(id, data)`).
```

---

### Prompt 14: Phân hệ Tin nhắn / Trò chuyện (Chat & Conversations)
```text
BẠN ĐANG THỰC HIỆN BƯỚC 14 CỦA DỰ ÁN MOBILE_TECH.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Xây dựng màn hình Danh sách Hội thoại `app/(common)/chat.tsx`:
   - Gọi API `callFetchMyConversations()`.
   - Hiển thị danh sách các phòng chat (cuộc trò chuyện với Giảng viên, Học viên hoặc Tư vấn viên).
   - Hiển thị tên người đối thoại, tin nhắn mới nhất, thời gian gửi tương đối (dùng dayjs: "5 phút trước", "Hôm qua").
   - Nhấn vào mở `app/(common)/chat-room/[id].tsx`.
2. Xây dựng màn hình Phòng Trò chuyện `app/(common)/chat-room/[id].tsx`:
   - Header hiển thị tên và trạng thái đối phương.
   - Danh sách tin nhắn đảo chiều (cuộn từ dưới lên trên).
   - Phân biệt rõ: Bong bóng tin nhắn của mình (nền cam FPT, căn phải) và của đối phương (nền xám trắng, căn trái).
   - Ô nhập tin nhắn phía dưới tích hợp `KeyboardAvoidingView` để không bị bàn phím che khuất.
   - Xử lý gửi tin nhắn: Gọi `callCreateMessage(...)` và cập nhật ngay vào danh sách.
   - Hỗ trợ cơ chế tự động làm mới (polling hoặc reload khi nhận tin nhắn).
```

---

### Prompt 15: Kiểm thử hoàn thiện trên iPhone qua Expo Go, Safe Area & Tối ưu hiệu năng
```text
BẠN ĐANG THỰC HIỆN BƯỚC 15 - BƯỚC HOÀN THIỆN VÀ KIỂM THỬ TRÊN IPHONE.
LƯU Ý CỐT TỬ: TUYỆT ĐỐI KHÔNG SỬA CODE TRONG 'backend-tech-fpt' VÀ 'frontend_fpt_tech'. CHỈ LÀM VIỆC TRONG 'mobile_tech'.

Yêu cầu thực hiện:
1. Rà soát Safe Area & Dynamic Island trên iPhone:
   - Đảm bảo tất cả các màn hình đều bọc trong `SafeAreaView` từ `react-native-safe-area-context`.
   - Không để chữ, nút hay header bị che khuất bởi tai thỏ (Notch) hoặc Dynamic Island.
2. Kiểm tra kết nối mạng với Backend NestJS:
   - Xác định IP LAN của máy tính chạy NestJS (dùng ipconfig).
   - Cấu hình file `mobile_tech/.env`:
     EXPO_PUBLIC_BACKEND_URL=http://<IP_LAN_CUA_BAN>:8000/api/v1
   - Kiểm tra mở port 8000 trên Windows Defender Firewall để iPhone truy cập được.
3. Chạy ứng dụng kiểm thử:
   - Di chuyển vào thư mục: cd mobile_tech
   - Chạy lệnh: npx expo start -c
   - Quét mã QR bằng Camera iPhone để mở trong Expo Go.
4. Kiểm tra chuỗi kịch bản:
   - Đăng nhập tài khoản Học viên -> Xem Dashboard -> Xem Khóa học -> Đăng ký lớp -> Xem Hóa đơn -> Xem Lịch học -> Chỉnh sửa hồ sơ cá nhân.
   - Đăng xuất -> Đăng nhập tài khoản Giảng viên -> Xem Lịch dạy -> Xem Danh sách lớp & Học viên.
   - Xác nhận ứng dụng chạy mượt mà, không giật lag, không văng app.
```

---

## VII. TỔNG KẾT VÀ BẮT ĐẦU

Tài liệu này là kim chỉ nam duy nhất để bạn hoặc bất kỳ AI nào triển khai ứng dụng `mobile_tech` từng bước một cách an toàn và chính xác tuyệt đối. 

**Quy tắc phối hợp**:
Khi bắt đầu thực hiện, bạn chỉ cần yêu cầu:  
👉 *"Hãy thực hiện Prompt 01 cho tôi"* (hoặc lần lượt từ Prompt 01 đến Prompt 15). Mỗi bước hoàn thành và được kiểm tra xong mới chuyển tiếp sang bước tiếp theo.
