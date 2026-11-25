# Hands-on lab: hiểu dự án và tự thêm tính năng

## Mục tiêu

Sau lab, mỗi học viên có thể tự lần theo một yêu cầu từ giao diện tới database, sửa hoặc thêm một API có kiểm soát quyền, cập nhật giao diện tương ứng, viết migration khi cần và bàn giao thay đổi có thể review được.

Đối tượng: 4 người đã biết JavaScript/TypeScript cơ bản.  
Thời lượng gợi ý: 2 ngày, khoảng 10–12 giờ thực hành.  
Phạm vi: repository Audio Guide hiện tại, backend NestJS, frontend React/Vite, PostgreSQL và deploy Vercel.

## Đánh giá hiện trạng

### Điểm tốt

- Backend chia module theo domain: `auth`, `catalog`, `content`, `visitor`, `health`.
- API client frontend có kiểu dữ liệu tập trung trong `web/src/api.ts`.
- Quy trình nội dung có các trạng thái, audio, lịch sử duyệt và điều kiện gửi duyệt.
- Có schema PostgreSQL, migration bổ sung và cấu hình chạy local/Vercel.
- Visitor và Content Studio cùng sử dụng catalog, content và audio thật.

### Điểm cần dạy và cải thiện

- `web/src/main.tsx` đang chứa nhiều màn hình và logic nghiệp vụ; thay đổi lớn dễ gây side effect. Nên học cách khoanh phạm vi và tách component/service dần, không refactor toàn bộ trong một PR.
- Migration hiện được gọi theo danh sách trong `src/database/migrate.ts`, chưa có bảng ghi nhận phiên bản migration. Migration mới cần idempotent và phải được đăng ký vào runner.
- Audio ghi vào filesystem `storage/`; trên Vercel filesystem không bền giữa các lần chạy. Cần object storage trước khi coi upload/TTS là production-ready.
- Không thấy script kiểm thử tự động trong `package.json`; build/typecheck giúp bắt lỗi biên dịch nhưng không đảm bảo đúng nghiệp vụ.
- Một số lỗi gần đây là ví dụ tốt để luyện đọc cả luồng: lỗi cú pháp trong service làm backend không build; sự kiện `MARK_REVIEWED` bị database constraint từ chối; state machine từng cho phép publish bỏ qua approve; audio giả có thể bị đánh dấu hợp lệ. Các điểm này đã được xử lý trong working tree của lab hiện tại. Học viên cần hiểu nguyên nhân và cách ngăn tái diễn, không chỉ chép bản sửa.

## Luồng kiến trúc cần thuộc

```text
React screen
  -> web/src/api.ts
  -> NestJS controller (route, DTO, guard)
  -> service (quy tắc nghiệp vụ)
  -> repository (SQL và transaction)
  -> PostgreSQL
```

Phản hồi đi ngược lại: repository trả model → service/controller trả JSON → API client parse → component cập nhật state.

Ví dụ: nút “Gửi duyệt” → `api.transition()` → `ContentController.submit()` → `ContentService.transition()` → `ContentRepository.transition()` kiểm tra trạng thái, tiêu đề, văn bản, audio hợp lệ và cờ rà soát → cập nhật trạng thái và lịch sử.

## Chuẩn bị trước buổi học

Mỗi người cần Node.js, npm, Git, PostgreSQL hoặc Docker Desktop và một editor. Làm việc trên branch riêng, không cùng sửa một file nếu chưa thống nhất.

Ở thư mục gốc:

```powershell
npm ci
npm run build
npm run db:migrate
npm run db:demo
npm start
```

Ở terminal thứ hai:

```powershell
cd web
npm ci
npm run dev
```

Mở `/admin`, đăng nhập bằng tài khoản demo được ghi trong README, sau đó mở `/visitor`. Không đưa `.env`, JWT secret hay API key vào commit. Nếu không dùng PostgreSQL local, cả nhóm thống nhất một database development riêng; không dùng database production để học.

### Kiểm tra đầu vào

- `GET http://localhost:3000/api/health` trả trạng thái khỏe.
- Frontend chạy trên cổng Vite, không có lỗi compile trong terminal.
- Có thể đăng nhập, xem nội dung, mở visitor và gọi API.
- Cả nhóm xác nhận đang ở cùng commit nền; ghi lại commit hash trước khi tạo branch.

Nếu bước nào lỗi, ghi lại lệnh, thông báo lỗi đầy đủ và commit hash. Không sửa ngẫu nhiên nhiều file để “thử cho chạy”.

## Chia vai trò

Mỗi người có một domain chính để chuẩn bị, nhưng cả bốn cùng làm các bài dùng chung và đổi reviewer ở vòng tích hợp. Vai trò là trọng tâm học, không phải quyền sở hữu cố định.

