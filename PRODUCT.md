# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Individu**: Orang yang ingin memantau tren vital sign (detak jantung, HRV, laju pernapasan) secara rutin, mandiri, dan mudah tanpa alat wearable khusus.
- **Keluarga**: Anggota keluarga (2–8 orang, misal orang tua memantau anak atau lansia) yang ingin saling memantau kondisi kesehatan dalam satu ruang keluarga dengan kontrol privasi per individu.

## Product Purpose
Nadiku adalah platform pemantauan kesehatan keluarga berbasis rPPG (*remote photoplethysmography*) lewat webcam browser, statistik tren kesehatan, deteksi anomali ML otomatis, dan pendamping AI (*AI health companion*). Tujuannya memberikan visibilitas kesehatan preventif harian yang mudah, non-invasif, dan saling terhubung tanpa perangkat wearable klinis khusus.

## Positioning
Satu-satunya solusi pemantauan kesehatan keluarga non-invasif yang memadukan pengukuran vital sign kamera tanpa alat tambahan, korelasi aktivitas gaya hidup harian (kopi, rokok, olahraga, tidur, makan), peringatan dini via Telegram, dan asisten AI ber-memori kesehatan keluarga — dengan penegasan etis dan konsisten sebagai alat wellness informasional non-diagnostik.

## Operating Context
Aplikasi web responsif (desktop, tablet, mobile) dibangun dengan React 19, Vite, TypeScript, Tailwind CSS v4, dan shadcn/ui. Pengukuran dilakukan langsung melalui kamera web (atau unggah video wajah 30–60 detik). Hasil ekstraksi sinyal diproses di backend server-side. Notifikasi peringatan anomali dikirimkan instan ke bot Telegram.

## Capabilities and Constraints
- **Pengukuran Vital Sign (rPPG)**: Heart Rate (BPM), Heart Rate Variability (HRV / RMSSD), dan Respiration Rate melalui webcam live atau unggah video.
- **Deteksi Kualitas Sinyal**: Indikator kualitas visual (Good / Fair / Poor / Rejected) dengan validasi pencahayaan dan posisi wajah.
- **Pencatatan Aktivitas Gaya Hidup (Dual Entry)**: Menu cepat 6 tombol (kopi, olahraga, rokok, alkohol, tidur, makan) serta pencatatan natural melalui obrolan AI.
- **Visualisasi Tren & Overlay**: Grafik deret waktu (harian, mingguan, bulanan) dengan overlay titik aktivitas untuk melihat dampak langsung ke vital sign.
- **Deteksi Anomali Statistik & ML**: Baseline personal per user (rolling mean & standar deviasi, z-score threshold) dengan pencatatan konteks anomali.
- **AI Health Companion**: Chatbot cerdas (DeepSeek + LangChain) yang memahami statistik vital, menyerap riwayat kesehatan keluarga (RAG pgvector), dan pantang memberikan resep atau diagnosis medis.
- **Family Sharing & Dependent Profiles**: Ruang keluarga dengan peran Admin dan Member, profil dependent (anak/lansia tanpa akun mandiri), serta opsi privasi data.
- **Peringatan Telegram**: Integrasi bot Telegram untuk notifikasi deviasi anomali instan kepada user dan penanggung jawab (admin).
- **Batasan Tegas (Non-Goals)**: Bukan alat diagnostik medis klinis, bukan pengganti pemeriksaan dokter/ECG. Disclaimer wajib hadir di setiap tampilan hasil dan statistik.

## Brand Commitments
- **Nama Produk**: Nadiku
- **Tone & Karakter**: Tenang, terpercaya, bersahabat (*calm, clinical-but-friendly wellness*), tidak pernah memicu kepanikan (*never alarming*).
- **Bahasa UI**: Bahasa Indonesia yang santun, jelas, dan mudah dipahami keluarga Indonesia.
- **Palet Warna**: Deep teal-blue (`#0E7490` / `#155E75`) untuk identitas utama & navigasi, soft mint/sage green untuk indikator normal/sehat, warm amber (`#F59E0B`) untuk peringatan/sedang, soft coral-red (`#EF4444`) untuk anomali tinggi (dipakai sangat hemat), dan netral off-white/slate untuk kenyamanan mata.

## Evidence on Hand
- `../devfest-md/PRD.md`: Dokumen persyaratan produk lengkap (latar belakang, FR-1 s/d FR-7, NFR, user flow).
- `../devfest-md/ERD.md`: Spesifikasi skema database Postgres, TimescaleDB, pgvector, dan relasi data.
- `../devfest-md/UI-PROMPT.md`: Panduan desain 12 layar utama, komponen konsisten, dan style tokens.

## Product Principles
1. **Reassurance Over Alarm**: Informasi kesehatan disampaikan dengan nada tenang, mendidik, dan menenangkan, bukan menakut-nakuti.
2. **Effortless & Accessible**: Pengukuran semudah membuka kamera browser dan pencatatan aktivitas semudah satu ketukan atau obrolan santai.
3. **Family Connection with Personal Dignity**: Mendukung kepedulian keluarga sekaligus menghormati privasi data pribadi tiap anggota.
4. **Clinical Humility**: Transparan mengenai keterbatasan sinyal rPPG dan selalu menegaskan batasan wellness non-medis.

## Accessibility & Inclusion
- Layout responsif optimal untuk layar desktop (saat pengukuran via webcam laptop) maupun ponsel cerdas.
- Hirarki visual angka vital sign berukuran besar dan terbaca jelas oleh anggota keluarga lansia.
- Informasi status tidak hanya bergantung pada warna, tetapi dilengkapi teks status eksplisit dan ikon penjelas.
