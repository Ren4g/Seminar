# BÁO CÁO TỔNG HỢP CÔNG VIỆC TRONG SESSION

**Dự án**: Hệ thống Thuyết minh Du lịch Đa ngôn ngữ (Audio Guide Seminar)  
**Thời gian thực hiện**: Ngày 18/11/2026  
**Mục tiêu session**: Kiểm tra logic màn hình Tổng quan, cơ chế đếm đang truy cập/visitor, xử lý mã QR thành link trên điện thoại, sửa lỗi trắng màn hình mobile và kích hoạt tính năng thống kê quét QR.

---

## 1. Kiểm tra & Bóc tách Logic màn hình "Tổng quan" (Overview)

Đã rà soát chi tiết toàn bộ luồng hoạt động của 9 thẻ thống kê trên dashboard:

### 1.1. Bốn chỉ số Quản lý Nội dung (Client Memory / API Admin)
- **Phiên bản nội dung**: Đếm tổng số bài viết trong hệ thống (`items.length`).
- **Đã xuất bản**: Số bài viết ở trạng thái `PUBLISHED` (`items.filter(item => item.status === 'Đã xuất bản')`).
- **Chờ duyệt**: Số bài viết ở trạng thái `PENDING_REVIEW` (`items.filter(item => item.status === 'Chờ duyệt')`).
- **Điểm tham quan · Giọng đọc**: Số lượng POI khả dụng và số giọng đọc đã khai báo trong hệ thống.

### 1.2. Năm chỉ số Hành vi Visitor (Database `activity_event` & `visitor_presence`)
- **Lượt mở visitor (`pageViews`)**: Tổng số sự kiện `PAGE_VIEW` trong 30 ngày gần nhất.
- **Lượt mở QR (`qrOpens`)**: Tổng số sự kiện quét mã QR `QR_OPEN`.
- **Lượt bắt đầu audio (`audioStarts`)**: Tổng số lần bấm nút Play audio của khách.
- **Thời lượng nghe (`listeningMs`)**: Tổng thời gian khách nghe audio thực tế (`AUDIO_PLAY_DURATION`).
- **Đang truy cập (`activeVisitors`)**: Số lượng khách đang online trong vòng 2 phút gần nhất.

### 1.3. Cơ chế hoạt động của "Đang truy cập" (Active Visitors)
- **Cơ chế**: Dùng mô hình **Heartbeat (Nhịp tim) + Sliding Window (Cửa sổ thời gian trượt)**:
  1. Khi vào trang `/visitor`, frontend sinh một Session UUID lưu trong `sessionStorage` (`audio-guide-session`).
  2. Định kỳ **mỗi 30 giây** (khi tab đang hiển thị - `document.visibilityState === 'visible'`), frontend gửi request `POST /api/visitor/presence` mang UUID lên server. Nếu người dùng ẩn tab/thu nhỏ trình duyệt, nhịp tim tự động tạm dừng.
  3. Backend ghi nhận vào bảng `visitor_presence` bằng câu lệnh `UPSERT` (cập nhật `last_seen_at = now()`), đồng thời tự dọn dẹp các session cũ quá 5 phút.
  4. Màn hình Tổng quan truy vấn:
     ```sql
     SELECT COUNT(*)::int FROM visitor_presence
     WHERE last_seen_at >= now() - interval '2 minutes'
     ```
  5. **Độ trễ TTL khi thoát**: Vì dùng HTTP Polling, khi khách đóng tab, hệ thống cần tối đa **2 phút** để số liệu tụt về 0 (đúng với chú thích giao diện *"2 phút gần nhất"*).

---

## 2. Sửa lỗi cơ chế đếm bị sai của "Lượt mở visitor"

### Nguyên nhân:
1. **Bỏ sót trang chủ**: Trước đây sự kiện `PAGE_VIEW` chỉ gắn vào khi có `poiId` (`/visitor?poiId=...`). Khi khách vào trang chủ `/visitor` để xem danh mục địa điểm, code cũ bị chặn ở `if (!poiId) return`, dẫn đến việc truy cập trang chủ không được đếm.
2. **Bị đếm trùng khi đổi ngôn ngữ**: Lệnh gửi sự kiện bị đặt chung trong `useEffect(..., [poiId, language])`. Mỗi lần khách đổi ngôn ngữ từ VI sang EN trên cùng 1 bài viết thì bị cộng thêm 1 lượt mở visitor.

### Đã xử lý trong `Seminar/web/src/main.tsx`:
- Tách riêng việc ghi nhận `PAGE_VIEW` theo `[poiId]`.
- Vào trang chủ `/visitor` -> gửi `PAGE_VIEW` với `poiId = undefined` (Database lưu `NULL` hợp lệ).
- Bấm vào chi tiết POI -> gửi `PAGE_VIEW` kèm `poiId`.
- Đổi ngôn ngữ chỉ tải lại bản dịch thuyết minh tương ứng, không bị tính trùng lặp lượt truy cập.

---

