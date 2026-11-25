# CẨM NANG HƯỚNG DẪN SỬA CODE FRONT-END BẰNG TAY (BẢO VỆ ĐỒ ÁN)

> **Dành cho:** Sinh viên bảo vệ đồ án tốt nghiệp Web thuyết minh tự động đa ngôn ngữ cho khu du lịch.  
> **Mục tiêu:** Khi Giảng viên / Hội đồng chỉ vào một tính năng trên màn hình hoặc một bước trong Activity Diagram và yêu cầu sửa trực tiếp, bạn có thể **mở đúng file, sửa đúng dòng trong 3 - 5 giây**.

---

## 1. SƠ ĐỒ CẤU TRÚC THƯ MỤC DỰ ÁN FRONT-END (`Seminar/web/src/`)

```text
Seminar/web/src/
├── main.tsx                           # Điểm khởi động ứng dụng: Phân luồng /admin hoặc /visitor
├── styles.css                         # Toàn bộ mã màu, giao diện, font chữ, bố cục của hệ thống
├── api.ts                             # Bộ hàm gọi API Backend (NestJS / RESTful API)
├── LocationMapPicker.tsx              # Component bản đồ Leaflet cho phép chấm tay tọa độ (Admin)
├── VisitorMap.tsx                     # Bản đồ số du lịch hiển thị các cụm di tích và POI (Visitor)
│
├── types/                             # KIỂU DỮ LIỆU TYPESCRIPT
│   └── content.ts                     # Định nghĩa ContentItem (bài viết) và Status (vòng đời bài viết)
│
├── constants/                         # DỮ LIỆU CỐ ĐỊNH & CẤU HÌNH HỆ THỐNG
│   ├── languages.ts                   # 10 ngôn ngữ gợi ý cấu hình và ElevenLabs voice ID mặc định
│   └── visitorCopy.ts                 # Toàn bộ câu từ hiển thị trên giao diện khách (Song ngữ VI / EN)
│
├── utils/                             # HÀM TIỆN ÍCH DÙNG CHUNG
│   ├── formatters.ts                  # Hàm formatTime (phút:giây), languageName (tên thứ tiếng), mapContent
│   ├── session.ts                     # Hàm safeRandomUUID và getVisitorSessionKey (phiên ẩn danh)
│   └── mapIcons.ts                    # Biểu tượng ghim Marker Leaflet tùy biến (Ghim Visitor và Ghim chấm tọa độ)
│
├── hooks/                             # LOGIC & KẾT NỐI API RIÊNG BIỆT
│   ├── useVisitorSession.ts           # Gửi heartbeat khách online và ghi nhận Analytics (PAGE_VIEW, QR_OPEN)
│   ├── useVisitorData.ts              # Nạp danh sách địa điểm, POI, bài viết và lịch sử nghe LocalStorage
│   ├── useAdminData.ts                # Nạp danh sách quản trị: bài viết, POI, voices, languages từ Backend
│   └── useContentWorkflow.ts          # Xử lý quy trình: Lưu nháp, Dịch AI, TTS ElevenLabs, Duyệt, Xuất bản
│
├── components/
│   ├── common/                        # THÀNH PHẦN GIAO DIỆN DÙNG CHUNG
│   │   ├── Icon.tsx                   # Component bọc icon trợ năng
│   │   └── StatusBadge.tsx            # Huy hiệu màu trạng thái: Đã xuất bản, Chờ duyệt, Cần rà soát...
│   │
│   ├── visitor/                       # CÁC THÀNH PHẦN GIAO DIỆN KHÁCH THAM QUAN
│   │   ├── VisitorHeader.tsx          # Menu đầu trang: Logo, chọn Khám phá/Bản đồ, dropdown Ngôn ngữ
│   │   ├── VisitorFooter.tsx          # Chân trang: Slogan và bản quyền
│   │   ├── VisitorShell.tsx           # Khung bố cục dùng chung (Header + Nội dung + Footer)
│   │   ├── VisitorHero.tsx            # Khung chào mừng trang chủ: Slogan và nút "Khám phá", "Xem bản đồ"
│   │   ├── VisitorFeatured.tsx        # Top 3 điểm tham quan nổi bật (đánh số 01, 02, 03)
│   │   ├── VisitorPlacesList.tsx      # Danh sách các khu di tích và điểm tham quan con
│   │   ├── VisitorHistory.tsx         # Khung lịch sử nghe trên máy: Nút xóa tất cả, xóa từng bài
│   │   ├── VisitorDetailHeader.tsx    # Ảnh bìa di tích, thông báo ngôn ngữ fallback, tiêu đề bài viết
│   │   ├── VisitorAudioPlayer.tsx     # Trình phát audio chính: Play/Pause, tua ±15s, thanh trượt, đổi tốc độ
│   │   ├── VisitorStickyPlayer.tsx    # Thanh mini player ghim dưới đáy màn hình khi cuộn trang
│   │   ├── VisitorTranscript.tsx      # Khung bản chép lời (Transcript) có nút bấm mở rộng/thu gọn (+/-)
│   │   ├── VisitorDetailActions.tsx   # Gợi ý điểm tiếp theo, nút Chia sẻ (Web Share) và Báo lỗi nội dung
│   │   ├── VisitorMapToolbar.tsx      # Thanh công cụ bản đồ: Đếm số địa điểm có tọa độ và nút xem danh sách
│   │   └── VisitorMapPopup.ts         # Khởi tạo Popup Leaflet chi tiết điểm và nút nghe thuyết minh
│   │
│   └── admin/                         # CÁC THÀNH PHẦN GIAO DIỆN QUẢN TRỊ VIÊN
│       ├── AdminSidebar.tsx           # Thanh menu bên trái (6 tab, đếm bài chờ duyệt, đăng xuất)
│       ├── AdminTopbar.tsx            # Thanh trên cùng: Breadcrumb, chuông thông báo, nút "+ Tạo nội dung"
│       ├── OverviewPanel.tsx          # Tab Tổng quan: Các thẻ số liệu bài viết, POI, lượt mở QR, khách online
│       ├── UserPanel.tsx              # Tab Người dùng: Tạo tài khoản, phân quyền, gán địa điểm phụ trách
│       ├── QrPanel.tsx                # Tab QR code: Chọn POI tạo mã QR, tải ảnh PNG in ấn, mở visitor
│       ├── LanguageVoicesPanel.tsx    # Tab Ngôn ngữ & Giọng đọc: Điều phối quản trị ngôn ngữ & voices
│       ├── LanguageCreateForm.tsx     # Form thêm cấu hình ngôn ngữ & voice ElevenLabs
│       ├── LanguageTable.tsx          # Bảng ngôn ngữ (bật/tắt) và accordion danh sách voice (đặt mặc định, xóa)
│       ├── LocationPoiPanel.tsx       # Tab Địa điểm & POI: Điều phối danh mục di tích và điểm tham quan
│       ├── LocationCreateForm.tsx     # Form tạo Địa điểm (nhập địa chỉ, tra cứu Geocode, chấm tay bản đồ)
│       ├── PoiCreateForm.tsx          # Form tạo POI trực thuộc Địa điểm cha
│       ├── LocationTable.tsx          # Bảng danh sách Địa điểm (nút Sửa, Bật/Tắt, Xóa)
│       ├── PoiTable.tsx               # Bảng danh sách Điểm tham quan (nút Bật/Tắt, Xóa)
│       ├── LocationEditModal.tsx      # Popup sửa Địa điểm: Cập nhật tên, địa chỉ, tra lại tọa độ bản đồ
│       ├── ContentFilters.tsx         # Bộ lọc bài viết: Tabs lọc trạng thái, ô tìm kiếm, xem Danh sách/Ma trận
│       ├── ContentListTable.tsx       # Chế độ xem danh sách bài viết (ngôn ngữ, tên, trạng thái, thời gian)
│       ├── ContentMatrixTable.tsx     # Chế độ xem ma trận: Đối chiếu điểm tham quan x Các cột ngôn ngữ
│       ├── ContentDetailStudio.tsx    # Khung soạn thảo: Đối chiếu bản nguồn, thanh 4 bước, sửa tiêu đề/văn bản
│       ├── ContentReadinessCard.tsx   # Khung kiểm tra 4 điều kiện gửi duyệt & nút xác nhận rà soát
│       ├── ContentAudioConsole.tsx    # Khung nghe thử file audio bài viết
│       ├── ContentWorkflowActions.tsx # Điều phối các nút tác vụ phía dưới Content Studio
│       ├── ContentTranslateAction.tsx # Chọn ngôn ngữ đích và nút kích hoạt AI dịch tự động
│       ├── ContentAudioAction.tsx     # Tải lên file MP3 và nút tạo giọng đọc ElevenLabs
│       ├── ContentLifecycleButtons.tsx# Cụm nút: Lưu nháp, Xóa bài, Gửi duyệt, Duyệt, Từ chối, Xuất bản
│       ├── CreateContentModal.tsx     # Popup tạo bài thuyết minh mới dạng bản nháp
│       ├── ContentHistoryModal.tsx    # Popup xem lịch sử workflow (ai duyệt, lý do từ chối, thời gian)
│       └── VisitorPreviewModal.tsx    # Popup xem trước giao diện và nghe thử như khách tham quan
│
└── pages/                             # CÁC MÀN HÌNH ĐIỀU PHỐI CHÍNH
    ├── visitor/
    │   ├── VisitorHomePage.tsx        # Màn hình Trang chủ khách tham quan
    │   ├── VisitorDetailPage.tsx      # Màn hình Chi tiết bài thuyết minh điểm tham quan
    │   └── VisitorApp.tsx             # Điều phối toàn bộ phân hệ khách tham quan
    └── admin/
        ├── LoginScreen.tsx            # Màn hình Đăng nhập quản trị viên
        └── AdminApp.tsx               # Điều phối toàn bộ phân hệ quản trị Content Studio
```

