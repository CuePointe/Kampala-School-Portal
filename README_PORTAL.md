# Kampala School & Academy Portal
## Deployment & Operations Guide — v1.1.0
---

## 🔐 Default Login Credentials

> **Change all passwords immediately on first login.** Users are prompted automatically.

| Role | Username | Default Password | Access Scope |
|------|----------|-----------------|--------------|
| Executive Director | `exec` | `Exec@2026` | Full system access — all tabs, reports, user management, audit log |
| School Administrator | `admin` | `Admin@2026` | Students, academics, payments, conduct, administration |
| Bursary Officer | `bursary` | `Bursary@2026` | Payments, bursaries, financial reports |
| Head Coach | `coach` | `Coach@2026` | Sports programs, attendance, bursary view |

---

## 📁 File Structure

```
school-portal/
├── index.html          — Main application (single-file SPA, ~130KB)
├── auth.js             — Role-based authentication module
├── service-worker.js   — PWA offline cache (Cache-First strategy)
├── manifest.json       — PWA installable app manifest
└── README_PORTAL.md    — This file
```

---

## 🚀 Deployment Options

### Option 1: GitHub Pages (Recommended — Free, HTTPS)
1. Fork or push all 4 files to a GitHub repository
2. **Settings → Pages → Source:** `Deploy from a branch` → `main` → `/root`
3. Live at: `https://YOUR-USERNAME.github.io/school-portal/`
4. HTTPS is automatic — service worker and PWA install will work