| Người | Domain chính | Cần lần theo | Bài thực hành sở hữu |
|---|---|---|---|
| 1 — Content workflow | Tạo/sửa/xóa nội dung, dịch, trạng thái duyệt, history | `src/content/*`, `web/src/api.ts`, Content Studio trong `web/src/main.tsx`, `schema.sql` | Thêm một quy tắc workflow có UI báo điều kiện và backend thực thi cùng một quy tắc |
| 2 — Catalog và quyền | Ngôn ngữ, location, POI, voice, phân quyền | `src/catalog/*`, `src/auth/*`, DTO/guard, các panel catalog trong frontend | Thêm một trường catalog đi đủ DB → DTO → API → form/list |
| 3 — Visitor, QR và audio | QR URL, fallback ngôn ngữ, phát audio, analytics | `src/visitor/*`, QR trong catalog, `src/main.ts`, Visitor trong frontend, `/media` | Thêm một tương tác visitor có trạng thái tải/lỗi/rỗng và ghi nhận sự kiện nếu phù hợp |
| 4 — Tích hợp, database và deploy | Migration, startup, Vercel, storage, lỗi xuyên tầng | `src/database/*`, `schema.sql`, `migrations/*`, `vercel.json`, `web/vite.config.ts` | Thêm một migration an toàn và xử lý tương thích khi local/Vercel khác nhau |

### Cách đổi chéo

Sau bài domain đầu tiên, đổi code-review theo vòng: Người 1 review Người 2; Người 2 review Người 3; Người 3 review Người 4; Người 4 review Người 1. Reviewer phải đọc API contract và đường đi dữ liệu, không chỉ xem giao diện.

## Lịch trình và bài lab

### Lab 1 — Đọc dự án và chạy một luồng hoàn chỉnh (90 phút, cả nhóm)

1. Vẽ lại luồng đăng nhập admin và luồng Visitor phát nội dung.
2. Tìm route trong controller, DTO, service, repository, câu SQL và type/API call tương ứng.
3. Dùng DevTools Network để ghi lại URL, method, status code, request body và response.
4. Tìm nơi xác thực quyền, nơi kiểm tra trạng thái nghiệp vụ và nơi lưu file.
5. Mỗi người giải thích một lỗi giả định: route không tồn tại, 401, validation 400, lỗi constraint DB và 404 asset khác nhau thế nào.

**Đầu ra:** sơ đồ luồng một trang và danh sách 5 file liên quan cho mỗi hành động.

### Lab 2 — Backend an toàn (120 phút, theo vai trò)

Mỗi người chọn một endpoint trong domain của mình và viết bảng contract trước khi sửa:

| Mục | Câu hỏi |
|---|---|
| Route | Method, path và role nào được gọi? |
| Input | DTO nào xác thực kiểu, độ dài và giá trị? |
| Quy tắc | Điều kiện nào phải được kiểm tra trong service/repository? |
| Dữ liệu | Có transaction, FK, unique constraint hay migration không? |
| Lỗi | 400, 401/403, 404 hay 409 trong trường hợp nào? |

Thực hành: lần theo `submit`, `approve`, `publish`; giải thích vì sao nút bị disabled ở React không thay thế được kiểm tra tại backend. Đọc điều kiện audio hợp lệ (`is_valid`, `is_outdated`) và cờ `needs_review`.

**Đầu ra:** contract được reviewer duyệt và một thay đổi nhỏ trong domain chính.

### Lab 3 — Frontend và đồng bộ state (120 phút, đổi reviewer)

1. Lần theo một thao tác từ component tới hàm trong `web/src/api.ts`.
2. Chỉ ra state nào thay đổi sau thành công; state nào giữ nguyên sau lỗi.
3. Kiểm tra đủ bốn trạng thái giao diện: loading, empty, success, error.
4. Xử lý response bằng dữ liệu server trả về; không tự giả định request thành công.
5. Kiểm tra URL/query string, ngôn ngữ fallback và refresh state sau khi sửa dữ liệu.

**Đầu ra:** UI cho thay đổi ở Lab 2, thông báo kết quả rõ ràng và reviewer xác nhận không cần F5 để thấy dữ liệu mới.

### Lab 4 — Database, migration và độ bền dữ liệu (90 phút, cả nhóm)

1. Với mỗi trường mới, xác định schema, DTO, repository mapping và frontend type.
2. Tạo migration mới có thể chạy trên database đã tồn tại; đăng ký vào `src/database/migrate.ts`.
3. Với trạng thái enum/check constraint, cập nhật cả schema mới và migration nâng cấp.
4. Kiểm tra xóa/cập nhật có thể vướng FK nào; dùng transaction khi cần giữ invariant nhiều bảng.
5. Phân biệt file tĩnh đóng gói trong `web/public` với file do người dùng upload trong `storage`.