---

## 2. BẢNG TRA CỨU NHANH: THẦY YÊU CẦU ➔ FILE CẦN MỞ ➔ CHỖ CẦN SỬA

| Thầy yêu cầu / Tính năng cần sửa | Bước Activity Diagram | File cần mở | Hàm / Khu vực cần sửa |
| :--- | :--- | :--- | :--- |
| **Đổi chữ hiển thị trên giao diện khách** (nút bấm, slogan, tiêu đề banner...) | Hiển thị đa ngôn ngữ | `src/constants/visitorCopy.ts` | Sửa chuỗi trong object `vi` hoặc `en` |
| **Thêm 1 ngôn ngữ mới vào hệ thống** | Thiết lập ngôn ngữ | `src/constants/languages.ts` | Thêm vào mảng `PRESET_LANGUAGES` |
| **Đổi số giây tua audio** (thầy bảo đổi từ 15s thành 30s hoặc 10s) | Điều khiển phát audio | `src/components/visitor/VisitorAudioPlayer.tsx` | Sửa biến `SEEK_SECONDS = 15;` ở đầu file |
| **Đổi dải tốc độ đọc** (0.75x -> 2x) | Điều khiển phát audio | `src/components/visitor/VisitorAudioPlayer.tsx` | Sửa hàm `onSetRate()` |
| **Sửa màu nút Play hoặc thanh tua** | Giao diện phát nhạc | `src/styles.css` | Tìm class `.visitor-audio-play`, `.visitor-audio-progress` |
| **Sửa thanh phát audio mini ghim đáy** | Nghe thuyết minh liên tục | `src/components/visitor/VisitorStickyPlayer.tsx` | Khối `.visitor-sticky-player` |
| **Sửa bản chép lời (Transcript)** | Xem văn bản đồng bộ | `src/components/visitor/VisitorTranscript.tsx` | Thẻ `.visitor-transcript-text` |
| **Ẩn / Hiện phần Lịch sử nghe** | Quản lý lịch sử nghe | `src/pages/visitor/VisitorHomePage.tsx` | Bỏ hoặc thêm thẻ `<VisitorHistory />` |
| **Sửa dropdown chọn ngôn ngữ của khách** | Khách chọn ngôn ngữ | `src/components/visitor/VisitorHeader.tsx` | Khối thẻ `<select>` trong `VisitorHeader` |
| **Sửa top 3 điểm tham quan nổi bật** | Xem điểm nổi bật | `src/components/visitor/VisitorFeatured.tsx` | Sửa biến `FEATURED_COUNT = 3;` |
| **Sửa form thêm bài thuyết minh mới** | Tạo bản nháp (Draft) | `src/components/admin/CreateContentModal.tsx` | Thẻ `<form className="modal-card">` |
| **Sửa quy trình AI Dịch tự động** | Dịch thuật AI đa ngữ | `src/components/admin/ContentTranslateAction.tsx` | Nút `Dịch tự động` & hàm `translateSelected` trong `useContentWorkflow.ts` |
| **Sửa tạo giọng đọc ElevenLabs / Upload MP3** | Tạo âm thanh thuyết minh | `src/components/admin/ContentAudioAction.tsx` | Nút `Tạo audio ElevenLabs` & `uploadAudio` trong `useContentWorkflow.ts` |
| **Sửa 4 điều kiện gửi duyệt bài viết** | Kiểm tra điều kiện gửi duyệt | `src/components/admin/ContentReadinessCard.tsx` | Khối `<ul>` và các biến kiểm tra `hasTitle`, `hasBody`, `audioReady` |
| **Sửa nút Gửi duyệt / Duyệt / Từ chối / Xuất bản** | Quản lý vòng đời (Workflow) | `src/components/admin/ContentLifecycleButtons.tsx` | Các thẻ `<button>` tương ứng từng trạng thái |
| **Sửa lý do từ chối bài viết** | Từ chối nội dung | `src/hooks/useContentWorkflow.ts` | Hàm `transitionSelected()` dòng có `window.prompt` |
| **Sửa bản đồ chấm tọa độ di tích** | Định vị GPS / Tọa độ | `src/components/admin/LocationCreateForm.tsx` & `LocationEditModal.tsx` | Thẻ `<LocationMapPicker />` |
| **Sửa chức năng tra cứu Geocoding** | Định vị tự động từ địa chỉ | `src/components/admin/LocationPoiPanel.tsx` | Hàm `triggerGeocode()` |
| **Sửa kích thước ảnh QR / Tải ảnh PNG** | Tạo mã QR cho di tích | `src/components/admin/QrPanel.tsx` | Thẻ `<QRCodeCanvas size={224} />` và hàm `download()` |
| **Sửa phân quyền người dùng (Role)** | Quản trị tài khoản | `src/components/admin/UserPanel.tsx` | Thẻ `<select value={form.roleName}>` |
| **Sửa chu kỳ tự động làm mới (15s)** | Đồng bộ dữ liệu | `src/hooks/useAdminData.ts` & `useVisitorData.ts` | Biến `AUTO_REFRESH_INTERVAL_MS = 15_000;` |
| **Sửa chu kỳ đếm khách online (Heartbeat)** | Thống kê thời gian thực | `src/hooks/useVisitorSession.ts` | Biến `HEARTBEAT_INTERVAL_MS = 30_000;` |

