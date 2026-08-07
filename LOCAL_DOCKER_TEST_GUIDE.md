# Hướng dẫn chạy local Docker và test đa tài khoản, đa thiết bị

## 1. Khởi động full stack

Chạy tại thư mục gốc của repo:

```powershell
docker compose --env-file .env `
  -f systems/shared/docker-compose.yml `
  -f systems/shared/docker-compose.local.yml `
  up -d --build
```

Lần chạy đầu, service `db-init` tự tạo schema và seed dữ liệu demo. Kiểm tra trạng thái:

```powershell
docker compose --env-file .env `
  -f systems/shared/docker-compose.yml `
  -f systems/shared/docker-compose.local.yml `
  ps
```

Các địa chỉ local:

| Thành phần | Địa chỉ |
| --- | --- |
| Web admin qua Caddy | http://localhost:8080 |
| Web admin trực tiếp | http://localhost:3002 |
| Attendance API | http://localhost:3000/health/ready |
| Payroll API | http://localhost:3001/health/ready |
| MinIO Console | http://localhost:9101 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6380 |

MinIO đăng nhập bằng `MINIO_ROOT_USER` và `MINIO_ROOT_PASSWORD` trong file `.env`.

## 2. Ma trận tài khoản

Mật khẩu chung cho các tài khoản demo bên dưới: `Demo@2026`.

| Phiên | Thiết bị/trình duyệt | Tài khoản | Vai trò | Mục tiêu |
| --- | --- | --- | --- | --- |
| A | Laptop, Chrome thường | `ceo@ak.local` | `system_admin` | Executive, RBAC, toàn bộ dữ liệu |
| B | Laptop, cửa sổ ẩn danh | `ops@ak.local` | `bo_admin` | Dự án, nhân viên, chấm công, payroll |
| C | Điện thoại 1 | `sup-vincom@ak.local` | `supervisor` | Kiểm tra quyền giám sát |
| D | Điện thoại 2 hoặc Firefox | `bo-junior@ak.local` | `bo_admin` | Kiểm tra cập nhật chéo phiên |

Các tài khoản bổ sung: `bo-senior@ak.local`, `sup-bitexco@ak.local`, `sup-fv@ak.local`. Danh sách đầy đủ nằm trong `DEMO_ACCOUNTS.md`.

## 3. Chuẩn bị nhiều thiết bị

1. Lấy IPv4 của máy chạy Docker:

   ```powershell
   ipconfig
   ```

2. Đảm bảo các thiết bị cùng Wi-Fi/LAN.
3. Trên điện thoại, mở `http://<IP-MAY-CHAY-DOCKER>:8080`.
4. Nếu không truy cập được, cho phép inbound TCP `8080` trong Windows Firewall. Không mở các cổng database ra Internet.
5. Dùng trình duyệt/profile/ẩn danh khác nhau để cookie và token của các tài khoản không ghi đè nhau.

## 4. Kịch bản smoke test (10–15 phút)

### TC-01 — Health và đăng nhập đồng thời

1. Mở hai URL `/health/ready` của API; kỳ vọng HTTP 200 và trạng thái database/Redis sẵn sàng.
2. Phiên A đăng nhập CEO, phiên B đăng nhập Operations, phiên C đăng nhập Supervisor.
3. Refresh từng phiên; kỳ vọng vẫn giữ đúng user và role.
4. Đăng xuất phiên B; kỳ vọng phiên A và C không bị đăng xuất.

### TC-02 — Phân quyền

1. Phiên A mở `/admin/rbac`; kỳ vọng xem được trang quản trị quyền.
2. Phiên B/C thử mở cùng URL.
3. Kỳ vọng tài khoản không đủ quyền bị chặn hoặc không thấy chức năng chỉnh quyền; không chấp nhận chỉ ẩn nút nhưng API vẫn cho phép.
4. Phiên C thử truy cập dữ liệu dự án khác dự án được gán; ghi nhận mọi trường hợp rò rỉ dữ liệu.

### TC-03 — Cập nhật dữ liệu chéo phiên