**Đầu ra:** migration, hướng dẫn rollback/khôi phục hoặc giải thích vì sao migration chỉ tiến về phía trước, và danh sách rủi ro production.

### Lab 5 — Tích hợp và debug (90 phút, cả nhóm)

Ghép các thay đổi theo thứ tự migration → backend → API type → UI. Sau mỗi bước, build và xem lỗi đầu tiên thay vì sửa lỗi dây chuyền.

Thực hành debug theo checklist:

1. Đọc status code và response body trong Network.
2. Đối chiếu method/path với controller.
3. Kiểm tra token/role và DTO.
4. Đọc log backend, service exception và SQL constraint.
5. So sánh state frontend trước/sau response.
6. Với ảnh/audio, mở URL asset trực tiếp và kiểm tra MIME/status; xác nhận file có trong build artifact.

**Đầu ra:** PR tích hợp nhỏ, checklist đã đánh dấu và mô tả một lỗi nhóm đã tìm được từ root cause.

## Bài cuối: mỗi người tự thêm một tính năng

Thời lượng: 2–3 giờ/người. Mỗi người tự chọn một feature chưa có, phạm vi tối đa một vertical slice. Gợi ý:

- Content: lọc nội dung theo location hoặc thêm lý do khi thu hồi bản gửi duyệt.
- Catalog: tìm POI theo tên đa ngôn ngữ hoặc cảnh báo khi tắt location còn POI active.
- Visitor: nút báo nội dung sai có gửi event và trạng thái xác nhận; hoặc lưu vị trí audio gần nhất.
- Platform: endpoint cấu hình readiness cho frontend hoặc migration tracker có thứ tự.

### Definition of Done

- Có user story, tiêu chí chấp nhận và nêu rõ role sử dụng.
- Có contract/API và validation nếu feature nhận input.
- Quy tắc quan trọng được thực thi ở backend, không chỉ ở UI.
- Database thay đổi có migration và cập nhật schema khi phù hợp.
- UI có loading, empty, success và error state phù hợp.
- Không ghi đè thay đổi của người khác; PR chỉ chứa file cần thiết.
- `npm run build` backend và `npm run build --prefix web` thành công.
- Nếu repository đã có test cho domain, bổ sung test tương ứng; nếu chưa có, ghi rõ các bước kiểm tra thủ công và dữ liệu thử.
- PR nêu cách chạy migration, cách kiểm tra và giới hạn còn lại.

## Đánh giá học viên

Chấm theo 100 điểm:

| Tiêu chí | Điểm |
|---|---:|
| Lần đúng luồng UI → API → service → DB | 20 |
| Quy tắc và quyền được thực thi đúng ở backend | 20 |
| Contract, validation và lỗi dễ hiểu | 15 |
| Migration/dữ liệu không làm hỏng bản cũ | 15 |
| UI đồng bộ, có trạng thái tải/lỗi/rỗng | 10 |
| Tự debug bằng bằng chứng thay vì đoán | 10 |
| PR nhỏ, có hướng dẫn chạy và phản hồi review | 10 |

Điều kiện đạt: từ 70 điểm, không có lỗi bỏ qua quyền hoặc làm sai trạng thái publish, và học viên tự giải thích được một request từ trình duyệt tới database.

## Quy ước làm nhóm

- Mỗi người tạo branch `lab/<ten>/<feature>` từ commit chung.
- Không sửa chung `web/src/main.tsx` cùng lúc; thống nhất vùng code hoặc tách task trước.
- Reviewer yêu cầu mô tả lỗi/tác động, không chỉ đề nghị “sửa cho chạy”.
- Không dùng credentials/API key thật trong demo, log, screenshot hoặc commit.
- Không chạy migration phá hủy trên database production.
- Ưu tiên sửa theo lát cắt nhỏ; không nhân dịp feature để format/rewrite toàn bộ file.

## Tài liệu tra cứu trong repository

- `README.md`: chạy local, API và deploy.
- `docs/04_state_diagram.md`: vòng đời trạng thái nội dung.
- `docs/05_erd_logic.md`: quan hệ dữ liệu.
- `docs/06_sequence_diagram.md`: tương tác giữa các thành phần.
- `docs/08_ma_tran_truy_vet.md`: nối use case với triển khai.
- `schema.sql`, `migrations/`: schema và nâng cấp database.
- `web/src/api.ts`: hợp đồng frontend/backend.