---

## 3. CÁCH TÌM CODE BẰNG TAY CỰC NHANH TRÊN VS CODE

### Cách 1: Tìm theo nhãn tính năng chuẩn hóa (Khuyên dùng số 1)
Toàn bộ mã nguồn đã được gắn comment thống nhất theo mẫu:
`// [TÍNH NĂNG: tên tính năng]`

👉 **Thao tác:**
1. Nhấn tổ hợp phím **`Ctrl + Shift + F`** (hoặc `Cmd + Shift + F` trên macOS) để mở bảng tìm kiếm toàn dự án.
2. Gõ:
   - `[TÍNH NĂNG: Tua` ➔ Dẫn thẳng tới code tua 15 giây.
   - `[TÍNH NĂNG: Dịch` ➔ Dẫn thẳng tới code AI dịch tự động.
   - `[TÍNH NĂNG: ElevenLabs` ➔ Dẫn thẳng tới code tạo giọng đọc.
   - `[TÍNH NĂNG: Gửi duyệt` ➔ Dẫn thẳng tới nút chuyển trạng thái gửi duyệt.
   - `[TÍNH NĂNG: QR` ➔ Dẫn thẳng tới khối tạo và tải mã QR.
   - `[TÍNH NĂNG: Bản đồ` ➔ Dẫn thẳng tới bản đồ và chấm tọa độ.

