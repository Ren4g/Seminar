# Hướng dẫn clone và chạy Audio Guide trên máy cá nhân

Hướng dẫn này dành cho Windows và PowerShell. Bạn sẽ chạy PostgreSQL bằng Docker, API ở cổng `3000` và giao diện ở cổng `5173`.

## 1. Cài công cụ cần thiết

Cài các công cụ sau trước khi bắt đầu:

- Git
- Node.js `20.19+` hoặc `22.12+` (Vite 8 yêu cầu một trong các phiên bản này)
- Docker Desktop đã khởi động

Mở PowerShell và kiểm tra:

```powershell
git --version
node --version
npm.cmd --version
docker compose version
```

## 2. Clone repository

Thay URL và tên thư mục mẫu bên dưới bằng thông tin repository bạn được cung cấp:

```powershell
git clone "<URL_GIT_CUA_DU_AN>"
Set-Location "<TEN_THU_MUC_VUA_CLONE>"
```

Ví dụ, nếu thư mục vừa clone tên là `Seminar`, chạy `Set-Location "Seminar"`.

## 3. Cấu hình môi trường

Tạo file cấu hình local từ file mẫu:

```powershell
Copy-Item .env.example .env
notepad .env
```

Trong `.env`, dùng các giá trị PostgreSQL khớp với `docker-compose.yml`:

```env
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=audio_guide
PGUSER=guide
PGPASSWORD=guide
```

Đổi `JWT_SECRET=...` thành một chuỗi ngẫu nhiên. Bạn có thể tạo chuỗi bằng lệnh sau rồi dán kết quả vào `.env`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Lưu file và đóng Notepad. Không commit `.env` lên Git. Các khóa `ELEVENLABS_API_KEY` và `GOOGLE_TRANSLATE_API_KEY` chỉ cần cấu hình khi dùng các tính năng tương ứng.

## 4. Khởi động database và nạp dữ liệu demo

Chạy các lệnh ở thư mục gốc repository:

```powershell
docker compose up -d postgres
npm.cmd install
npm.cmd run build
npm.cmd run db:migrate
npm.cmd run db:demo
```

Lệnh demo tạo tài khoản admin và nội dung mẫu. Mật khẩu mặc định là `Admin123!`.

## 5. Chạy API

Trong terminal PowerShell thứ nhất, vẫn ở thư mục gốc repository:

```powershell
npm.cmd run start:dev
```

Để nguyên terminal này mở. Trước khi chạy giao diện, có thể kiểm tra API và database trong terminal PowerShell thứ hai:

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Kết quả bình thường có `status` là `ok` và `database` là `up`.

## 6. Chạy giao diện

Mở terminal PowerShell thứ hai, chuyển vào thư mục giao diện rồi chạy:

```powershell
Set-Location "web"
npm.cmd install
npm.cmd run dev
```

Mở địa chỉ Vite in trong terminal, thường là `http://localhost:5173`:

- Trang visitor: `http://localhost:5173/`
- Trang đăng nhập admin: `http://localhost:5173/admin`
- Mở thẳng POI demo: `http://localhost:5173/visitor?poiId=2&language=vi`

Đăng nhập bằng `admin` / `Admin123!`. Nếu bạn đặt `DEMO_ADMIN_PASSWORD` trong `.env` trước khi chạy seed, dùng mật khẩu đó thay thế.

## 7. Dừng các dịch vụ

Nhấn `Ctrl+C` trong hai terminal đang chạy API và Vite. Để dừng PostgreSQL nhưng giữ dữ liệu local, chạy từ thư mục gốc:

```powershell
docker compose stop postgres
```

Lần sau có thể khởi động lại bằng `docker compose start postgres`, rồi chạy lại API và giao diện.

## Một vài lỗi thường gặp

- **Database không kết nối được:** kiểm tra Docker Desktop đang chạy, sau đó đối chiếu `PGUSER`, `PGPASSWORD`, `PGDATABASE` trong `.env` với các giá trị ở bước 3.
- **Cổng 5432 đang được dùng:** dừng PostgreSQL khác đang chạy hoặc đổi cổng host trong `docker-compose.yml` và cập nhật `PGPORT` cho khớp.
- **API báo lỗi thiếu mật khẩu PostgreSQL:** kiểm tra `PGPASSWORD` trong `.env` không để trống.
- **Trang visitor mở nhưng không có địa điểm:** API cần chạy và migration cùng dữ liệu demo cần được nạp thành công.
- **Vite dùng cổng 5174:** mở URL mà Vite in ra. Nếu muốn tạo QR trỏ về đúng cổng đó, đổi `PUBLIC_VISITOR_URL` trong `.env` sang `http://localhost:5174/visitor` rồi khởi động lại API.
- **Không nghe được audio demo:** seed tạo nội dung mẫu nhưng không cung cấp file MP3 thật. Hãy upload file audio hoặc cấu hình ElevenLabs rồi tạo audio trong Content Studio.

