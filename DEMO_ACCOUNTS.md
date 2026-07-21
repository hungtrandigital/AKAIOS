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

**Mobile login flow:** Use the employee phone number with password `Demo@2026`.

## 🔧 Setup

### Run seeds (in order)

```bash
# 1. Base data: 1 tenant + 15 projects + 200 random employees
ALLOW_DEMO_SEED=true pnpm --filter @ak/shared db:seed

# 2. Layer named demo accounts on top
ALLOW_DEMO_SEED=true pnpm --filter @ak/shared db:seed:demo

# Or build the complete development/UAT dataset, including attendance + RBAC
ALLOW_DEMO_SEED=true pnpm --filter @ak/shared db:seed:all
```

(From `/Users/hungtran/Projects/AKAIUNSAN` after `pnpm install && pnpm prisma:generate`.)

### Generated development accounts

The base `dev-seed.ts` also creates these local development identities:
- `admin@ak.local` / `admin123!` — system_admin
- `bo@ak.local` / `admin123!` — bo_admin
- `supervisor0@ak.local`..4 / `super123!` — 5 supervisors
- `NV0001`..`NV0200` (phone `+84931000000`..`+849310000199`) / `nv123456!` — 200 employees

These identities and their generated dataset must not be promoted to pilot or
production. Provision real pilot operators and employee data separately through
the deployment runbook; rotating these passwords is not sufficient.

## 🛡️ Security Note

These accounts are for **local development, demo, showcase, and controlled UAT
only**. Never use the accounts or dataset for pilot or production. Pilot setup
must provision real identities, rotate owner-managed credentials, enforce real
TOTP/SMS policy, and load approved pilot data through the deployment runbook.