### Cách 2: Tìm theo chữ hiển thị trên màn hình
Khi thầy chỉ vào một chữ bất kỳ trên trình duyệt (ví dụ: *"Bản chép lời"*, *"Lịch sử nghe trên thiết bị"*, *"Điều kiện gửi duyệt"*):
1. Bấm **`Ctrl + Shift + F`**.
2. Dán nguyên đoạn chữ đó vào ô tìm kiếm.
3. Nếu là chữ ở giao diện khách, bạn sẽ thấy nó nằm ngay trong `visitorCopy.ts`!

### Cách 3: Dùng F12 (DevTools) để soi Component
1. Bấm phím **F12** trên trình duyệt (hoặc chuột phải vào phần tử -> chọn **Inspect / Kiểm tra**).
2. Nhìn vào tên class CSS của phần tử đó (ví dụ: `visitor-audio-card`, `qr-card`, `readiness-card`).
3. Bấm **`Ctrl + P`** trong VS Code gõ tên gần giống tên class đó là thấy ngay file Component tương ứng!

---

## 4. 8 TÌNH HUỐNG THỰC TẾ HAY BỊ HỎI VÀ CÁCH SỬA TỪNG BƯỚC

### Tình huống 1: Thầy bảo "Đổi nút tua từ 15 giây thành 30 giây"
1. Mở file: `Seminar/web/src/components/visitor/VisitorAudioPlayer.tsx`.
2. Ngay dòng 18 dưới phần comment header, sửa:
   ```typescript
   // Từ:
   export const SEEK_SECONDS = 15;
   // Đổi thành:
   export const SEEK_SECONDS = 30;
   ```
