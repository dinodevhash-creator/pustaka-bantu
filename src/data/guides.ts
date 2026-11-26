export type ToolId =
  | 'slovin'
  | 'sitasi'
  | 'statistik'
  | 'pesan-dosen'
  | 'pomodoro';

export interface GuideItem {
  id: string;
  category: string;
  title: string;
  summary: string;
  steps: string[];
  keywords: string;
  readMinutes: number;
  proTip: string;
  relatedTool?: ToolId;
}

export interface StudyScenario {
  id: string;
  kicker: string;
  title: string;
  description: string;
  guideIds: string[];
  recommendedTool: ToolId;
  toolLabel: string;
}

export interface ThesisStage {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  tasks: { id: string; label: string }[];
  relatedGuideIds: string[];
}

export const CATEGORIES: string[] = [
  'Semua',
  'Skripsi & Penulisan',
  'Referensi & Jurnal',
  'Belajar & Ujian',
  'Statistik & Data',
  'Waktu & Produktivitas',
  'Beasiswa & Biaya',
  'Karier & Magang',
  'Kesehatan Mental',
  'Tools & Aplikasi',
];

export const TOOL_LABELS: Record<ToolId, string> = {
  slovin: 'Kalkulator Slovin',
  sitasi: 'Generator Sitasi',
  statistik: 'Pemilih Uji Statistik',
  'pesan-dosen': 'Pesan Bimbingan Dosen',
  pomodoro: 'Timer Pomodoro',
};

