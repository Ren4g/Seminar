## 9. Checklist kiểm tra chất lượng bộ sơ đồ

- [x] UC Diagram có đủ 35 UC và 6 actor (bổ sung UC35 - Xem bản đồ và Dịch vụ bản đồ & Geocoding).
- [x] 35/35 UC có Activity Diagram riêng (bổ sung UC35 và cập nhật UC07 với luồng Geocoding / chấm tay bản đồ).
- [x] Activity đã được đối chiếu với từng kịch bản phụ của đặc tả; nhánh xóa POI có kiểm tra quyền, nhánh Dừng ở UC29 có đường thoát, bước gọi dịch vụ ngoài luôn đứng sau các bước kiểm tra.
- [x] State Diagram khớp bảng chuyển trạng thái trong đặc tả (mục 1.4), kể cả gửi lại bản Bị từ chối và tạo Draft từ bản phát hành.
- [x] ERD tách Local Storage của Visitor khỏi dữ liệu server; thực thể `LOCATION` bổ sung `latitude`, `longitude` (nullable) và `address`.
- [x] Analytics được mô hình hóa ở mức đề xuất (`ACTIVITY_EVENT`), có ghi rõ cần chốt.
- [x] Sequence tập trung vào tích hợp/backend quan trọng, nhất quán với activity và component (đã bổ sung Sequence UC07 Geocoding và UC35 Xem bản đồ).
- [x] Component Diagram phân biệt kiến trúc đề xuất với yêu cầu nghiệp vụ; đã bổ sung thành phần dịch vụ ngoài Bản đồ & Geocoding.
- [x] Có traceability matrix liền bảng để rà soát độ bao phủ đầy đủ 35 UC.
- [ ] Chưa render thử toàn bộ sơ đồ bằng công cụ; nên mở từng sơ đồ trên trình xem Mermaid/PlantUML trước khi dùng.

**Kết luận:** bộ này bao phủ đầy đủ 35 Use Case ở mức Activity Diagram. Các quyết định ở mục 8 (bao gồm lựa chọn dịch vụ bản đồ và xử lý dữ liệu địa điểm cũ) vẫn cần nhóm xác nhận trước khi xem là thiết kế triển khai cuối cùng.

