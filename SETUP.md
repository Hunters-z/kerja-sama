# Panduan Integrasi Supabase & Deploy ke Vercel

## 1. Setup Supabase Database
1. Buka [supabase.com/dashboard](https://supabase.com/dashboard) → New Project (pilih region `ap-southeast-1`).
2. Klik **SQL Editor** (atau buka dashboard → Database → New Query).
3. Copy isi file `supabase.sql` di repo ini, paste, lalu Run.

## 2. Setup Environment Variables
1. Copy file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
2. Isi nilai supabase URL dan Anon Key:
   - URL: ada di **Project Settings → API** (Format: `https://xxxxx.supabase.co`)
   - Anon Key: sama di sana, copy string panjangnya.

## 3. Test Lokal
```bash
npm install
npm run dev
```
Akses `http://localhost:5173`, login: `admin / admin123`.

## 4. Deploy ke Vercel
1. Import repo ke [vercel.com/new](https://vercel.com/new).
2. **Environment Variables**: tambahkan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dengan value yang sama seperti di `.env`. (Scope Production).
3. Deploy!

## Google Workspace
Untuk integrasi Gmail/Calendar, kita akan tambahkan Backend API Function di Vercel agar token OAuth aman. Tunggu instruksi lanjutan.
