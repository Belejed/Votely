# 🗳️ Votely by arya

> **Modern, Multi-Tenant Electronic Voting (E-Voting) Platform** designed for Schools, Universities, and Organizations. Built with Next.js 16, TypeScript, Tailwind CSS, and Supabase PostgreSQL.

![Votely Banner](https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?q=80&w=1200&auto=format&fit=crop)

---

## 🌟 Key Features

### 1. 🗳️ Dedicated Active Election Command Center
- **Live Real-Time Monitoring**: Direct overview of voter turnout, ballot cast volume, and participation rate.
- **Candidate Roster Cards**: Dynamic visual cards displaying candidate numbers, names, vision, mission, and live percentage progress bars.
- **Direct Voting Launchers**: Instant shortcuts to open **Bilik Suara Kiosk** and **Surat Suara Online**.

---

### 2. 👥 Voters Importer & DPT Management
- **Streamlined 4-Field Standard Format**:
  - `Nama Lengkap Pemilih`
  - `Nomor Induk Siswa (NIS / NIK)`
  - `Kelas / Rombel`
  - `Jurusan / Departemen / Kategori`
- **Excel Template & Bulk Import**: Pre-styled `.xlsx` template download and bulk voter importer with automatic duplicate detection.
- **Instant Manual Voter Entry**: Clean animated drawer form to manually register voters with automatic generation of:
  - 🔑 **6-Digit Voting PIN**
  - 🪪 **Secure QR Token (`VTLY-XXXXXXXXXXX`)**
  - 🎟️ **Unique Invitation Code (`INV-XXXXX`)**

---

### 3. 🖨️ Printable QR Voting Invitations
- Printable ballot invitation cards with high-resolution QR codes and PIN credentials.
- Multi-layout printing support: **2, 4, or 8 cards per A4 sheet**.

---

### 4. 📷 Kiosk Voting Booth & Mobile Ballot
- **Bilik Suara Kiosk**: Dedicated offline-capable kiosk interface with webcam QR scanning, numpad PIN entry, and instant vote submission with audio feedback.
- **Surat Suara Online**: Responsive, secure digital ballot for hybrid online elections.

---

### 5. 📈 Live Result Count (Projector Screen)
- Real-time tally board optimized for big-screen projectors in auditoriums.
- Live percentage breakdown per candidate with smooth animations.

---

### 6. 🛡️ Role-Based Access Control (RBAC)
| Role | Live Result Count | Voters Importer (DPT) | Pemilihan Aktif | Events Wizard | Staff Management | Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 👑 **Administrator** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| 🎫 **Panitia** | ✅ Read | ✅ **Manage & Print** | ✅ Booth Access | ❌ Restricted | ❌ Restricted | ❌ Restricted |
| 👁️ **Saksi (Observer)** | ✅ **Exclusive View** | ❌ Restricted | ❌ Restricted | ❌ Restricted | ❌ Restricted | ❌ Restricted |

---

### 7. ☁️ Dual Database Architecture (Cloud + Offline Fallback)
- **Supabase PostgreSQL 17**: High-performance cloud database with Prisma ORM.
- **Offline JSON Local Database**: Zero-dependency local JSON database fallback ensuring elections continue uninterrupted without internet access.

---

### 8. 🔐 Multi-Tenant Workspace & Username Authentication
- Organizations register their own custom slug (`/org/[slug]`).
- 100% username-based authentication (`Kode Instansi` + `Username` + `Password`) without requiring voter or staff email addresses.

---


---

## ⚙️ 6-Step Election Creation Wizard (Events Wizard)

Votely provides a guided 6-step wizard that simplifies setting up complex elections in minutes:

### 1. Step 1: Event Information (`INFO`)
Set the election title (e.g. *Pemilihan OSIS / MPK 2026*), description, election statement, and layout details.

![Step 1: Event Information](docs/images/wizard-step1-info.png)

---

