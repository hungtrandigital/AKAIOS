# AKAIUNSAN — Demo Accounts

**Single source of truth for demo/showcase logins.** All accounts use uniform password for ease of demo.

## 🔑 Password

```
Demo@2026
```

(Uniform across all demo accounts)

## 👑 CEO / Executive

| Email | Name | Role | Use |
| --- | --- | --- | --- |
| `ceo@ak.local` | Trần Minh Quốc | `system_admin` | Full access + executive dashboard at `/executive` |

## 📋 Back Office (BO)

| Email | Name | Role | Use |
| --- | --- | --- | --- |
| `ops@ak.local` | Lê Hà Operations | `bo_admin` | Operations Director — full ops + payroll |
| `bo-senior@ak.local` | Phạm Linh Senior | `bo_admin` | Senior BO — payroll approval |
| `bo-junior@ak.local` | Nguyễn Trang Junior | `bo_admin` | Junior BO — daily attendance ops |

## 👷 Supervisors (Field)

| Email | Name | Project | Use |
| --- | --- | --- | --- |
| `sup-vincom@ak.local` | Hoàng Văn Đội Trưởng | Vincom Đồng Khởi (PRJ001) | Retail client — flagship |
| `sup-bitexco@ak.local` | Đặng Văn Bitexco | Bitexco Financial Tower (PRJ004) | Premium office client |
| `sup-fv@ak.local` | Vũ Thị Hospital | Bệnh viện FV (PRJ007) | Healthcare — strict hygiene |

## 📱 Employees (Mobile App — use phone number to log in)

| Phone | Name | Note |
| --- | --- | --- |
| `+84900000101` | Trần Thị Mai (Demo NV #1) | Typically Vincom |
| `+84900000102` | Lê Văn Hùng (Demo NV #2) | Typically Bitexco |
| `+84900000103` | Phạm Thị Lan (Demo NV #3) | Typically FV Hospital |
| `+84900000104` | Nguyễn Văn Nam (Demo NV #4) | High-seniority demo |
| `+84900000105` | Hoàng Thị Oanh (Demo NV #5) | New hire demo |

**Mobile login flow:** Phone + OTP (check server log for OTP in dev/mock mode) OR set temporary password via backend.

## 🔧 Setup

### Run seeds (in order)

```bash
# 1. Base data: 1 tenant + 15 projects + 200 random employees
pnpm db:seed

# 2. Layer named demo accounts on top
pnpm db:seed:demo

# Or both at once
pnpm db:seed:all
```

(From `/Users/hungtran/Projects/AKAIUNSAN` after `pnpm install && pnpm prisma:generate`.)

### Production-mode accounts (separate)

Production accounts have different passwords (auto-generated per seed).

The original `dev-seed.ts` creates these:
- `admin@ak.local` / `admin123!` — system_admin
- `bo@ak.local` / `admin123!` — bo_admin
- `supervisor0@ak.local`..4 / `super123!` — 5 supervisors
- `NV0001`..`NV0200` (phone `+84931000000`..`+849310000199`) / `nv123456!` — 200 employees

These should be rotated before any pilot deployment.

## 🛡️ Security Note

These accounts are for **demo + showcase + pilot validation only**. Never deploy to production with these credentials. Rotate all passwords, force password reset on first login, and enable real SMS gateway before pilot.