1. Phiên B mở trang Dự án hoặc Nhân viên và ghi lại số bản ghi.
2. Phiên D tạo/chỉnh một bản ghi thử nghiệm nếu UI cho phép.
3. Phiên B reload; kỳ vọng thấy thay đổi đúng một lần, không trùng bản ghi.
4. Phiên A kiểm tra lại cùng dữ liệu; kỳ vọng dữ liệu nhất quán.

### TC-04 — Chấm công nhiều nhân viên

Nhân viên demo dùng phone `+84900000101` đến `+84900000105`. Luồng mobile hiện dùng OTP mock qua API; xem OTP trong log:

```powershell
docker logs -f ak-attendance-api
```

Trên hai thiết bị, lần lượt request OTP/đăng nhập cho hai số khác nhau, sau đó:

1. Gọi/xác nhận `my-today` để kiểm tra ca được gán.
2. Check-in gần vị trí dự án với ảnh hợp lệ.
3. Thử check-in lần hai; kỳ vọng bị từ chối là bản ghi trùng.
4. Check-out trên đúng tài khoản; kỳ vọng bản ghi chuyển trạng thái hợp lệ.
5. Phiên B mở `/attendance`, reload và đối chiếu đúng nhân viên, thời gian, dự án.

Nếu repo chưa có Flutter build chạy được trên thiết bị, thực hiện luồng nhân viên qua API client (Postman/Bruno/curl) và ghi rõ đây là API test, không phải mobile UI test.

### TC-05 — Payroll và cạnh tranh thao tác

1. Phiên B và D cùng mở `/payroll`.
2. Phiên B tạo kỳ lương cho tháng hiện tại.
3. Gần như đồng thời, phiên D tạo cùng kỳ.
4. Kỳ vọng chỉ một yêu cầu thành công; yêu cầu còn lại trả lỗi xung đột, không tạo hai kỳ.
5. Tính lương, reload ở cả hai phiên và đối chiếu trạng thái.
6. Phiên A duyệt/kiểm tra kỳ lương; xác minh role không đủ quyền không duyệt được.

### TC-06 — Mất mạng và khôi phục

1. Trên điện thoại, bật airplane mode sau khi mở một trang.
2. Thử submit thao tác; kỳ vọng có lỗi rõ ràng, không hiển thị thành công giả.
3. Bật mạng và thử lại một lần.
4. Kiểm tra web admin/database để chắc chắn không tạo dữ liệu trùng.

## 5. Test tự động web

Stack phải đang chạy. Từ repo root:

```powershell
corepack enable
pnpm install
$env:E2E_NO_SERVER='1'
$env:E2E_BASE_URL='http://localhost:3002'
$env:E2E_ADMIN_EMAIL='ceo@ak.local'
$env:E2E_ADMIN_PASSWORD='Demo@2026'
pnpm --filter @ak/payroll-web-admin exec playwright install chromium
pnpm --filter @ak/payroll-web-admin test:e2e
```

Kết quả test tự động chỉ là smoke test; vẫn cần TC-02, TC-04, TC-05 và TC-06 trên các phiên/thiết bị độc lập.

## 6. Thu thập bằng chứng và báo lỗi

Với mỗi test case, lưu: thời điểm, thiết bị, account/role, bước tái hiện, expected, actual, ảnh/video và request ID nếu có. Thu log bằng:

```powershell
docker compose --env-file .env `
  -f systems/shared/docker-compose.yml `
  -f systems/shared/docker-compose.local.yml `
  logs --since 15m attendance-api payroll-api web-admin
```

## 7. Dừng hoặc reset

Dừng nhưng giữ dữ liệu:

```powershell
docker compose --env-file .env -f systems/shared/docker-compose.yml -f systems/shared/docker-compose.local.yml down
```

Reset toàn bộ dữ liệu local và seed lại ở lần chạy tiếp theo:

```powershell
docker compose --env-file .env -f systems/shared/docker-compose.yml -f systems/shared/docker-compose.local.yml down -v
docker compose --env-file .env -f systems/shared/docker-compose.yml -f systems/shared/docker-compose.local.yml up -d --build
```

`down -v` xóa dữ liệu local trong named volumes; chỉ dùng khi không cần giữ dữ liệu test.