### 2. Step 2: Choose Voting Mode (`MODE`)
Choose the exact voting delivery channels that best suit your organization:
- 🖥️ **Offline Booth (Recommended)**: Administrators set up central touchscreen/laptop kiosks. Voters scan their QR invitation card or enter PIN at the polling station.
- 📱 **Online Client**: Voters access digital ballots remotely from their smartphones or laptops using secure OTP/passwords from home.
- 🌐 **Hybrid Blend**: Enables both central physical kiosks and remote mobile ballots concurrently to maximize turnout.

![Step 2: Choose Voting Mode](docs/images/wizard-step2-mode.png)

---

### 3. Step 3: Voter Authentication Method (`AUTH`)
Determine how voters authenticate their identity before casting a ballot:
- 🪪 **QR Code Scan (Recommended)**: Voter simply scans their printed QR card to the webcam. Fast, contactless, and zero typing required.
- 🔒 **ID + Voting Pass**: Voter manually types their Student ID (NIS/NIK) plus their unique 6-digit PIN code.
- 🛡️ **ID + QR Dual Auth**: High-security dual verification requiring both Student ID entry and QR card scanning.

![Step 3: Voter Authentication Method](docs/images/wizard-step3-auth.png)

---

### 4. Step 4: Rules & Candidates (`RULES`)
- Configure single or multi-candidate selection limits.
- Toggle visibility of vision and mission statements on digital ballots.
- Enable automatic vote confirmation popups and anonymized audit trails.

---

### 5. Step 5: Booth Setup (`BOOTH`)
- Customize offline kiosk theme colors, institutional logos, and countdown timers.
- Configure audio sound effects for confirmed votes.

---

### 6. Step 6: Review & Publish (`REVIEW`)
- Comprehensive pre-flight checklist before publishing the election.
- Instantly activates the election into the **Pemilihan Aktif** command center.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (Turbopack, App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism UI
- **Database & ORM**: [Supabase PostgreSQL](https://supabase.com/) & [Prisma ORM](https://www.prisma.io/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Processing**: [SheetJS (xlsx)](https://sheetjs.com/) & [QRCode](https://github.com/soldair/node-qrcode)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Belejed/Votely.git
cd Votely
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the project root:
```env
# Supabase PostgreSQL Database Connection
DATABASE_URL="postgresql://user:password@db.xxxx.supabase.co:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=3"
DIRECT_URL="postgresql://user:password@db.xxxx.supabase.co:5432/postgres?sslmode=require&connection_limit=3"

# JWT Secret for Session Management
JWT_SECRET="your_secure_jwt_secret_key_here"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_ROOT_DOMAIN="localhost:3000"
```

### 4. Push Database Schema to Supabase
```bash
npx prisma db push
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📁 Project Structure

```text
├── data/
│   └── votely_db.json         # Local offline JSON database fallback
├── prisma/
│   └── schema.prisma          # Prisma PostgreSQL database schema
├── src/
│   ├── app/
│   │   ├── login/             # Staff & Admin login portal
│   │   ├── signup/            # Workspace registration page
│   │   ├── org/[slug]/
│   │   │   ├── (dashboard)/   # Main admin workspace layout
│   │   │   │   ├── dashboard/ # Executive overview & quick hub
│   │   │   │   ├── active-election/ # Dedicated live election center
│   │   │   │   ├── voters/    # DPT importer, manual entry, PIN generator
│   │   │   │   ├── events/    # Election wizard & scheduler
│   │   │   │   ├── users/     # Panitia staff & Saksi account management
│   │   │   │   ├── livecount/ # Projector-ready live count screen
│   │   │   │   ├── theme/     # Workspace branding & colors
│   │   │   │   └── audit/     # Immutable activity logs
│   │   │   ├── booth/[id]/    # Offline Kiosk voting booth
│   │   │   └── vote/[id]/     # Online voter ballot
│   │   └── page.tsx           # Clean public landing page
│   ├── components/
│   │   └── ui/                # Reusable UI component library (Card, Button, Badge, etc.)
│   └── lib/
│       ├── db.ts              # Unified database adapter (Prisma + Local fallback)
│       ├── session.ts         # JWT Session authentication
│       └── crypto.ts          # Password & token cryptography
└── README.md
```

---

## 📄 License & Credits

Developed with ❤️ by **Arya**  
**Votely by arya** • Sistem E-Voting Mandiri & Terverifikasi
