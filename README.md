# Kerja Sama (clone modern)

Manajemen tim lapangan: tugas kanban, laporan, tim dengan ID undangan + approval admin, login fingerprint (WebAuthn). Inspirasi: ruangkerja.my.id — dibangun ulang dengan React.

## Fitur
- 🔐 Login/daftar username-password + **fingerprint WebAuthn**
- 👥 Sistem tim: ID Tim undangan, approval anggota oleh admin
- ✅ Kanban tugas (To Do / On Progress / Done), deadline, penugasan anggota
- 📝 Laporan lapangan per tim
- 💬 Chat tim: pesan, voting dengan hasil %, kirim lampiran file (≤500KB)
- 🧩 **Toko Fitur** — modul opsional aktif/nonaktif per tim:
  - Pengumuman
  - Absen (fingerprint + PIN)
  - Inventori
  - Pengeluaran
- 📱 Responsif penuh + PWA-ready
- 🎨 **UI shadcn/ui dark premium** (FinPoint: hitam #111, kartu #1A1D24, radius 20px, oranye #F97316)
- 🔷 **Ikon minimalis Lucide** (0 emoji di `src/`)

## Demo lokal
```bash
npm install && npm run dev
```
Akun demo: `admin/admin123` (admin) · `budi/budi123` (anggota)

## Deploy Vercel
1. Push ke GitHub → import di Vercel → Deploy (framework otomatis Vite)
2. Multi-user asli (sinkron lintas perangkat): isi `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (lihat .env.example)

MIT
