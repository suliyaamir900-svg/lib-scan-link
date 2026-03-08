

## Library QR Entry Management System — Implementation Plan

### 🎨 Design Direction
Modern & vibrant design with gradient accents, colorful dashboard cards, blue/purple primary palette. Bilingual UI (Hindi + English) throughout.

---

### Phase 1: Foundation & Auth System
- **Landing page** — Hero section with features overview, pricing, CTA buttons (Hindi + English)
- **Supabase setup** — Connect Supabase, create database schema:
  - `libraries` table (library_id, name, college_name, admin_name, email, phone, qr_code_url, created_at)
  - `student_entries` table (entry_id, library_id, student_name, department, year, roll_number, mobile, email, signature_path, entry_date, entry_time, device_info, ip_address)
  - `user_roles` table (user_id, role: super_admin/library_admin/student)
  - RLS policies for multi-tenant data isolation (each library sees only its own data)
- **Auth pages** — Library admin signup (with library details), login, password reset
- **Auto QR generation** — On signup, generate unique library ID and QR code pointing to `/entry/{libraryID}`

### Phase 2: Student Entry System
- **Student entry form** (`/entry/{libraryID}`) — Public form with:
  - Mandatory: Student Name, Department, Year, Roll Number, Mobile, Digital Signature canvas
  - Optional: Email, Photo upload, ID Card Number
- **Digital signature canvas** — Touch/mouse/stylus drawing pad, saves as PNG to Supabase Storage
- **Form validation** — Zod schema validation, duplicate entry checks
- **Success confirmation** — Entry saved notification in Hindi + English

### Phase 3: Library Admin Dashboard
- **Dashboard metrics** — Total students, today/weekly/monthly entries with colorful stat cards
- **Charts** — Department distribution (pie), year distribution (bar), entry activity timeline (line) using Recharts
- **Student entries table** — Sortable, filterable, paginated data table with columns: Name, Department, Year, Roll No, Mobile, Signature preview, Date, Time
- **Search & filters** — Search by name/roll/mobile, filter by department/year/date range

### Phase 4: Data Management & QR Tools
- **Student CRUD** — Add manually, edit, delete, bulk delete entries
- **QR code management page** — View, download (PNG/SVG/PDF), print poster, share link, regenerate QR
- **Excel export** — Download filtered entries as .xlsx
- **PDF reports** — Generate PDF with library header, entry data, signature previews

### Phase 5: Super Admin Panel & Advanced Features
- **Super admin dashboard** — All libraries overview, system-wide analytics
- **Library management** — Approve/block libraries, view library details
- **Notification system** — Toast/in-app notifications for new entries, high activity alerts
- **Settings pages** — Library profile, password change, notification preferences
- **Rate limiting** — Edge function for entry form submission rate limiting

### Key Technical Decisions
- **Multi-tenancy**: All queries filtered by `library_id` with RLS policies
- **QR codes**: Generated client-side using a QR library, stored as URLs
- **Signatures**: Canvas-based, uploaded to Supabase Storage bucket
- **Exports**: Client-side Excel generation (xlsx library), PDF generation (jsPDF)
- **i18n**: Simple key-value translation object for Hindi/English toggle