export const GUIDES: GuideItem[] = [
  {
    id: 'cara-memilih-topik-skripsi',
    category: 'Skripsi & Penulisan',
    title: 'Cara memilih topik skripsi',
    summary:
      'Pilih topik yang sempit, datanya bisa didapat, dan dosen pembimbing mau menilainya.',
    steps: [
      'Tulis 3 minat, lalu cari 10 jurnal terbaru tiap minat.',
      'Cari celah penelitian di bagian saran tiap jurnal.',
      'Cek ketersediaan data atau responden sebelum memutuskan.',
      'Konsultasikan 2 opsi judul ke dosen.',
    ],
    keywords: 'judul tema ide proposal tugas akhir',
    readMinutes: 2,
    proTip:
      'Skripsi terbaik adalah skripsi yang selesai tepat waktu. Hindari topik terlalu luas yang membutuhkan izin data berbulan-bulan.',
    relatedTool: 'pesan-dosen',
  },
  {
    id: 'struktur-bab-skripsi',
    category: 'Skripsi & Penulisan',
    title: 'Struktur bab skripsi',
    summary: 'Kerangka umum skripsi kuantitatif dan kualitatif.',
    steps: [
      'Bab 1 Pendahuluan: latar belakang, rumusan masalah, tujuan, manfaat.',
      'Bab 2 Tinjauan pustaka dan kerangka pikir.',
      'Bab 3 Metode: desain, populasi, instrumen, analisis.',
      'Bab 4 Hasil dan pembahasan.',
      'Bab 5 Kesimpulan dan saran.',
    ],
    keywords: 'bab sistematika outline proposal',
    readMinutes: 2,
    proTip:
      'Selalu unduh buku pedoman penulisan tugas akhir resmi fakultasmu untuk memastikan format margin, spasi, dan penomoran subbab.',
  },
  {
    id: 'menulis-latar-belakang-masalah',
    category: 'Skripsi & Penulisan',
    title: 'Menulis latar belakang masalah',
    summary:
      'Gunakan pola corong: kondisi umum, data pendukung, masalah spesifik, lalu alasan penelitian perlu dilakukan.',
    steps: [
      'Mulai dari fenomena luas dan beri data atau kutipan.',
      'Persempit ke masalah di objek penelitianmu.',
      'Tutup dengan celah penelitian dan tujuanmu.',
    ],
    keywords: 'pendahuluan rumusan masalah bab 1',
    readMinutes: 2,
    proTip:
      'Setiap klaim angka di Bab 1 sebaiknya langsung didukung sumber resmi (BPS, laporan tahunan, atau jurnal 5 tahun terakhir).',
    relatedTool: 'sitasi',
  },
  {
    id: 'tips-bimbingan-dengan-dosen',
    category: 'Skripsi & Penulisan',
    title: 'Tips bimbingan dengan dosen',
    summary:
      'Datang dengan progres tertulis dan pertanyaan yang jelas supaya sesi singkat tapi berguna.',
    steps: [
      'Kirim draf 1 hari sebelumnya.',
      'Catat semua revisi saat bimbingan.',
      'Buat jadwal tindak lanjut dan tenggat sendiri.',
      'Kalau dosen sulit dihubungi, kirim pesan sopan dan ringkas.',
    ],
    keywords: 'dospem revisi konsultasi pembimbing sidang',
    readMinutes: 2,
    proTip:
      'Kirim pesan bimbingan di jam kerja (08.00–16.00 WIB, Senin–Jumat) dengan salam, identitas lengkap, dan maksud yang langsung ke inti.',
    relatedTool: 'pesan-dosen',
  },
  {
    id: 'persiapan-sidang-skripsi',
    category: 'Skripsi & Penulisan',
    title: 'Persiapan sidang skripsi',
    summary:
      'Kuasai alasan di balik setiap keputusan penelitianmu, bukan hanya hasilnya.',
    steps: [
      'Latih presentasi maksimal 10 slide dengan timer.',
      'Siapkan jawaban: mengapa metode ini, apa keterbatasannya.',
      'Cetak dan tandai draf lengkap untuk dibawa.',
      'Simulasi tanya jawab dengan teman.',
    ],
    keywords: 'ujian akhir presentasi pertanyaan penguji',
    readMinutes: 3,
    proTip:
      'Tempel sticky index pada halaman penting di draf cetak (Rumusan Masalah, Tabel Hasil, Uji Validitas) agar cepat membuka saat ditanya penguji.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'menghindari-plagiarisme',
    category: 'Skripsi & Penulisan',
    title: 'Menghindari plagiarisme',
    summary:
      'Parafrase dengan memahami ide, lalu tulis ulang dengan kalimat sendiri dan tetap cantumkan sumber.',
    steps: [
      'Catat sumber saat membaca, bukan setelah menulis.',
      'Kutipan langsung diberi tanda petik dan nomor halaman.',
      'Cek kemiripan dengan Turnitin atau layanan kampus.',
    ],
    keywords: 'turnitin similarity parafrase kutipan',
    readMinutes: 2,
    proTip:
      'Jangan hanya mengganti sinonim kata; ubah struktur kalimat secara utuh sambil mempertahankan makna asli peneliti.',
    relatedTool: 'sitasi',
  },
  {
    id: 'format-sitasi-apa-harvard-ieee',
    category: 'Skripsi & Penulisan',
    title: 'Format sitasi APA, Harvard, IEEE',
    summary:
      'Pakai gaya yang diminta kampusmu dan konsisten. APA: penulis-tahun. IEEE: nomor urut.',
    steps: [
      'APA 7: (Nama, 2024).',
      'IEEE: [1] dalam teks, daftar diurutkan sesuai kemunculan.',
      'Gunakan Mendeley atau Zotero agar otomatis.',
    ],
    keywords: 'daftar pustaka referensi sitasi mendeley zotero bibliografi',
    readMinutes: 2,
    proTip:
      'Coba Generator Sitasi di halaman ini untuk membuat format kutipan dalam teks dan daftar pustaka APA 7, Harvard, atau IEEE secara instan.',
    relatedTool: 'sitasi',
  },
  {
    id: 'menulis-abstrak-yang-baik',
    category: 'Skripsi & Penulisan',
    title: 'Menulis abstrak yang baik',
    summary:
      'Abstrak 150–250 kata: latar, tujuan, metode, hasil utama, kesimpulan.',
    steps: [
      'Tulis terakhir setelah semua bab selesai.',
      'Jangan ada sitasi atau singkatan tanpa penjelasan.',
      'Sertakan 3–5 kata kunci.',
    ],
    keywords: 'abstract ringkasan kata kunci',
    readMinutes: 1,
    proTip:
      'Gunakan 1–2 kalimat saja untuk masing-masing unsur (latar, tujuan, metode, temuan angka utama, dan simpulan) agar padat dan terukur.',
  },
  {
    id: 'menulis-esai-dan-makalah',
    category: 'Skripsi & Penulisan',
    title: 'Menulis esai dan makalah',
    summary: 'Satu paragraf satu gagasan, dengan kalimat inti di awal.',
    steps: [
      'Buat kerangka dulu, baru menulis.',
      'Tesis jelas di pendahuluan.',
      'Revisi: potong kalimat bertele-tele, baca keras-keras.',
    ],
    keywords: 'essay paper tulisan paragraf artikel',
    readMinutes: 2,
    proTip:
      'Membaca draf secara lantang membantu mendeteksi kalimat yang terlalu panjang dan transisi antarparagraf yang terputus.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'mencari-jurnal-ilmiah-gratis',
    category: 'Referensi & Jurnal',
    title: 'Mencari jurnal ilmiah gratis',
    summary: 'Mulai dari mesin pencari akademik dan portal jurnal Indonesia.',
    steps: [
      'Google Scholar (scholar.google.com): luas dan mudah.',
      'Garuda (garuda.kemdikbud.go.id): jurnal Indonesia.',
      'DOAJ (doaj.org) dan Semantic Scholar untuk akses terbuka.',
      'Perpustakaan kampus sering punya akses Scopus, ProQuest, atau IEEE.',
    ],
    keywords: 'search paper artikel garuda scholar scopus doaj open access',
    readMinutes: 2,
    proTip:
      'Tambahkan tanda kutip untuk frasa spesifik dan filter tahun terbit 5 tahun terakhir saat mencari di Google Scholar.',
    relatedTool: 'sitasi',
  },
  {
    id: 'cara-membaca-jurnal-dengan-cepat',
    category: 'Referensi & Jurnal',
    title: 'Cara membaca jurnal dengan cepat',
    summary:
      'Baca urutan: abstrak, kesimpulan, gambar atau tabel, baru metode.',
    steps: [
      'Tentukan pertanyaan yang ingin dijawab jurnal itu.',
      'Catat temuan, metode, dan keterbatasan dalam 3 kalimat.',
      'Simpan di tabel matriks literatur.',
    ],
    keywords: 'literatur review membaca ringkas matriks',
    readMinutes: 2,
    proTip:
      'Jika abstrak dan kesimpulan tidak relevan dengan rumusan masalahmu, segera lewati agar waktu riset tidak habis.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'akreditasi-jurnal-sinta-dan-scopus',
    category: 'Referensi & Jurnal',
    title: 'Akreditasi jurnal Sinta dan Scopus',
    summary:
      'Sinta 1–6 adalah peringkat jurnal nasional. Scopus dan WoS bereputasi internasional.',
    steps: [
      'Cek peringkat di sinta.kemdiktisaintek.go.id.',
      'Hindari jurnal predator: biaya cepat, tidak ada peer review.',
      'Cek daftar Scimago untuk kuartil Q1–Q4.',
    ],
    keywords: 'publikasi q1 q2 predator terindeks',
    readMinutes: 2,
    proTip:
      'Pastikan mengecek ISSN jurnal langsung di situs Sinta atau Scopus Sources, bukan sekadar logo di situs web jurnalnya.',
  },
  {
    id: 'menulis-tinjauan-pustaka',
    category: 'Referensi & Jurnal',
    title: 'Menulis tinjauan pustaka',
    summary: 'Kelompokkan sumber berdasarkan tema, bukan satu per satu.',
    steps: [
      'Bandingkan temuan antarpenelitian.',
      'Tunjukkan perbedaan dan celahnya.',
      'Hubungkan ke pertanyaan penelitianmu.',
    ],
    keywords: 'literature review kajian teori landasan',
    readMinutes: 2,
    proTip:
      'Hindari menulis pola "Menurut A..., Menurut B..., Menurut C...". Sintesis menjadi "Tiga studi menemukan X, sementara studi lain menunjukkan Y."',
    relatedTool: 'sitasi',
  },
  {
    id: 'teknik-belajar-efektif',
    category: 'Belajar & Ujian',
    title: 'Teknik belajar efektif',
    summary: 'Uji diri dan jeda berjarak lebih ampuh daripada membaca ulang.',
    steps: [
      'Active recall: tutup catatan, tulis yang kamu ingat.',
      'Spaced repetition: ulangi di hari 1, 3, 7, 14.',
      'Teknik Feynman: jelaskan seolah ke anak SMP.',
    ],
    keywords: 'cara belajar menghafal memahami teknik feynman recall',
    readMinutes: 2,
    proTip:
      'Highlight warna-warni terasa produktif tetapi pasif. Ubah setiap subbab menjadi 3 pertanyaan ujian dan jawab tanpa melihat buku.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'persiapan-uts-dan-uas',
    category: 'Belajar & Ujian',
    title: 'Persiapan UTS dan UAS',
    summary: 'Mulai 2 minggu sebelumnya dengan peta materi dan latihan soal.',
    steps: [
      'Kumpulkan silabus, slide, dan soal tahun lalu.',
      'Prioritaskan topik yang bobot dan kesulitannya tinggi.',
      'Tidur cukup malam sebelumnya, jangan begadang.',
    ],
    keywords: 'ujian belajar soal begadang sks final midterm',
    readMinutes: 2,
    proTip:
      'Kerjakan soal tahun lalu dengan kondisi waktu terbatas (simulasi ujian) agar terbiasa mengatur tempo pengerjaan.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'mencatat-dengan-metode-cornell',
    category: 'Belajar & Ujian',
    title: 'Mencatat dengan metode Cornell',
    summary:
      'Bagi halaman menjadi kolom catatan, kolom kata kunci, dan ringkasan bawah.',
    steps: [
      'Catat poin utama di kolom kanan.',
      'Tulis pertanyaan atau kata kunci di kiri setelah kuliah.',
      'Ringkas satu halaman dalam 2 kalimat.',
    ],
    keywords: 'catatan notes kuliah ringkas mind map',
    readMinutes: 2,
    proTip:
      'Saat mengulang materi menjelang ujian, tutup kolom kanan dan uji ingatanmu hanya dengan melihat pertanyaan di kolom kiri.',
  },
  {
    id: 'teknik-pomodoro',
    category: 'Belajar & Ujian',
    title: 'Teknik Pomodoro',
    summary:
      'Fokus 25 menit, istirahat 5 menit. Setelah 4 siklus, istirahat 15–30 menit.',
    steps: [
      'Matikan notifikasi saat siklus.',
      'Tulis gangguan yang muncul, kerjakan nanti.',
      'Sesuaikan durasi: 50/10 juga umum.',
    ],
    keywords: 'fokus konsentrasi prokrastinasi timer',
    readMinutes: 1,
    proTip:
      'Saat istirahat 5 menit, hindari membuka media sosial; bangun untuk peregangan atau minum air agar otak benar-benar pulih.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'cara-aktif-di-kelas-dan-diskusi',
    category: 'Belajar & Ujian',
    title: 'Cara aktif di kelas dan diskusi',
    summary:
      'Siapkan satu pertanyaan sebelum kuliah dimulai agar berani bicara.',
    steps: [
      'Baca materi singkat sebelumnya.',
      'Bicara dengan struktur: poin, alasan, contoh.',
      'Catat nama dan kontak teman diskusi.',
    ],
    keywords: 'presentasi kelompok berbicara percaya diri',
    readMinutes: 2,
    proTip:
      'Jika gugup bertanya langsung, mulailah dengan mengonfirmasi satu contoh kasus dari penjelasan dosen.',
  },
  {
    id: 'memilih-uji-statistik',
    category: 'Statistik & Data',
    title: 'Memilih uji statistik',
    summary: 'Tentukan jenis data dan hubungan yang diuji.',
    steps: [
      'Beda dua kelompok: uji-t (normal) atau Mann-Whitney.',
      'Hubungan dua variabel: korelasi Pearson atau Spearman.',
      'Pengaruh variabel: regresi linier.',
      'Kategorik: chi-square.',
    ],
    keywords: 'spss uji t regresi korelasi anova normalitas data analisis',
    readMinutes: 2,
    proTip:
      'Gunakan Pemilih Uji Statistik interaktif di bawah untuk memastikan uji yang cocok lengkap dengan jalur menu SPSS.',
    relatedTool: 'statistik',
  },
  {
    id: 'menentukan-ukuran-sampel',
    category: 'Statistik & Data',
    title: 'Menentukan ukuran sampel',
    summary:
      'Rumus Slovin: n = N / (1 + N·e²). Untuk regresi, minimal 10–15 responden per variabel.',
    steps: [
      'Tentukan populasi N dan margin error e (5% atau 10%).',
      'Gunakan G*Power untuk perhitungan lebih tepat.',
    ],
    keywords: 'slovin responden populasi kuesioner sampling',
    readMinutes: 2,
    proTip:
      'Tambahkan 10% responden cadangan dari hasil hitung Slovin untuk mengantisipasi kuesioner tidak lengkap atau outlier.',
    relatedTool: 'slovin',
  },
  {
    id: 'kuesioner-yang-valid-dan-reliabel',
    category: 'Statistik & Data',
    title: 'Kuesioner yang valid dan reliabel',
    summary:
      'Uji validitas dengan korelasi item-total, reliabilitas dengan Cronbach’s alpha (≥ 0,7).',
    steps: [
      'Lakukan pilot pada 30 responden.',
      'Buang atau perbaiki item yang tidak valid.',
      'Gunakan skala Likert 1–5.',
    ],
    keywords: 'angket google form alpha validitas reliabilitas instrumen',
    readMinutes: 2,
    proTip:
      'Adopsi instrumen yang sudah teruji dari jurnal sebelumnya lalu sesuaikan konteks bahasanya (adaptasi instrumen) agar validitas lebih terjamin.',
    relatedTool: 'statistik',
  },
  {
    id: 'mengatur-jadwal-kuliah-dan-tugas',
    category: 'Waktu & Produktivitas',
    title: 'Mengatur jadwal kuliah dan tugas',
    summary:
      'Tulis semua tenggat di satu kalender, lalu mundurkan 2 hari untuk target pribadi.',
    steps: [
      'Pakai matriks Eisenhower: penting dan mendesak dulu.',
      'Blok waktu belajar tetap setiap hari.',
      'Evaluasi mingguan tiap Minggu malam.',
    ],
    keywords: 'jadwal kalender prioritas deadline manajemen waktu',
    readMinutes: 2,
    proTip:
      'Sisihkan 15 menit tiap Minggu malam untuk melihat seluruh deadline 7 hari ke depan agar tidak kaget di tengah pekan.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'mengatasi-prokrastinasi',
    category: 'Waktu & Produktivitas',
    title: 'Mengatasi prokrastinasi',
    summary:
      'Mulai dari langkah terkecil selama 5 menit saja. Biasanya momentum datang setelahnya.',
    steps: [
      'Pecah tugas menjadi bagian kecil.',
      'Singkirkan HP dari meja.',
      'Beri hadiah kecil setelah selesai.',
    ],
    keywords: 'malas menunda tunda tugas motivasi',
    readMinutes: 1,
    proTip:
      'Jangan tulis "Kerjakan Bab 2" di daftar tugas; tulis "Buka dokumen dan ringkas 1 jurnal". Target mikro menurunkan hambatan memulai.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'menyeimbangkan-organisasi-dan-kuliah',
    category: 'Waktu & Produktivitas',
    title: 'Menyeimbangkan organisasi dan kuliah',
    summary:
      'Batasi komitmen maksimal 2 organisasi aktif dan jangan korbankan kuliah.',
    steps: [
      'Tulis jam rapat di kalender yang sama.',
      'Delegasikan dan jujur soal kapasitas.',
      'Utamakan peran yang menambah keterampilan.',
    ],
    keywords: 'himpunan ukm bem kepanitiaan',
    readMinutes: 2,
    proTip:
      'Berani berkata "Saya sedang fokus UTS minggu ini, bagian ini saya selesaikan Jumat" jauh lebih profesional daripada menghilang.',
  },
  {
    id: 'mencari-beasiswa',
    category: 'Beasiswa & Biaya',
    title: 'Mencari beasiswa',
    summary:
      'Mulai dari kampus lalu ke program nasional dan internasional.',
    steps: [
      'KIP Kuliah, LPDP, Beasiswa Unggulan, Djarum Plus.',
      'Beasiswa perusahaan: Bank Indonesia, Pertamina, dll.',
      'Luar negeri: Chevening, Fulbright, MEXT, DAAD, Erasmus+.',
      'Siapkan transkrip, esai, dan surat rekomendasi jauh hari.',
    ],
    keywords: 'lpdp kip kuliah biaya ukt dana studi',
    readMinutes: 2,
    proTip:
      'Buat satu folder cloud khusus "Berkas Beasiswa" berisi scan KTP, KTM, transkrip, sertifikat, dan CV terbaru agar siap daftar kapan saja.',
  },
  {
    id: 'menulis-esai-beasiswa',
    category: 'Beasiswa & Biaya',
    title: 'Menulis esai beasiswa',
    summary:
      'Ceritakan dampak yang pernah kamu buat dan rencana kontribusi, bukan hanya kesulitan hidup.',
    steps: [
      'Gunakan satu cerita konkret dengan hasil terukur.',
      'Hubungkan tujuan dengan misi beasiswa.',
      'Minta orang lain membaca sebelum dikirim.',
    ],
    keywords: 'motivation letter statement of purpose personal statement',
    readMinutes: 2,
    proTip:
      'Gunakan struktur Masa Lalu (pengalaman bukti) → Masa Kini (jurusan & kapasitas) → Masa Depan (rencana kontribusi pascastudi).',
  },
  {
    id: 'mengatur-keuangan-bulanan',
    category: 'Beasiswa & Biaya',
    title: 'Mengatur keuangan bulanan',
    summary:
      'Gunakan pola 50/30/20 yang disesuaikan: kebutuhan, keinginan, tabungan.',
    steps: [
      'Catat pengeluaran 30 hari pertama.',
      'Pisahkan rekening untuk dana darurat.',
      'Manfaatkan diskon pelajar dan masak sendiri.',
    ],
    keywords: 'uang kos hemat budget anak kos tabungan',
    readMinutes: 2,
    proTip:
      'Ubah uang bulanan menjadi batas mingguan agar arus kas tetap aman sampai akhir bulan dan tidak boros di minggu pertama.',
  },
  {
    id: 'menyusun-cv-mahasiswa',
    category: 'Karier & Magang',
    title: 'Menyusun CV mahasiswa',
    summary:
      'Satu halaman, fokus pada dampak: apa yang kamu lakukan dan hasilnya.',
    steps: [
      'Urutan: ringkasan, pendidikan, pengalaman, proyek, skill.',
      'Pakai kata kerja dan angka.',
      'Sesuaikan dengan lowongan, simpan dalam PDF.',
    ],
    keywords: 'curriculum vitae resume lamaran kerja ats',
    readMinutes: 2,
    proTip:
      'Gunakan rumus pencapaian: [Kata Kerja Aksi] + [Tugas/Proyek] + [Hasil Terukur], misalnya "Mengelola 12 acara seminar dengan total 850 peserta".',
  },
  {
    id: 'mencari-magang',
    category: 'Karier & Magang',
    title: 'Mencari magang',
    summary: 'Mulai 3–6 bulan sebelum periode magang dibuka.',
    steps: [
      'Cek LinkedIn, Glints, Kalibrr, Magang Merdeka, situs karier perusahaan.',
      'Hubungi alumni dan minta referensi.',
      'Latih wawancara singkat tentang dirimu.',
    ],
    keywords: 'internship kampus merdeka linkedin pengalaman kerja',
    readMinutes: 2,
    proTip:
      'Catat setiap lamaran di satu tabel sederhana (Perusahaan, Posisi, Tanggal Kirim, Status) agar mudah melakukan tindak lanjut.',
  },
  {
    id: 'persiapan-wawancara-kerja',
    category: 'Karier & Magang',
    title: 'Persiapan wawancara kerja',
    summary: 'Gunakan metode STAR: Situasi, Tugas, Aksi, Hasil.',
    steps: [
      'Riset perusahaan dan posisi.',
      'Siapkan 3 cerita pengalaman.',
      'Siapkan 2 pertanyaan untuk pewawancara.',
    ],
    keywords: 'interview hrd tes psikotes fresh graduate',
    readMinutes: 2,
    proTip:
      'Salah satu pertanyaan penutup terbaik: "Seperti apa keberhasilan di posisi ini dalam 3 bulan pertama?"',
  },
  {
    id: 'mengatasi-stres-dan-burnout',
    category: 'Kesehatan Mental',
    title: 'Mengatasi stres dan burnout',
    summary:
      'Tanda: lelah terus-menerus, mudah marah, sulit fokus. Istirahat adalah bagian dari produktivitas.',
    steps: [
      'Tidur 7–8 jam dan bergerak 20 menit sehari.',
      'Ceritakan ke teman atau keluarga yang dipercaya.',
      'Kurangi beban yang bisa ditunda.',
    ],
    keywords: 'capek lelah overthinking cemas anxiety tertekan',
    readMinutes: 2,
    proTip:
      'Beristirahat tanpa rasa bersalah justru mempercepat pemulihan fokus dibandingkan memaksakan duduk 5 jam tanpa hasil.',
    relatedTool: 'pomodoro',
  },
  {
    id: 'kapan-harus-mencari-bantuan-profesional',
    category: 'Kesehatan Mental',
    title: 'Kapan harus mencari bantuan profesional',
    summary:
      'Cari bantuan bila perasaan sedih atau cemas berlangsung lebih dari 2 minggu dan mengganggu aktivitas.',
    steps: [
      'Hubungi layanan konseling kampus.',
      'Puskesmas dan RS juga punya layanan psikologi.',
      'Jika ada pikiran menyakiti diri, segera hubungi orang terdekat atau layanan darurat 119 ext. 8.',
    ],
    keywords: 'psikolog konseling depresi curhat sedih',
    readMinutes: 2,
    proTip:
      'Banyak universitas menyediakan sesi konseling mahasiswa gratis dan rahasia melalui Unit Layanan Konseling atau BK kampus.',
  },
  {
    id: 'aplikasi-pendukung-kuliah',
    category: 'Tools & Aplikasi',
    title: 'Aplikasi pendukung kuliah',
    summary: 'Pilih satu per kebutuhan agar tidak kewalahan.',
    steps: [
      'Catatan: Notion, Obsidian, OneNote.',
      'Sitasi: Mendeley, Zotero.',
      'Tugas: Google Calendar, Todoist.',
      'Diagram: Canva, draw.io. Dokumen: Google Docs, Word.',
    ],
    keywords: 'software notion canva zotero google docs aplikasi gratis',
    readMinutes: 2,
    proTip:
      'Manfaatkan email kampus (.ac.id) untuk akses gratis GitHub Student Pack, Notion Plus Education, Canva Pro, atau Microsoft 365.',
    relatedTool: 'sitasi',
  },
  {
    id: 'bantuan-ai-untuk-belajar',
    category: 'Tools & Aplikasi',
    title: 'Bantuan AI untuk belajar',
    summary:
      'Gunakan AI untuk memahami, bukan menggantikan tugasmu. Verifikasi fakta dan sumbernya.',
    steps: [
      'Minta penjelasan dan contoh soal latihan.',
      'Minta umpan balik atas drafmu sendiri.',
      'Ikuti aturan kampus soal penggunaan AI.',
    ],
    keywords: 'chatgpt claude ai asisten belajar etika',
    readMinutes: 2,
    proTip:
      'Selalu verifikasi referensi jurnal yang diberikan AI secara langsung di Google Scholar atau DOI karena AI dapat mengarang judul makalah.',
  },
  {
    id: 'menyiapkan-slide-presentasi',
    category: 'Tools & Aplikasi',
    title: 'Menyiapkan slide presentasi',
    summary: 'Satu slide satu pesan, teks minimal, visual jelas.',
    steps: [
      'Judul berupa kesimpulan, bukan topik.',
      'Font minimal 24 pt, kontras tinggi.',
      'Latih dengan timer.',
    ],
    keywords: 'ppt powerpoint presentasi canva slide',
    readMinutes: 2,
    proTip:
      'Aturan 1 menit per slide membantu memastikan presentasi sidang 10 menit selesai tepat waktu tanpa terburu-buru di bagian hasil.',
    relatedTool: 'pomodoro',
  },
];

