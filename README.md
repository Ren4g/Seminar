# Multilingual Audio Guide

Nền tảng ban đầu cho hệ thống thuyết minh tự động đa ngôn ngữ.

## Chạy API

```powershell
npm install
npm run build
npm start
```

Health check: `GET http://localhost:3000/api/health`.

## Chạy giao diện

```powershell
cd web
npm install
npm run dev
```

Mở `http://localhost:5173/` hoặc `http://localhost:5173/visitor` để khám phá địa điểm với tư cách visitor. Mở `http://localhost:5173/visitor?poiId=2&language=vi` để vào thẳng một điểm tham quan. Các route visitor không yêu cầu đăng nhập và đọc nội dung đã xuất bản từ Visitor API.

Nếu trình duyệt hiển thị trang trắng sau khi Vite báo lỗi HMR, hãy dừng terminal Vite cũ, mở lại `npm run dev`, rồi tải lại cứng bằng `Ctrl+F5`. Frontend cần được chạy từ thư mục `web`; nếu cổng 5173 đã bị chiếm, Vite sẽ chuyển sang 5174.

## Chạy môi trường local

Hướng dẫn đầy đủ cho người mới: [clone và chạy local trên Windows](./HUONG_DAN_CLONE_VA_CHAY_LOCAL.md).

Mở PowerShell ở thư mục gốc và chạy đúng thứ tự:

```powershell
npm install
npm run build
npm run db:migrate
npm run db:demo
npm start
```

Giữ terminal backend đang chạy. Mở terminal thứ hai:

```powershell
cd web
npm install
npm run dev
```

Mở `http://localhost:5173/admin` và đăng nhập bằng `admin` / `Admin123!`.
Hệ thống quản trị chỉ có hai role: `ADMIN` (quản trị và kiểm duyệt/xuất bản) và
`CONTENT_MANAGER` (quản lý nội dung theo location được gán). Visitor sử dụng
các route public và không có tài khoản quản trị.
Nếu cổng `3000` đang bị chiếm, dừng process Node cũ trước khi chạy lại backend:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess }
```

Sau khi đăng nhập, tạo hoặc nhập nội dung, sau đó upload audio thật hoặc tạo audio bằng ElevenLabs trước khi publish. Hệ thống không còn endpoint mock audio trong luồng runtime.

### Cấu hình ElevenLabs

Đặt các biến sau trong `.env` backend (không đưa API key vào frontend hoặc commit vào repository):

```env
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
MEDIA_DIR=storage
```

`provider_voice_key` trong bảng `voice` phải là voice ID của ElevenLabs, và phải khớp ngôn ngữ của content. Nút `Tạo audio ElevenLabs` gọi backend, backend gửi text tới ElevenLabs, lưu MP3 vào `MEDIA_DIR/tts` và phục vụ file qua `/media`. Nếu thiếu key, UI hiển thị lỗi cấu hình rõ ràng thay vì giả lập thành công.

Đăng nhập: `POST /api/auth/login` với `{ "username": "...", "password": "..." }`. Cần đặt `JWT_SECRET` trong môi trường chạy thật; mật khẩu được kiểm tra bằng hash trong bảng `app_user`.

Identity/Admin API cần Bearer JWT:

- `POST /api/auth/change-password`
- `GET/POST /api/users`
- `PATCH /api/users/:id/status`
- `POST /api/users/:id/locations/:locationId`
- `GET /api/users/:id/locations`

Catalog bổ sung:

- `PATCH /api/locations/:id/status`, `PATCH /api/pois/:id/status`
- `GET/POST /api/voices`
- `GET /api/qr`, `POST /api/pois/:poiId/qr`

Content/Visitor API:

- Authenticated content workflow: Content Manager gửi `submit`; Admin thực hiện `approve` (sang `APPROVED`) rồi `publish` (sang `PUBLISHED`), hoặc `reject|unpublish|republish`.
- Real ElevenLabs TTS: `POST /api/content/:id/audio/tts` with `{ "voiceId": 1, "modelId": "eleven_multilingual_v2" }`.
- Binary upload: `POST /api/content/:id/audio/upload` as multipart form-data field `file`; only supported audio MIME types and files within `MAX_AUDIO_FILE_BYTES` are accepted.
- Public published content: `GET /api/visitor/pois/:poiId/content?languageCode=vi`.
- QR resolve: `GET /api/visitor/qr/:qrId`.
- QR management: `POST /api/pois/:poiId/qr` tự sinh URL visitor từ `PUBLIC_VISITOR_URL`; không cần gửi `targetUrl`. Danh sách xem tại `GET /api/qr`.
- Anonymous analytics heartbeat/event ingestion: `POST /api/visitor/events`; `eventId` UUID provides idempotency.

## Khởi tạo schema

Sau khi cấu hình biến môi trường PostgreSQL:

```powershell
npm run build
npm run db:migrate
```

The migration command loads `.env` automatically. If PostgreSQL reports `client password must be a string`, verify that `PGPASSWORD` exists in `.env` and is not being overwritten by an empty shell variable.

Migration đọc [schema.sql](./schema.sql) và chạy schema/seed cùng migration nền tảng idempotent trong `migrations/`. Chỉ chạy `schema.sql` trên database mới hoặc database đã xác nhận có thể khởi tạo lại.

## Catalog API hiện có

- `GET /api/languages`
- `POST /api/languages`
- `GET /api/locations`
- `GET /api/locations/:id`
- `POST /api/locations`
- `GET /api/pois?locationId=:id`
- `GET /api/pois/:id`
- `POST /api/locations/:locationId/pois`

Location và POI yêu cầu ít nhất bản dịch tiếng Anh. Catalog hiện dùng PostgreSQL; cấu hình kết nối qua `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` hoặc `DATABASE_URL`. Không commit file `.env` hay mật khẩu vào repository.

## Chạy PostgreSQL cục bộ

```powershell
docker compose up -d postgres
```

`schema.sql` được chạy tự động khi volume PostgreSQL được khởi tạo lần đầu. Health endpoint báo `database: up|down`; nếu dùng PostgreSQL đã có sẵn, hãy chạy schema bằng công cụ quản trị của bạn trước khi gọi Catalog API.

## Cấu trúc khởi đầu

- `src/health`: health endpoint dùng cho readiness/smoke test.
- `src/catalog`: catalog API cho language, location và POI với DTO validation và invariant bản dịch.
- `schema.sql`: schema PostgreSQL hiện tại của domain.
- `docker-compose.yml`: PostgreSQL local với schema initialization.
- `web/src/main.tsx`: visitor landing/audio UI và Content Studio.
- `web/src/api.ts`: typed frontend client for login, content, voices, ElevenLabs TTS, binary upload, workflow, and visitor APIs.
- `web/src/styles.css`: hệ giao diện xanh lá, lime và trung tính lấy cảm hứng từ `Example/`.
- UI CRUD nền: content edit/save, language create/list, location/POI create/list, voice create/list, ElevenLabs audio generation, binary audio upload, playback, workflow transitions and visitor analytics.

Các module Identity, Catalog, Content/Workflow, Media và Visitor/Analytics sẽ được thêm theo plan đã duyệt.
