~~## 5. Sequence Diagram – các luồng liên thành phần trọng yếu~~
**[ĐÃ SỬA 16/11] (loại bỏ vì tài liệu gốc không có, mã D11)** ## 5. Sequence Diagram – các luồng liên thành phần trọng yếu
*(Ghi chú: Tài liệu gốc `dac_ta_use_case_hoan_chinh_v2.docx` chỉ là đặc tả Use Case nghiệp vụ, không quy định Sequence Diagram hay phân tầng kỹ thuật Client-API-DB. Mục 5 được giữ lại dưới dạng đề xuất thiết kế kỹ thuật cho giai đoạn hiện thực hóa hệ thống).*

### 5.1. UC14 – Content Manager gửi duyệt / Administrator xuất bản trực tiếp

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant UI as Admin Web
    participant API as Backend
    participant DB as Database
    U->>UI: Mở Content, chỉnh sửa và lưu
    UI->>API: Save version
    API->>API: Kiểm tra quyền và trạng thái
    API->>DB: Update Draft hoặc tạo Draft mới kế thừa audio
    API->>DB: Đánh dấu audio outdated nếu narration text đổi
    DB-->>API: Kết quả lưu
    API-->>UI: Lưu thành công
    U->>UI: Gửi duyệt hoặc xuất bản phiên bản Draft/Rejected
    UI->>API: Submit/Publish
    API->>API: Kiểm tra có version đang soạn và 5 điều kiện xuất bản
    alt Không đủ điều kiện
        API-->>UI: Từ chối, giữ nguyên trạng thái và trả lý do
    else Content Manager
        API->>DB: Chuyển PendingReview và ghi SUBMIT vào lịch sử
        API-->>UI: Đã gửi duyệt
    else Administrator
        API->>DB: Publish version; supersede bản phát hành cũ
        API->>DB: Đánh dấu NeedsReview cho bản dịch nếu narration text khác bản trước
        API->>DB: Lưu lịch sử và cập nhật bản Visitor
        API-->>UI: Xuất bản thành công
    end
```

### 5.2. UC15 – Kiểm duyệt

```mermaid
sequenceDiagram
    actor Admin
    participant UI as Admin Web
    participant API as Backend
    participant DB as Database
    Admin->>UI: Mở hàng đợi kiểm duyệt
    UI->>API: Lấy PendingReview
    API->>DB: Query versions
    DB-->>API: Danh sách
    API-->>UI: Danh sách chờ duyệt
    Admin->>UI: Chọn version và xem nội dung/audio
    UI->>API: Lấy chi tiết version
    API->>DB: Đọc content, audio, version phát hành
    DB-->>API: Dữ liệu đối chiếu
    API-->>UI: Chi tiết
    Admin->>UI: Phê duyệt hoặc từ chối
    alt Phê duyệt
        UI->>API: Approve
        API->>API: Kiểm tra trạng thái mới nhất và 5 điều kiện
        alt Hợp lệ
            API->>DB: Published; supersede version cũ
            API->>DB: Mark translations NeedsReview nếu source text đổi
            API->>DB: Ghi review history và cập nhật Visitor
            API-->>UI: Published
        else Không hợp lệ
            API-->>UI: Giữ PendingReview, trả lý do
        end
    else Từ chối
        Admin->>UI: Nhập lý do
        UI->>API: Reject(reason)
        API->>DB: Rejected + review history
        API-->>UI: Cập nhật trạng thái/lý do
    end
```

### 5.3. UC17 – Dịch tự động

```mermaid
sequenceDiagram
    actor U as Admin/Content Manager
    participant UI as Admin Web
    participant API as Backend
    participant MT as Translation API
    participant DB as Database
    U->>UI: Chọn source version và target language
    UI->>API: Request translation
    API->>API: Kiểm tra quyền, source, target và ngôn ngữ khác nguồn
    API->>DB: Đọc Content đích và trạng thái version đang soạn
    alt Target PendingReview
        API-->>UI: Từ chối, không gọi dịch vụ
    else Target Draft/Rejected tồn tại
        API-->>UI: Yêu cầu xác nhận ghi đè
        U->>UI: Xác nhận
        UI->>API: Confirm overwrite
    end
    API->>API: Kiểm tra độ dài so với giới hạn đã biết
    alt Vượt giới hạn
        API-->>UI: Gợi ý chia nhỏ, không gọi dịch vụ
    else Trong giới hạn
        API->>MT: Gửi source text
        alt Timeout/provider error
            MT-->>API: Lỗi hoặc không phản hồi
            API-->>UI: Báo lỗi, cho phép thử lại
        else Dịch vụ báo vượt giới hạn
            MT-->>API: Length limit error
            API-->>UI: Gợi ý chia nhỏ văn bản
        else Thành công
            MT-->>API: Translated text
            API->>API: Validate kết quả
            alt Kết quả rỗng/không hợp lệ
                API-->>UI: Không lưu kết quả
            else Hợp lệ
                API->>DB: Lưu Draft (tạo mới, ghi đè hoặc Draft mới), source-version reference, NeedsReview
                API-->>UI: Kết quả
            end
        end
    end
