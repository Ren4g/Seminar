## 9. Checklist kiểm tra chất lượng bộ sơ đồ

- [x] UC Diagram có đủ 34 UC và 5 actor; có quan hệ `extend` UC19 → UC20 theo UC20 bước 3.
- [x] 34/34 UC có Activity Diagram riêng.
- [x] Activity đã được đối chiếu với từng kịch bản phụ của đặc tả v2; nhánh xóa POI có kiểm tra quyền, nhánh Dừng ở UC29 có đường thoát, bước gọi dịch vụ ngoài luôn đứng sau các bước kiểm tra.
- [x] State Diagram khớp bảng chuyển trạng thái trong đặc tả (mục 1.4), kể cả gửi lại bản Bị từ chối và tạo Draft từ bản phát hành.
- [x] ERD tách Local Storage của Visitor khỏi dữ liệu server; không còn dữ liệu trùng giữa version và audio.
- [x] Analytics được mô hình hóa ở mức đề xuất (`ACTIVITY_EVENT`), có ghi rõ cần chốt.
- [x] Sequence tập trung vào tích hợp/backend quan trọng, nhất quán với activity và component.
- [x] Component Diagram phân biệt kiến trúc đề xuất với yêu cầu nghiệp vụ.
- [x] Có traceability matrix liền bảng để rà soát độ bao phủ.
- [ ] Chưa render thử toàn bộ sơ đồ bằng công cụ; nên mở từng sơ đồ trên trình xem Mermaid/PlantUML trước khi dùng.

**Kết luận:** bộ này bao phủ đầy đủ 34 Use Case ở mức Activity Diagram. Các quyết định ở mục 8 vẫn cần nhóm xác nhận trước khi xem là thiết kế triển khai cuối cùng.

