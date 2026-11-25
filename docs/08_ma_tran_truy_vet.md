## 7. Ma trận truy vết UC – Activity – Sequence – Entity

| UC | Activity | Sequence | Entity/chủ thể dữ liệu chính |
|---|---|---|---|
| UC01 – Đăng nhập | Có | — | USER, ROLE, Session (hạ tầng) |
| UC02 – Đăng xuất | Có | — | Session (hạ tầng) |
| UC03 – Đổi mật khẩu | Có | — | USER |
| UC04 – Khôi phục mật khẩu | Có | — | USER, ResetToken (hạ tầng) |
| UC05 – Quản lý tài khoản nhân sự | Có | — | USER, ROLE, USER_LOCATION_ASSIGNMENT, LOCATION |
| UC06 – Xem danh sách và chi tiết địa điểm | Có | — | LOCATION, LOCATION_TRANSLATION |
| UC07 – Quản lý địa điểm | Có | 5.7 | LOCATION, LOCATION_TRANSLATION |
| UC08 – Xem danh sách và chi tiết POI | Có | — | POI, POI_TRANSLATION, LOCATION |
| UC09 – Quản lý POI | Có | — | POI, POI_TRANSLATION, LOCATION |
| UC10 – Quản lý ngôn ngữ | Có | — | LANGUAGE |
| UC11 – Thiết lập giọng đọc mặc định theo ngôn ngữ | Có | — | LANGUAGE, VOICE, LANGUAGE_DEFAULT_VOICE |
| UC12 – Xem danh sách và chi tiết nội dung thuyết minh | Có | — | NARRATION_CONTENT, CONTENT_VERSION, AUDIO, REVIEW_HISTORY |
| UC13 – Tạo nội dung thuyết minh | Có | — | NARRATION_CONTENT, CONTENT_VERSION, POI, LANGUAGE |
| UC14 – Cập nhật và gửi duyệt nội dung thuyết minh | Có | 5.1 | NARRATION_CONTENT, CONTENT_VERSION, AUDIO, REVIEW_HISTORY |
| UC15 – Kiểm duyệt và xuất bản nội dung | Có | 5.2 | CONTENT_VERSION, AUDIO, REVIEW_HISTORY |
| UC16 – Gỡ xuất bản và xuất bản lại nội dung | Có | — | CONTENT_VERSION, REVIEW_HISTORY |
| UC17 – Yêu cầu dịch tự động | Có | 5.3 | CONTENT_VERSION (translation_source_version_id), NARRATION_CONTENT (needs_review), LANGUAGE |
| UC18 – Rà soát và chỉnh sửa bản dịch | Có | — | NARRATION_CONTENT, CONTENT_VERSION |
| UC19 – Chọn giọng đọc | Có | — | CONTENT_VERSION (selected_voice_id), VOICE, LANGUAGE_DEFAULT_VOICE |
| UC20 – Yêu cầu tạo audio TTS | Có | 5.4 | CONTENT_VERSION, AUDIO, VOICE |
| UC21 – Nghe thử audio | Có | — | AUDIO |
| UC22 – Quản lý audio | Có | — | AUDIO, CONTENT_VERSION |
| UC23 – Truy cập trang web thuyết minh | Có | — | ACTIVITY_EVENT (đề xuất) |
| UC24 – Chọn ngôn ngữ sử dụng | Có | — | LANGUAGE; Local Storage |
| UC25 – Duyệt và chọn địa điểm tham quan | Có | — | LOCATION, LOCATION_TRANSLATION |
| UC26 – Xem danh sách POI | Có | — | POI, POI_TRANSLATION |
| UC27 – Xem nội dung thuyết minh | Có | — | NARRATION_CONTENT, CONTENT_VERSION |
| UC28 – Nghe thuyết minh | Có | 5.5 | CONTENT_VERSION, AUDIO, ACTIVITY_EVENT; Local Storage |
| UC29 – Điều khiển trình phát audio | Có | 5.5 | ACTIVITY_EVENT (đề xuất) |
| UC30 – Chuyển ngôn ngữ thuyết minh | Có | — | LANGUAGE, CONTENT_VERSION; Local Storage |
| UC31 – Xem lịch sử nghe trên thiết bị | Có | — | Local Storage (không phải server ERD) |
| UC32 – Quản lý QR Code cho POI | Có | — | QR_CODE, POI |
| UC33 – Quét QR Code và truy cập POI | Có | 5.6 | QR_CODE, POI, CONTENT_VERSION, ACTIVITY_EVENT |
| UC34 – Xem thống kê hoạt động | Có | — | ACTIVITY_EVENT (đề xuất); LOCATION_TRANSLATION, POI_TRANSLATION |
| UC35 – Xem bản đồ | Có | 5.8 | LOCATION, LOCATION_TRANSLATION |