```

### 5.4. UC20 – Tạo audio TTS

```mermaid
sequenceDiagram
    actor U as Admin/Content Manager
    participant UI as Admin Web
    participant API as Backend
    participant TTS as TTS API
    participant FS as File Storage
    participant DB as Database
    U->>UI: Yêu cầu tạo audio
    UI->>API: Generate audio(version)
    API->>DB: Đọc version, text, voice và audio hiện tại
    API->>API: Kiểm tra Draft/Rejected, text, voice và độ dài
    alt Không hợp lệ hoặc quá dài
        API-->>UI: Từ chối, hướng dẫn hoặc gợi ý chia nhỏ
    else Hợp lệ
        opt Đã có audio
            API-->>UI: Yêu cầu xác nhận thay thế
            U->>UI: Xác nhận
            UI->>API: Confirm replacement
        end
        API->>TTS: Gửi text + voice
        alt Provider lỗi/timeout/length limit
            TTS-->>API: Lỗi
            API-->>UI: Báo thất bại hoặc gợi ý chia nhỏ
        else Tạo thành công
            TTS-->>API: Audio file
            API->>API: Validate file
            alt File không hợp lệ
                API-->>UI: Không lưu
            else File hợp lệ
                API->>FS: Lưu audio
                FS-->>API: File reference
                API->>DB: Gắn audio với đúng version
                API-->>UI: Tạo audio thành công
            end
        end
    end
```

### 5.5. UC28/UC29 – Visitor phát và điều khiển audio

```mermaid
sequenceDiagram
    actor V as Visitor
    participant Web as Visitor Web
    participant API as Backend
    participant DB as Database
    participant FS as Audio Storage
    V->>Web: Mở POI và chọn Nghe
    Web->>API: Lấy nội dung Published theo language
    API->>DB: Resolve Published version + audio
    DB-->>API: Version/audio metadata
    API-->>Web: Nội dung và audio reference (fallback English nếu thiếu)
    Web->>FS: Tải audio
    FS-->>Web: Audio stream
    V->>Web: Nhấn Phát
    Web->>API: Ghi nhận AUDIO_START (ẩn danh)
    API->>DB: Lưu event
    loop Trong lúc phát
        V->>Web: Pause/resume/seek/stop
        Web->>Web: Cập nhật player state
        Web->>API: Gửi thời lượng phát thực tế
        API->>DB: Cập nhật/ghi nhận duration event
    end
    Web->>Web: Lưu POI vào Local Storage
```

> Payload event, tần suất gửi duration, session key và cơ chế chống ghi trùng chưa được đặc tả; sequence chỉ biểu diễn điểm tích hợp logic, không chốt giao thức.

### 5.6. UC33 – Quét QR Code

```mermaid
sequenceDiagram
    actor V as Visitor
    participant Cam as Camera/Browser
    participant Web as Visitor Web
    participant API as Backend
    participant DB as Database
    V->>Cam: Quét QR
    Cam->>Web: Mở URL chứa POI
    Web->>API: Resolve POI
    API->>DB: Kiểm tra QR/POI và trạng thái
    DB-->>API: POI data
    alt URL sai/POI không tồn tại
        API-->>Web: POI không tồn tại
    else POI ngừng hoạt động
        API-->>Web: POI không khả dụng
    else POI hoạt động
        Web->>Web: Chọn language đã lưu > browser > English
        Web->>API: Lấy nội dung Published
        API->>DB: Resolve content/version/audio
        DB-->>API: Nội dung theo language hoặc fallback
        API-->>Web: POI page data
        Web->>Web: Hiển thị trang POI
        Web->>API: Ghi QR_OPEN ẩn danh
        API->>DB: Lưu event
    end
```

