## 8. Các điểm cần chốt trước khi triển khai code

**[ĐÃ SỬA 16/11]** Ghi nhận 11 điểm kiến trúc/triển khai kỹ thuật còn bỏ ngỏ do tài liệu gốc `dac_ta_use_case_hoan_chinh_v2.docx` chỉ là đặc tả Use Case nghiệp vụ, không quy định chi tiết kỹ thuật. Cần thống nhất trước khi lập trình. (Lý do: làm rõ nguồn gốc và trạng thái các câu hỏi kỹ thuật, mã lỗi D14).

Đây là các điểm **đặc tả chưa quyết định đủ**, không nên tự mặc định khi code:

1. **Analytics event model:** ghi duration theo từng heartbeat hay gửi tổng thời lượng khi pause/stop/page unload; cách xử lý mất mạng và chống ghi trùng.
2. **Anonymous session key:** UC34 cần phân tích nhưng không được định danh Visitor; cần chốt có dùng session key ngẫu nhiên theo phiên hay không và thời hạn lưu.
3. **Translation overwrite:** khi ghi đè Draft/Rejected, cần xác định giữ version number (cập nhật tại chỗ) hay tạo version mới, và có ghi lịch sử lần dịch trước hay không.
4. **Review history:** `event_type` là đề xuất; cần chốt thời hạn lưu và có lưu cả thu hồi, xóa bản nháp hay không.
5. **QR update/recreate:** nội dung QR là URL POI ổn định; đặc tả nói cập nhật/tạo lại nhưng chưa định nghĩa khi nào URL thay đổi và việc vô hiệu QR cũ.
6. **Delete semantics:** xóa POI chưa từng publish có xóa cứng hay soft delete; chưa quy định audit/retention.
7. **Publish atomicity:** thao tác publish phải đảm bảo chỉ có một version phát hành, version cũ thành Superseded, dịch được đánh NeedsReview, visitor projection và audit history nhất quán. Cần transaction/outbox hoặc cơ chế tương đương.
8. **Audio file lifecycle:** vì nhiều bản ghi audio có thể trỏ cùng một tệp (kế thừa giữa các version), cần cơ chế đếm tham chiếu hoặc dọn tệp mồ côi.
9. **Audio validation:** tiêu chí "tệp tồn tại và không lỗi thời" là điều kiện xuất bản; kiểm tra codec/duration/checksum/scan file chưa được quy định ngoài định dạng/dung lượng ở UC22.
10. **Reset password và session:** hạn mã khôi phục, vô hiệu phiên sau khi đổi hoặc reset mật khẩu, chính sách mật khẩu cụ thể chưa nêu. Các con số ở mục 5.2 của đặc tả là giá trị đề xuất.
11. **Nhà cung cấp dịch và TTS:** chưa chọn, nên giới hạn độ dài, danh sách giọng và chi phí thực tế chưa biết.

### Đã chốt trong bản v3 (so với v2)

- Phiên bản **Bị từ chối** được gửi duyệt lại hoặc xuất bản trực tiếp mà không cần sửa; state diagram và UC14 đã khớp nhau.
- UC17 và UC20 **kiểm tra trạng thái đích và độ dài trước khi gọi dịch vụ ngoài** để không tốn chi phí.
- Mỗi version có bản ghi audio riêng; version mới kế thừa audio bằng bản ghi mới trỏ cùng tệp.
- Nguồn dịch (`translation_source_version_id`) nằm ở từng version; cờ lỗi thời chỉ ở `AUDIO.is_outdated`; thêm `ACTIVITY_EVENT`, `source_type` của audio, `selected_voice_id`.
- Component: sự kiện Visitor đi qua Backend; thêm các phụ thuộc còn thiếu.
- Sửa các nhánh lỗi ở activity UC01, UC05, UC07, UC09, UC10, UC14, UC16, UC17, UC20, UC26, UC28, UC29, UC32.