export const STUDY_SCENARIOS: StudyScenario[] = [
  {
    id: 'skripsi-awal',
    kicker: 'Jalur 01 · Tugas Akhir',
    title: 'Baru mulai skripsi',
    description:
      'Tentukan judul yang realistis, pahami kerangka bab, dan kirim pesan bimbingan pertama yang rapi.',
    guideIds: [
      'cara-memilih-topik-skripsi',
      'struktur-bab-skripsi',
      'menulis-latar-belakang-masalah',
      'tips-bimbingan-dengan-dosen',
    ],
    recommendedTool: 'pesan-dosen',
    toolLabel: 'Buat Pesan Dosen',
  },
  {
    id: 'olah-data',
    kicker: 'Jalur 02 · Bab 3 & Bab 4',
    title: 'Hitung sampel & uji data',
    description:
      'Hitung jumlah responden dengan Slovin, uji kuesioner, lalu pilih uji statistik yang sesuai.',
    guideIds: [
      'menentukan-ukuran-sampel',
      'memilih-uji-statistik',
      'kuesioner-yang-valid-dan-reliabel',
      'format-sitasi-apa-harvard-ieee',
    ],
    recommendedTool: 'slovin',
    toolLabel: 'Buka Kalkulator Slovin',
  },
  {
    id: 'kebut-ujian',
    kicker: 'Jalur 03 · Pekan Ujian',
    title: 'Kebut UTS & UAS',
    description:
      'Atur strategi active recall, catatan Cornell, dan blok fokus Pomodoro tanpa begadang.',
    guideIds: [
      'persiapan-uts-dan-uas',
      'teknik-belajar-efektif',
      'mencatat-dengan-metode-cornell',
      'teknik-pomodoro',
    ],
    recommendedTool: 'pomodoro',
    toolLabel: 'Mulai Timer Fokus',
  },
  {
    id: 'karier-beasiswa',
    kicker: 'Jalur 04 · Masa Depan',
    title: 'Kejar magang & beasiswa',
    description:
      'Rapikan CV satu halaman, susun esai kontribusi beasiswa, dan latih jawaban STAR.',
    guideIds: [
      'menyusun-cv-mahasiswa',
      'mencari-magang',
      'mencari-beasiswa',
      'menulis-esai-beasiswa',
    ],
    recommendedTool: 'sitasi',
    toolLabel: 'Buka Generator Sitasi',
  },
];