3. Bấm `Ctrl + S`. Trình duyệt tự reload, nút sẽ đổi thành `-30 giây` và `+30 giây` và tua đúng 30 giây!

### Tình huống 2: Thầy bảo "Đổi câu khẩu hiệu (slogan) trên trang chủ"
1. Mở file: `Seminar/web/src/constants/visitorCopy.ts`.
2. Tìm tới dòng `heroLine1`, `heroLine2`:
   ```typescript
   heroLine1: 'Mỗi điểm đến,',
   heroLine2: 'một câu chuyện riêng.',
   ```
3. Đổi thành chữ thầy muốn. Bấm `Ctrl + S`. Xong ngay!

### Tình huống 3: Thầy bảo "Thêm Tiếng Hàn hoặc Tiếng Nga vào danh sách gợi ý"
1. Mở file: `Seminar/web/src/constants/languages.ts`.
2. Nhìn vào mảng `PRESET_LANGUAGES`. Muốn thêm tiếng Hàn, thêm 1 dòng:
   ```typescript
   { code: 'ko', name: 'Tiếng Hàn (Korean)', defaultVoice: 'ErXwobaYiN019PkySvjV' },
   ```
3. Bấm `Ctrl + S`. Vào tab *Ngôn ngữ & giọng đọc* trong Admin sẽ thấy ngay trong danh sách!

### Tình huống 4: Thầy bảo "Bỏ bớt nút hoặc đổi màu nút Play thành màu khác"
1. Mở file: `Seminar/web/src/styles.css`.
2. Bấm `Ctrl + F` tìm `.visitor-audio-play`.
3. Sửa thuộc tính `background`:
   ```css
   .visitor-audio-play {
     /* background: var(--coral); */
     background: #2563eb; /* Đổi sang màu xanh dương */
   }
   ```
4. Bấm `Ctrl + S`. Nút tròn Play lập tức đổi màu!

### Tình huống 5: Thầy bảo "Ẩn mục Lịch sử nghe trên trang chủ"
1. Mở file: `Seminar/web/src/pages/visitor/VisitorHomePage.tsx`.
2. Kéo xuống cuối file, đặt dấu chú thích `//` hoặc `/* ... */` quanh thẻ `<VisitorHistory />`:
   ```tsx
   {/* <VisitorHistory
       history={history}
       language={language}
       copy={copy}
       onClearHistory={onClearHistory}
       onRemoveItem={onRemoveHistoryItem}
   /> */}
   ```