### Option 2: Netlify (Drag & Drop)
1. Zip the 4 files
2. Drag to [netlify.com/drop](https://app.netlify.com/drop)
3. Live instantly at a `*.netlify.app` URL

### Option 3: Local Server
```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .
```
Visit: `http://localhost:8080`

> ⚠️ **Do NOT open `index.html` directly as a `file://` URL.** The service worker requires HTTP/HTTPS.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser                          │
│                                                     │
│  ┌──────────────┐   ┌──────────────────────────┐   │
│  │  auth.js     │   │      index.html           │   │
│  │              │   │                           │   │
│  │ SHA-256 pwd  │──▶│  Role Router              │   │
│  │ sessions     │   │  Tab Permission Gates     │   │
│  │ audit log    │   │  Business Logic           │   │
│  │ user CRUD    │   │  Render Engine            │   │
│  └──────────────┘   └──────────────────────────┘   │
│         │                       │                   │
│         ▼                       ▼                   │
│  ┌──────────────────────────────────────────────┐   │
│  │           localStorage                        │   │
│  │  ksa_session · ksa_users · ksa_audit          │   │
│  │  kampala_school_portal_state                  │   │
│  └──────────────────────────────────────────────┘   │
│                       │                             │
│                       ▼                             │
│  ┌──────────────────────────────────────────────┐   │
│  │         service-worker.js                     │   │
│  │  Cache-First offline strategy                 │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🔑 Role Permission Matrix

| Feature | Exec | Admin | Bursary | Coach |
|---------|:----:|:-----:|:-------:|:-----:|
| Dashboard Overview | ✅ | ✅ | — | — |
| Student Directory | ✅ | ✅ | — | — |
| Academic Performance | ✅ | ✅ | — | — |
| Payment Logs | ✅ | ✅ | ✅ | — |
| Sports & Programs | ✅ | — | — | ✅ |
| Attendance | ✅ | — | — | ✅ |
| Bursaries | ✅ | — | ✅ (award) | ✅ (view) |
| Conduct Log | ✅ | ✅ | — | — |
| Statistical Reports | ✅ | — | ✅ | — |
| Administration | ✅ | ✅ | — | — |
| Register Students | ✅ | ✅ | — | — |
| Record Payments | ✅ | ✅ | ✅ | — |
| Add Programs | ✅ | ✅ | — | ✅ |
| Log Performance | ✅ | — | — | ✅ |
| Mark Attendance | ✅ | — | — | ✅ |
| Award Bursary % | ✅ | — | ✅ | — |
| Delete Students | ✅ | ✅ | — | — |
| Export Ledger | ✅ | ✅ | ✅ | — |
| Import Ledger | ✅ | ✅ | — | — |
| Reset All Data | ✅ | — | — | — |
| User Management | ✅ | — | — | — |
| Audit Log | ✅ | — | — | — |

---

## 🔒 Security Model

### Authentication
- Passwords hashed with **SHA-256 + application salt** (`ksa_salt_2026`)
- **8-hour session** stored in `localStorage.ksa_session`
- Session expiry bar appears at 15-minute warning
- All user activity refreshes session automatically
- First-login forced password change for all default accounts

### Changing the Salt
For production, change `'ksa_salt_2026'` in `auth.js` to a unique string before deployment.
Then regenerate all password hashes:
```javascript
// In browser console after loading the app:
await AUTH.hashPassword("YourNewPassword")
// Copy the output hash to auth.js DEFAULT_USERS
```

### Generating New Password Hashes (Node.js)
```javascript
const crypto = require('crypto');
const hash = (pwd) => crypto.createHash('sha256').update(pwd + 'ksa_salt_2026').digest('hex');
console.log(hash("Admin@YourSchool2026"));
```

### Audit Log
All login, logout, password change, and user management events are stored in
`localStorage.ksa_audit` (last 500 events). Accessible to Exec role only.

---

## 💾 Data & Backup

### Storage Keys
| Key | Contents |
|-----|----------|
| `kampala_school_portal_state` | All school data (students, payments, attendance, conduct, programs) |
| `ksa_users` | Portal user accounts |
| `ksa_session` | Current user session |
| `ksa_audit` | System audit log |

### Backup Schedule
| Frequency | Action |
|-----------|--------|
| Daily (term time) | Export Ledger via header button |
| Weekly | Save to cloud (Google Drive / Dropbox) |
| Monthly | Archive as `ksa-ledger-YYYY-MM.json` |
| Before any reset | Always export first |

### Multi-Device Sync
1. Device A: **Export Ledger** → downloads `ksa-ledger-YYYY-MM-DD.json`
2. Share via WhatsApp, Google Drive, email, or USB
3. Device B: **Import Ledger** → confirm replacement

---

## 🛠️ Customisation

### Change School Name
In `index.html`, find `"Kampala School & Academy"` and replace globally (3 occurrences).

### Modify Grading Scales
In `index.html`, edit the `gradeFor()` function.

### Add Custom Sports
In `index.html`, edit the `SPORT_OPTIONS` array.

### Change Session Duration
In `auth.js`, change `8 * 60 * 60 * 1000` (8 hours) to desired milliseconds.

### Change Warning Threshold
In `index.html`, change `SESSION_WARN_SECS = 15 * 60` (15 minutes).

---

## 🇺🇬 Uganda Curriculum Reference

| Level | Classes | Grading |
|-------|---------|---------|
| Pre-Primary | Baby Class, Middle Class, Top Class | — |
| Primary | P.1 – P.7 | Distinction / Credit / Pass / Fail |
| O Level (UCE) | S.1 – S.4 | D1–F9 → Division I–IV |
| A Level (UACE) | S.5 – S.6 | A (6pts) – F (0pts) |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Data disappeared" | Were you in Incognito mode? Use regular browser. |
| SMS link not working | Ensure phone is Uganda format: `0701234567` or `+256701234567` |
| Styles look broken | Load once with internet (Tailwind CDN). Then works offline. |
| "Import failed" | File must be `.json`, not `.txt`. Check for corruption. |
| Can't install as app | Must be served via HTTPS, not `file://` |
| Session expired unexpectedly | Session is 8 hours; click "Extend" in the expiry bar |

---

## 📋 First-Time Setup Checklist

- [ ] Deploy to GitHub Pages or Netlify
- [ ] Login as `exec` with default password, change immediately
- [ ] Login as each other role, change passwords
- [ ] Add sports programs (Administration tab)
- [ ] Register initial students
- [ ] Do a test Export Ledger
- [ ] Bookmark the URL on all administrator devices
- [ ] Install as PWA on mobile devices (browser → "Add to Home Screen")

---

**Version:** 1.1.0  
**Last Updated:** June 2026  
**License:** MIT — Free for any Ugandan school or academy  
**Maintained by:** CuePointe
