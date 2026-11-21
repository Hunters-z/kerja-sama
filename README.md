# Kerja Sama (clone modern)

Manajemen tim lapangan: tugas kanban, laporan, tim dengan ID undangan + approval admin, login fingerprint (WebAuthn). Inspirasi: ruangkerja.my.id — dibangun ulang dengan React.

## Fitur
- 🔐 Login/daftar username-password + **fingerprint WebAuthn**
- 👥 Sistem tim: ID Tim undangan, approval anggota oleh admin
- ✅ Tugas & Tenggat: 3 tampilan (Daftar Fokus per kelompok tenggat / Tabel / Kanban drag-and-drop), prioritas, proyek, sub-tugas (langkah kerja) dengan progres otomatis, sematkan (pin), tunda tenggat (+1 hari), drawer detail lengkap
- 📁 Proyek & Progres: kartu proyek dengan persentase penyelesaian dihitung real-time, banner akumulasi workspace
- 📄 Dokumen: block editor ala Notion (judul, paragraf, checklist, poin, sorotan, garis), 4 template (rapat, SOP, brief proyek, checklist harian)
- 🗳️ Voting keputusan tim: buat voting, vote satu pilihan, kunci/buka keputusan
- 💬 Diskusi tim: pesan, balas (reply), sematkan pesan, **jadikan pesan → tugas**, lampiran file 500KB, voting di chat, unread badge
- ⚡ Quick capture: bilah mengambang untuk catat tugas/pengingat instan (Enter)
- 🔎 Pencarian cepat universal (Ctrl+K): halaman, tugas, dokumen
- 🌗 Dark mode + sidebar collapsible + mobile drawer & bottom nav
- 🧰 Kalender tenggat, snippets (catatan tempel salin cepat), riwayat aktivitas tim
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

UI: gaya editorial monokrom (Inter + JetBrains Mono, zinc/hairline, aksen indigo) sesuai mockup "Kerja Sama — Universal".

## Demo lokal
```bash
npm install && npm run dev
```
Akun demo: `admin/admin123` (admin) · `budi/budi123` (anggota)

## Deploy Vercel
1. Push ke GitHub → import di Vercel → Deploy (framework otomatis Vite)
2. Multi-user asli (sinkron lintas perangkat): isi `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (lihat .env.example)

MIT
