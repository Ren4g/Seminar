# DiDau — Hệ thống thuyết minh du lịch

Prototype chạy trực tiếp trên trình duyệt, không cần cài package hay build tool.

## Chạy

Mở `index.html` trong trình duyệt hiện đại. Dữ liệu được lưu trên trình duyệt hiện tại bằng `localStorage`; chọn **Khôi phục dữ liệu mẫu** trong menu tài khoản để đặt lại.

## Cấu trúc mã nguồn

- `app.js`: dữ liệu mẫu, trạng thái ứng dụng và tiện ích dùng chung.
- `js/features/locations.js`: địa điểm.
- `js/features/pois.js`: POI và quyền theo địa điểm.
- `js/features/content.js`: nội dung, phiên bản, dịch, rà soát và xuất bản.
- `js/features/languages.js`: ngôn ngữ và giọng đọc mặc định.
- `js/features/audio.js`: tạo, tải lên và nghe thử audio.
- `js/features/qr.js`: liên kết và mã QR cho POI.
- `js/features/users.js`: tài khoản, đăng nhập, vai trò và phân công.
- `js/features/visitor.js`: trải nghiệm khách tham quan và lịch sử nghe.
- `js/features/analytics.js`: thống kê lượt xem/nghe/quét.
- `js/features/dashboard.js`: tổng quan đa nghiệp vụ.
- `js/shared/forms.js`: thành phần biểu mẫu dùng chung.
- `js/router.js`: chọn màn hình theo trạng thái ứng dụng.
- `js/events.js`: điều khiển tương tác, sự kiện và khởi chạy ứng dụng.
- `styles.css`: kiểu dáng và bố cục.

Các script được nạp theo thứ tự trong `index.html`; giữ chúng là script thường (không đổi sang `type="module"`) để tiếp tục mở project trực tiếp bằng `file://`.

## Tài khoản demo

| Vai trò | Tên đăng nhập | Mật khẩu |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Content Manager | `editor` | `editor123` |

## Phạm vi đã triển khai

Các luồng UC01–UC34 được mô phỏng trong giao diện: quản lý tài khoản và phân công, địa điểm, POI, ngôn ngữ/giọng đọc, phiên bản nội dung, dịch và rà soát, audio, kiểm duyệt, xuất bản/gỡ/xuất bản lại, Visitor, lịch sử nghe, QR và thống kê.

- Visitor không cần đăng nhập; ngôn ngữ và lịch sử nghe lưu trên thiết bị.
- Bản dịch trong demo tạo bản nháp gắn cờ **Cần rà soát**; chưa kết nối API dịch.
- TTS demo dùng Web Speech API của trình duyệt để nghe thử. Có thể tải audio thu sẵn lên trong màn hình audio.
- QR được tạo từ dịch vụ QR công khai khi có mạng. Trước khi tạo QR, cấu hình URL Visitor công khai trong **Mã QR → Địa chỉ website**; URL `file://` trên máy không thể dùng tại điểm tham quan.

## Giới hạn quan trọng

Đây là prototype frontend, không phải hệ thống production. Tài khoản, mật khẩu và quyền trong demo chỉ phục vụ trình diễn; dữ liệu nằm trong `localStorage` và không an toàn để dùng cho dữ liệu thật. Khôi phục mật khẩu chỉ mô phỏng vì chưa có email server. Chưa có backend để xác thực/phân quyền đáng tin cậy, lưu file audio an toàn, gửi email, hoặc kết nối nhà cung cấp dịch/TTS. Trước khi triển khai thật, cần backend, cơ sở dữ liệu, lưu trữ file, HTTPS, xác thực an toàn và cấu hình API provider.