3. Bấm `Ctrl + S`. Phần lịch sử nghe biến mất ngay trên giao diện!

### Tình huống 6: Thầy bảo "Cho phép gửi duyệt mà không cần phải có audio"
1. Mở file: `Seminar/web/src/components/admin/ContentLifecycleButtons.tsx`.
2. Tìm dòng khai báo biến `canSubmit`:
   ```typescript
   // Từ:
   const canSubmit = fieldsReady && audioReady && !selected.needsReview && !isDirty;
   // Đổi thành (bỏ điều kiện audioReady):
   const canSubmit = fieldsReady && !selected.needsReview && !isDirty;
   ```
3. Bấm `Ctrl + S`. Nút "Gửi duyệt" sẽ sáng lên cho bấm ngay cả khi chưa có audio!

### Tình huống 7: Thầy bảo "Đổi kích thước mã QR in ra to hơn"
1. Mở file: `Seminar/web/src/components/admin/QrPanel.tsx`.
2. Bấm `Ctrl + F` tìm `size={224}`.
3. Đổi số `224` thành `300` hoặc `400`. Bấm `Ctrl + S`. Mã QR trên giao diện to lên lập tức.

### Tình huống 8: Thầy bảo "Đổi thời gian tự động đồng bộ từ 15 giây thành 5 giây"
1. Mở file: `Seminar/web/src/hooks/useAdminData.ts` (cho Admin) và `Seminar/web/src/hooks/useVisitorData.ts` (cho Visitor).
2. Sửa hằng số ở đầu file:
   ```typescript
   // Từ 15 giây (15_000 ms) đổi thành 5 giây (5_000 ms):
   const AUTO_REFRESH_INTERVAL_MS = 5_000;
   ```
3. Bấm `Ctrl + S`. Hệ thống sẽ đồng bộ mỗi 5 giây!

---

## 5. NẾU SỬA XONG BỊ LỖI (CÁCH CỨU NGUY BẰNG GIT & CHẠY LẠI)

Trong lúc bảo vệ, nếu bạn lỡ tay sửa nhầm cú pháp dẫn đến màn hình bị trắng hoặc báo lỗi đỏ, **hãy bình tĩnh** thực hiện các bước sau:

### Cách 1: Hoàn tác 1 file vừa sửa về trạng thái cũ bằng Git (Khuyên dùng)
Mở cửa sổ Terminal (PowerShell / Command Prompt) tại thư mục dự án và gõ:

```powershell
# 1. Xem file nào đang bị sửa đổi:
git status

# 2. Hoàn tác file vừa sửa bị lỗi (Ví dụ file VisitorAudioPlayer.tsx):
git checkout -- Seminar/web/src/components/visitor/VisitorAudioPlayer.tsx

# 3. Hoặc nếu muốn hoàn tác TẤT CẢ các file vừa sửa để về trạng thái chuẩn ban đầu:
git checkout -- .
```

### Cách 2: Khôi phục từ file sao lưu gốc
Dự án đã có sẵn file sao lưu gốc an toàn:
`Seminar/web/src/main.backup.tsx`
Nếu cần xem lại bất kỳ đoạn code gốc nào trước khi tách, bạn chỉ cần mở file `main.backup.tsx`.

### Cách 3: Kiểm tra xem code có lỗi biên dịch TypeScript không
Mỗi khi sửa xong một tính năng, bạn có thể gõ lệnh sau ở Terminal để kiểm tra trước:
```powershell
npm --prefix Seminar/web run build
```
Nếu màn hình hiện chữ xanh `✓ built in ...ms` nghĩa là code hoàn toàn chuẩn xác 100%, không có bất kỳ lỗi cú pháp nào!

### Cách 4: Chạy lại máy chủ Front-end nếu bị dừng
```powershell
# Di chuyển vào thư mục web:
cd Seminar/web

# Chạy server ở chế độ phát triển:
npm run dev
```
Trình duyệt mở tại: `http://localhost:5173` (cho Visitor) hoặc `http://localhost:5173/admin` (cho Quản trị viên).

---
*Chúc bạn có một buổi bảo vệ đồ án thành công rực rỡ và đạt điểm số cao nhất!*