export const THESIS_STAGES: ThesisStage[] = [
  {
    id: 'tahap-1',
    number: '01',
    title: 'Topik & Pengajuan Judul',
    subtitle: 'Menemukan celah riset yang terukur dan disetujui pembimbing.',
    tasks: [
      { id: 't1-1', label: 'Kumpulkan minimal 10 jurnal 5 tahun terakhir' },
      { id: 't1-2', label: 'Identifikasi celah penelitian & ketersediaan data' },
      { id: 't1-3', label: 'Ajukan 2 opsi judul ke dosen pembimbing' },
    ],
    relatedGuideIds: ['cara-memilih-topik-skripsi', 'mencari-jurnal-ilmiah-gratis'],
  },
  {
    id: 'tahap-2',
    number: '02',
    title: 'Proposal & Seminar Proposal',
    subtitle: 'Menyelesaikan Bab 1–3 dengan kerangka teori dan metode solid.',
    tasks: [
      { id: 't2-1', label: 'Tulis Bab 1 dengan pola corong & data pendukung' },
      { id: 't2-2', label: 'Susun matriks literatur & sintesis Bab 2' },
      { id: 't2-3', label: 'Tetapkan metode, ukuran sampel, dan jadwal Sempro' },
    ],
    relatedGuideIds: [
      'struktur-bab-skripsi',
      'menulis-latar-belakang-masalah',
      'menulis-tinjauan-pustaka',
    ],
  },
  {
    id: 'tahap-3',
    number: '03',
    title: 'Instrumen & Pengumpulan Data',
    subtitle: 'Memastikan alat ukur valid, reliabel, dan target responden tercapai.',
    tasks: [
      { id: 't3-1', label: 'Uji coba kuesioner/instrumen ke 30 responden awal' },
      { id: 't3-2', label: 'Cek validitas item & Cronbach’s Alpha ≥ 0,7' },
      { id: 't3-3', label: 'Kumpulkan data penuh sesuai ukuran sampel + cadangan' },
    ],
    relatedGuideIds: [
      'menentukan-ukuran-sampel',
      'kuesioner-yang-valid-dan-reliabel',
    ],
  },
  {
    id: 'tahap-4',
    number: '04',
    title: 'Analisis Data & Bab 4–5',
    subtitle: 'Mengolah data sesuai uji statistik lalu membandingkan dengan teori.',
    tasks: [
      { id: 't4-1', label: 'Jalankan uji asumsi & uji hipotesis utama' },
      { id: 't4-2', label: 'Tulis pembahasan dengan mengaitkan jurnal Bab 2' },
      { id: 't4-3', label: 'Susun kesimpulan, keterbatasan, dan saran Bab 5' },
    ],
    relatedGuideIds: ['memilih-uji-statistik', 'menulis-abstrak-yang-baik'],
  },
  {
    id: 'tahap-5',
    number: '05',
    title: 'Revisi, Sitasi & Cek Kemiripan',
    subtitle: 'Merapikan daftar pustaka dan memastikan lolos batas plagiarisme.',
    tasks: [
      { id: 't5-1', label: 'Sinkronkan seluruh sitasi teks & daftar pustaka' },
      { id: 't5-2', label: 'Lakukan cek Turnitin & parafrase bagian mirip' },
      { id: 't5-3', label: 'Dapatkan persetujuan ACC sidang dari pembimbing' },
    ],
    relatedGuideIds: [
      'menghindari-plagiarisme',
      'format-sitasi-apa-harvard-ieee',
      'tips-bimbingan-dengan-dosen',
    ],
  },
  {
    id: 'tahap-6',
    number: '06',
    title: 'Presentasi & Sidang Akhir',
    subtitle: 'Menyajikan argumen penelitian secara tenang dan terstruktur.',
    tasks: [
      { id: 't6-1', label: 'Buat maksimal 10 slide inti dengan font ≥ 24 pt' },
      { id: 't6-2', label: 'Siapkan daftar jawaban atas keterbatasan & metode' },
      { id: 't6-3', label: 'Simulasi presentasi dengan timer bersama teman' },
    ],
    relatedGuideIds: ['persiapan-sidang-skripsi', 'menyiapkan-slide-presentasi'],
  },
];