## 3. Chuyển đổi mã QR từ TEXT thành LINK cho điện thoại

### Nguyên nhân điện thoại quét ra dạng TEXT:
- Cấu hình cũ dùng `PUBLIC_VISITOR_URL=http://localhost:5173/visitor`.
- Camera điện thoại, Zalo hay Google Lens khi quét thấy chữ `localhost` (không phải tên miền internet và không phải IP mạng) nên nhận diện là **văn bản thuần (plain text)**, không hiện nút bấm mở web.

### Đã cấu hình và xử lý:
1. **Cập nhật `Seminar/web/vite.config.ts`**: Thêm `server.host = true` để Vite cho phép các thiết bị trong mạng Wi-Fi truy cập.
2. **Xác định IP Wi-Fi máy tính**: `10.60.25.190`.
3. **Cập nhật `Seminar/.env`**:
   ```env
   PUBLIC_VISITOR_URL=http://10.60.25.190:5173/visitor
   ```
4. Khi quét mã QR, các ứng dụng điện thoại lập tức nhận diện đây là **Link Web** và hiện nút **Mở liên kết / Open in Browser**.

---

## 4. Khắc phục lỗi điện thoại bị trắng màn hình (Blank White Screen)

### Nguyên nhân kỹ thuật:
- Trên điện thoại di động (Safari iOS, Chrome Android), hàm bảo mật Web Crypto **`crypto.randomUUID()` chỉ hoạt động trên môi trường an toàn (`HTTPS` hoặc `localhost`)**.
- Khi điện thoại truy cập qua mạng LAN bằng HTTP (`http://10.60.25.190:5173/...`), hàm `crypto.randomUUID` bị trình duyệt vô hiệu hóa (`undefined`).
- Khi khởi chạy trang visitor, lệnh tạo session gọi hàm này làm quăng lỗi:
  `TypeError: crypto.randomUUID is not a function`
- Lỗi ngoại lệ này đánh sập toàn bộ React component tree ngay lập tức, khiến màn hình bị **trắng bóc**.

### Đã xử lý trong `Seminar/web/src/main.tsx`:
- Tạo hàm bọc thông minh `safeRandomUUID()`:
  - Nếu trình duyệt hỗ trợ `crypto.randomUUID` thì dùng.
  - Nếu truy cập qua HTTP trên mobile thì tự động kích hoạt thuật toán sinh UUID v4 chuẩn RFC4122.
- Thay thế toàn bộ các vị trí gọi `crypto.randomUUID()` bằng `safeRandomUUID()`. Điện thoại mở web mượt mà, hết hoàn toàn hiện tượng trắng màn hình.

---

## 5. Hiện thực hóa tính năng "Lượt mở QR" (QR Opens Tracking)

### Đã xử lý khép kín:
1. **Gắn cờ nhận diện QR trong backend (`Seminar/src/catalog/catalog.service.ts`)**:
   Khi sinh đường dẫn cho mã QR, hệ thống tự động thêm cờ `&source=qr`:
   `http://10.60.25.190:5173/visitor?poiId=X&language=vi&source=qr`
2. **Cập nhật dữ liệu database**:
   Đã cập nhật toàn bộ các bản ghi trong bảng `qr_code` có sẵn cờ `&source=qr`.
3. **Xử lý phía visitor (`Seminar/web/src/main.tsx`)**:
   `VisitorApp` phát hiện tham số `source=qr` và tự động gửi sự kiện `QR_OPEN` lên server.
4. **Hiển thị**: Thẻ **"lượt mở QR"** ở màn hình **Tổng quan** của Admin tự động tăng số thực tế mỗi khi có người quét mã QR.

---

## 6. Đánh giá Nghiệp vụ cho bài Báo cáo Seminar

| Hạng mục | Mức độ cần thiết | Nhận định |
| :--- | :---: | :--- |
| **Lượt mở QR (`qrOpens`)** | **RẤT CẦN THIẾT** ⭐⭐⭐⭐⭐ | Đề tài là *"Thuyết minh du lịch quét mã QR"*. Thống kê này chứng minh được khách thực tế có quét mã tại điểm tham quan, giúp bài thuyết trình seminar có tính thực tiễn cao. |
| **Thời lượng nghe (`listeningMs`)** | **PHỤ TRỢ / OPTIONAL** ⭐⭐⭐ | Phù hợp để đánh giá mức độ hấp dẫn của bài thuyết minh. Tuy nhiên ở mức độ seminar, giảng viên chú trọng luồng hoạt động chính (Nội dung -> QR -> Visitor -> Analytics) hơn là đo đạc chi tiết từng giây nghe. |

---

## 7. Trạng thái kiểm tra & Build hệ thống

- **Backend**: `npm run build` -> Đạt 100% (0 lỗi).
- **Frontend**: `npm --prefix web run build` -> Đạt 100% (0 lỗi, thời gian build ~199ms).
- **Cơ sở dữ liệu**: Đã cập nhật bảng `qr_code` và kiểm tra hoạt động của bảng `activity_event`, `visitor_presence`.
