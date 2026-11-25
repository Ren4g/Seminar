# Bộ sơ đồ hệ thống thuyết minh tự động đa ngôn ngữ – Bản hoàn chỉnh v3

> **Nguồn nghiệp vụ:** `dac_ta_use_case_hoan_chinh_v2.docx`, 29 trang, 35 Use Case (đã bổ sung UC35 - Xem bản đồ).
> **Mục tiêu:** chuyển đặc tả thành bộ sơ đồ có thể chỉnh sửa bằng Mermaid/PlantUML.
> **Nguyên tắc:** luồng nghiệp vụ lấy từ đặc tả; các quyết định mô hình hóa được đánh dấu riêng; không tự thêm nghiệp vụ chưa được quy định.

## 0. Phạm vi và quy ước

- 01 Use Case Diagram UML (PlantUML), bao phủ UC01–UC35.
- **35 Activity Diagram độc lập**, mỗi sơ đồ tương ứng đúng một UC. Các luồng phụ/ngoại lệ được đưa vào nhánh quyết định hoặc nhánh lỗi.
- 01 State Diagram cho vòng đời Content Version.
- 01 ERD logic; các thực thể suy ra để đáp ứng UC34 được đánh dấu là đề xuất; thực thể `LOCATION` bổ sung tọa độ (`latitude`, `longitude`) phục vụ tính năng Bản đồ.
- 08 Sequence Diagram cho các luồng liên thành phần có ý nghĩa kiến trúc (bổ sung UC07 Geocoding và UC35 Xem bản đồ).
- 01 Component Diagram (bổ sung dịch vụ tích hợp Bản đồ / Geocoding bên ngoài).
- 01 ma trận truy vết (bao phủ đến UC35).

**Ký hiệu:** `Draft` = Bản nháp; `Pending Review` = Chờ duyệt; `Rejected` = Bị từ chối; `Published` = Đã xuất bản; `Removed` = Đã gỡ; `Superseded` = Đã thay thế. `NeedsReview` là cờ rà soát của nội dung bản dịch, **không phải trạng thái phiên bản**.

**Giới hạn nguồn:** đặc tả không quy định chi tiết UI, schema API, nhà cung cấp dịch/TTS/Bản đồ & Geocoding, chiến lược retry/backoff, định dạng event analytics, retention, hay công nghệ triển khai. Hệ thống phụ thuộc vào dịch vụ bản đồ/geocoding bên ngoài để chuyển đổi địa chỉ thành tọa độ và hiển thị bản đồ số; nhà cung cấp cụ thể chưa được lựa chọn và được đưa vào danh sách Câu hỏi mở. Các sơ đồ không tự quyết định các chi tiết đó.

### Tham số cấu hình phi chức năng mặc định (Mục 5.2 tài liệu gốc)
**[ĐÃ SỬA 16/11] (bổ sung, mã D13)** Bổ sung bảng tham số cấu hình đề xuất từ mục 5.2 của tài liệu gốc `dac_ta_use_case_hoan_chinh_v2.docx`:

| Tham số | Giá trị đề xuất | Dùng ở |
|---|---|---|
| Số lần đăng nhập sai liên tiếp trước khi khóa tạm | 5 lần | UC01 |
| Thời gian khóa tạm | 15 phút | UC01 |
| Thời gian phiên không hoạt động | 30 phút | UC01, UC02 |
| Thời hạn mã hoặc liên kết khôi phục mật khẩu | 30 phút | UC04 |
| Định dạng audio tải lên | MP3 | UC22 |
| Dung lượng audio tối đa | 20 MB | UC22 |
| Độ dài văn bản tối đa mỗi nội dung | Theo giới hạn của dịch vụ dịch và TTS được chọn | UC13, UC17, UC20 |