export interface DailyTip {
  id: string;
  kind: 'Tips Produktivitas' | 'Motivasi Akademik';
  text: string;
  authorOrContext: string;
  relatedGuideId?: string;
}

export const DAILY_TIPS: DailyTip[] = [
  {
    id: 'tip-01',
    kind: 'Tips Produktivitas',
    text: 'Tutup catatan lalu tulis ulang tiga poin utama dari memori sebelum menutup buku. Lima menit active recall jauh lebih melekat daripada membaca ulang satu jam.',
    authorOrContext: 'Prinsip Active Recall',
    relatedGuideId: 'teknik-belajar-efektif',
  },
  {
    id: 'tip-02',
    kind: 'Motivasi Akademik',
    text: 'Skripsi terbaik bukan yang paling sempurna di kepala, melainkan yang ditulis pelan-pelan setiap hari sampai selesai dan disidangkan.',
    authorOrContext: 'Pengingat Tugas Akhir',
    relatedGuideId: 'cara-memilih-topik-skripsi',
  },
  {
    id: 'tip-03',
    kind: 'Tips Produktivitas',
    text: 'Saat berat memulai tugas besar, janjikan dirimu cukup bekerja 5 menit saja. Begitu halaman terbuka dan paragraf pertama tertulis, momentum biasanya mengikuti.',
    authorOrContext: 'Aturan 5 Menit Anti-Tunda',
    relatedGuideId: 'mengatasi-prokrastinasi',
  },
  {
    id: 'tip-04',
    kind: 'Tips Produktivitas',
    text: 'Selalu catat sumber kutipan tepat saat kamu membaca jurnal, bukan setelah Bab 2 selesai ditulis. Ini menghemat berjam-jam waktu saat menyusun daftar pustaka.',
    authorOrContext: 'Kebiasaan Riset Rapi',
    relatedGuideId: 'format-sitasi-apa-harvard-ieee',
  },
  {
    id: 'tip-05',
    kind: 'Motivasi Akademik',
    text: 'Revisi dari dosen pembimbing bukan tanda kamu gagal, melainkan tanda tulisanmu sedang dipoles agar lebih kuat saat diuji di ruang sidang.',
    authorOrContext: 'Pola Pikir Bimbingan',
    relatedGuideId: 'tips-bimbingan-dengan-dosen',
  },
  {
    id: 'tip-06',
    kind: 'Tips Produktivitas',
    text: 'Mundurkan seluruh tenggat tugas 2 hari lebih awal di kalender pribadimu. Ruang napas 48 jam melindungi kualitas tulisan saat hal tak terduga muncul.',
    authorOrContext: 'Manajemen Tenggat',
    relatedGuideId: 'mengatur-jadwal-kuliah-dan-tugas',
  },
  {
    id: 'tip-07',
    kind: 'Tips Produktivitas',
    text: 'Baca jurnal ilmiah dengan urutan cepat: abstrak, kesimpulan, tabel utama, baru metode. Kamu bisa menyaring 10 jurnal dalam waktu setengah jam.',
    authorOrContext: 'Strategi Membaca Jurnal',
    relatedGuideId: 'cara-membaca-jurnal-dengan-cepat',
  },
  {
    id: 'tip-08',
    kind: 'Motivasi Akademik',
    text: 'Tidur cukup malam sebelum ujian membantu otak mengonsolidasi ingatan jauh lebih baik daripada memaksakan begadang sampai subuh.',
    authorOrContext: 'Kesehatan Belajar',
    relatedGuideId: 'persiapan-uts-dan-uas',
  },
  {
    id: 'tip-09',
    kind: 'Tips Produktivitas',
    text: 'Jauhkan ponsel ke luar jangkauan tangan selama satu siklus 25 menit. Hanya melihat layar ponsel menyala sudah cukup memecah fokus kerja mendalam.',
    authorOrContext: 'Fokus Pomodoro',
    relatedGuideId: 'teknik-pomodoro',
  },
  {
    id: 'tip-10',
    kind: 'Motivasi Akademik',
    text: 'Satu paragraf yang selesai hari ini lebih berharga daripada rencana satu bab yang terus ditunda menunggu suasana hati sempurna.',
    authorOrContext: 'Konsistensi Menulis',
    relatedGuideId: 'menulis-latar-belakang-masalah',
  },
  {
    id: 'tip-11',
    kind: 'Tips Produktivitas',
    text: 'Jelaskan konsep kuliah yang rumit dengan bahasa sederhana seolah mengajari teman baru. Bagian yang membuatmu tersendat adalah bagian yang perlu diulang.',
    authorOrContext: 'Teknik Feynman',
    relatedGuideId: 'teknik-belajar-efektif',
  },
  {
    id: 'tip-12',
    kind: 'Motivasi Akademik',
    text: 'Istirahat terencana tanpa rasa bersalah adalah bagian dari produktivitas, bukan musuhnya. Otak yang lelah butuh jeda untuk kembali tajam.',
    authorOrContext: 'Jaga Ritme Kuliah',
    relatedGuideId: 'mengatasi-stres-dan-burnout',
  },
  {
    id: 'tip-13',
    kind: 'Tips Produktivitas',
    text: 'Gunakan satu slide untuk satu pesan utama dengan judul berupa kesimpulan. Audiens dan penguji akan menangkap argumenmu jauh lebih cepat.',
    authorOrContext: 'Presentasi Efektif',
    relatedGuideId: 'menyiapkan-slide-presentasi',
  },
  {
    id: 'tip-14',
    kind: 'Tips Produktivitas',
    text: 'Sisihkan 15 menit tiap Minggu malam untuk memetakan kuliah, rapat organisasi, dan tenggat sepekan ke depan agar hari Senin dimulai dengan tenang.',
    authorOrContext: 'Evaluasi Mingguan',
    relatedGuideId: 'menyeimbangkan-organisasi-dan-kuliah',
  },
  {
    id: 'tip-15',
    kind: 'Motivasi Akademik',
    text: 'Jangan membandingkan bab pertamamu dengan bab terakhir orang lain. Setiap penelitian punya ritme, data, dan tantangannya sendiri.',
    authorOrContext: 'Perspektif Perjalanan Studi',
    relatedGuideId: 'struktur-bab-skripsi',
  },
];

