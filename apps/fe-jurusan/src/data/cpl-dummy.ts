// ─────────────────────────────────────────────────────────────────────────────
// CPL Dummy Data — Informatika / Ilmu Komputer
// Semesters: Ganjil 2024/2025 · Genap 2024/2025 · Ganjil 2025/2026
// Angkatan: 2024 (data asli) · 2025 (dummy)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Seeded RNG (deterministic) ──────────────────────────────────────────────
function seededRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 13), s ^ (s << 5));
    s = (s ^ (s >>> 7)) >>> 0;
    return s / 0x100000000;
  };
}

function strHash(str: string): number {
  return str.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) | 0, 0);
}

// ─── CPL Definitions ─────────────────────────────────────────────────────────
export type CplCategory = 'SIKAP' | 'PENGETAHUAN' | 'KETERAMPILAN';

export interface CplDef {
  code: string;
  shortName: string;
  description: string;
  category: CplCategory;
}

export const CPL_LIST: CplDef[] = [
  // SIKAP
  { code: 'CPL01', shortName: 'Ketakwaan & Kebangsaan',        description: 'Menunjukkan sikap bertakwa kepada Tuhan YME, saling menghargai, dan bertanggung jawab dalam kehidupan berbangsa.',                category: 'SIKAP'        },
  { code: 'CPL02', shortName: 'Profesionalisme',                description: 'Menunjukkan sikap profesional: etika profesi, kerja tim multidisiplin, dan respons terhadap isu sosial-teknologi.',               category: 'SIKAP'        },
  // PENGETAHUAN
  { code: 'CPL03', shortName: 'Sistem Komputer & Algoritma',    description: 'Memahami cara kerja sistem komputer dan menerapkan algoritma/metode untuk memecahkan masalah organisasi.',                      category: 'PENGETAHUAN'  },
  { code: 'CPL04', shortName: 'Analisis & Manajemen Proyek',    description: 'Menganalisis persoalan computing kompleks dan mengelola proyek teknologi informatika dengan wawasan transdisiplin.',             category: 'PENGETAHUAN'  },
  { code: 'CPL05', shortName: 'Desain Aplikasi Multi-platform', description: 'Menguasai konsep Ilmu Komputer dalam mendesain dan mensimulasikan aplikasi multi-platform relevan dengan industri.',            category: 'PENGETAHUAN'  },
  // KETERAMPILAN
  { code: 'CPL06', shortName: 'Kewirausahaan TIK',              description: 'Mengaplikasikan konsep kewirausahaan dan bisnis sebagai dasar simulasi wirausaha bidang TIK.',                                   category: 'KETERAMPILAN' },
  { code: 'CPL07', shortName: 'Implementasi Computing',         description: 'Mengimplementasi kebutuhan computing dengan mempertimbangkan berbagai metode/algoritma yang sesuai.',                           category: 'KETERAMPILAN' },
  { code: 'CPL08', shortName: 'Pemikiran Logis & Inovatif',     description: 'Menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam pengembangan IPTEK bidang Informatika.',                     category: 'KETERAMPILAN' },
  { code: 'CPL09', shortName: 'Analisis Kebutuhan Pengguna',    description: 'Mendefinisikan kebutuhan pengguna/pasar dan menganalisis-mengevaluasi algoritma/metode berbasis komputer.',                     category: 'KETERAMPILAN' },
  { code: 'CPL10', shortName: 'UI/UX & Aplikasi Interaktif',    description: 'Menganalisis, merancang, membuat dan mengevaluasi user interface dan aplikasi interaktif.',                                     category: 'KETERAMPILAN' },
  { code: 'CPL11', shortName: 'Solusi Computing Organisasi',    description: 'Mendesain, mengimplementasi dan mengevaluasi solusi berbasis computing multi-platform untuk organisasi.',                       category: 'KETERAMPILAN' },
  { code: 'CPL12', shortName: 'Algoritma Bidang Spesialisasi',  description: 'Mengembangkan dan menerapkan algoritma di bidang Data Science, Network & Cyber Security, Enterprise System, IoT, atau Game Dev.', category: 'KETERAMPILAN' },
];

// ─── Course Catalog ───────────────────────────────────────────────────────────
export interface CourseItem {
  code: string;
  name: string;
  sks: number;
  semesterNum: 1 | 2 | 3; // 1=Ganjil 24/25 · 2=Genap 24/25 · 3=Ganjil 25/26
  difficulty: number;      // 0=mudah … 1=sulit (affects fail rate)
}

export const COURSES: CourseItem[] = [
  // ── Semester 1 — Ganjil 2024/2025 (7 MK) ───────────────────────────────
  { code: 'MKU62107', name: 'Pendidikan Kewarganegaraan',         sks: 2, semesterNum: 1, difficulty: 0.05 },
  { code: 'MKU61108', name: 'Bahasa Indonesia',                   sks: 2, semesterNum: 1, difficulty: 0.08 },
  { code: 'ENG61114', name: 'English for Engineering',            sks: 2, semesterNum: 1, difficulty: 0.18 },
  { code: 'INF61101', name: 'Pengantar Teknologi Informasi',      sks: 3, semesterNum: 1, difficulty: 0.15 },
  { code: 'INF61102', name: 'Algoritma dan Pemrograman I',        sks: 3, semesterNum: 1, difficulty: 0.38 },
  { code: 'ENG61101', name: 'Kalkulus I',                         sks: 3, semesterNum: 1, difficulty: 0.42 },
  { code: 'ENG61106', name: 'Fisika Dasar',                       sks: 3, semesterNum: 1, difficulty: 0.35 },
  // ── Semester 2 — Genap 2024/2025 (8 MK) ────────────────────────────────
  { code: 'MKU61106', name: 'Pendidikan Pancasila',               sks: 2, semesterNum: 2, difficulty: 0.05 },
  { code: 'MKU62101', name: 'Pendidikan Agama',                   sks: 2, semesterNum: 2, difficulty: 0.05 },
  { code: 'UTM61101', name: 'Literasi Digital',                   sks: 2, semesterNum: 2, difficulty: 0.10 },
  { code: 'INF62103', name: 'Pengantar Multimedia',               sks: 3, semesterNum: 2, difficulty: 0.20 },
  { code: 'INF62104', name: 'Algoritma dan Pemrograman II',       sks: 3, semesterNum: 2, difficulty: 0.42 },
  { code: 'ENG62102', name: 'Kalkulus II',                        sks: 3, semesterNum: 2, difficulty: 0.48 },
  { code: 'ENG62110', name: 'Statistika',                         sks: 3, semesterNum: 2, difficulty: 0.35 },
  { code: 'INF62105', name: 'Matematika Informatika',             sks: 3, semesterNum: 2, difficulty: 0.38 },
  // ── Semester 3 — Ganjil 2025/2026 ───────────────────────────────────────
  { code: 'INF61106', name: 'Arsitektur dan Organisasi Komputer', sks: 3, semesterNum: 3, difficulty: 0.35 },
  { code: 'INF61107', name: 'Sistem Operasi',                     sks: 3, semesterNum: 3, difficulty: 0.32 },
  { code: 'INF61108', name: 'Metode Numerik',                     sks: 3, semesterNum: 3, difficulty: 0.40 },
  { code: 'INF61109', name: 'Basis Data',                         sks: 3, semesterNum: 3, difficulty: 0.28 },
  { code: 'INF61110', name: 'Pemrograman Berorientasi Objek I',   sks: 3, semesterNum: 3, difficulty: 0.33 },
  { code: 'INF61111', name: 'Pengembangan Aplikasi Berbasis Web', sks: 3, semesterNum: 3, difficulty: 0.25 },
  { code: 'INF61112', name: 'UI/UX Design Principles',            sks: 2, semesterNum: 3, difficulty: 0.20 },
  { code: 'INF61113', name: 'Struktur Data & Algoritma Lanjut',   sks: 3, semesterNum: 3, difficulty: 0.44 },
];

// ─── CPMK Definitions ────────────────────────────────────────────────────────
// 1 CPMK melekat pada tepat 1 MK; 1 MK bisa punya banyak CPMK.
export interface CpmkDef {
  code: string;      // e.g. 'CPMK011'
  cplCode: string;   // CPL yang didukung, e.g. 'CPL01'
  description: string;
  mkCode: string;    // MK tempat CPMK ini berada ('' = belum dipetakan di sem 1-3)
}

export const CPMK_LIST: CpmkDef[] = [
  // ── CPL01 — Ketakwaan & Kebangsaan ─────────────────────────────────────
  { code: 'CPMK011', cplCode: 'CPL01', description: 'Mampu menunjukkan perilaku yang mencerminkan internalisasi nilai spiritual dan etika dalam pelaksanaan tugas profesional di bidang teknologi informasi.', mkCode: 'MKU62101' },
  { code: 'CPMK012', cplCode: 'CPL01', description: 'Mampu menunjukkan sikap toleransi dan menghargai perbedaan pendapat dalam lingkungan kerja yang multikultural.', mkCode: 'MKU62101' },
  { code: 'CPMK013', cplCode: 'CPL01', description: 'Mampu menerapkan tanggung jawab profesi sesuai dengan norma hukum dan etika bernegara dalam praktik kerja.', mkCode: 'MKU62107' },
  { code: 'CPMK014', cplCode: 'CPL01', description: 'Mampu mewujudkan integritas, sikap saling menghargai dan bertanggung jawab di kehidupan berbangsa dan bernegara.', mkCode: 'MKU61106' },
  // ── CPL02 — Profesionalisme ─────────────────────────────────────────────
  { code: 'CPMK021', cplCode: 'CPL02', description: 'Mampu menunjukkan sikap profesional dan etika dalam penggunaan teknologi informasi, serta respons terhadap perkembangan teknologi dan isu sosial terkait TI.', mkCode: 'INF61101' },
  { code: 'CPMK022', cplCode: 'CPL02', description: 'Mampu menerapkan prinsip etika profesi informatika dalam berbagai situasi kerja secara konsisten.', mkCode: '' },
  { code: 'CPMK023', cplCode: 'CPL02', description: 'Mampu berkomunikasi secara efektif baik lisan maupun tulisan.', mkCode: 'MKU61108' },
  // ── CPL03 — Sistem Komputer & Algoritma ────────────────────────────────
  { code: 'CPMK031', cplCode: 'CPL03', description: 'Mampu menjelaskan cara kerja sistem komputer dan mengidentifikasi komponen-komponen teknologi informasi (hardware, software, brainware, jaringan, dan data).', mkCode: 'INF61101' },
  { code: 'CPMK032', cplCode: 'CPL03', description: 'Mampu menerapkan algoritma komputasi yang efisien untuk memecahkan masalah organisasi.', mkCode: 'INF61102' },
  { code: 'CPMK033', cplCode: 'CPL03', description: 'Mampu menganalisis sistem komputer dan permasalahan organisasi sebagai dasar pengambilan solusi berbasis teknologi informasi.', mkCode: '' },
  // ── CPL04 — Analisis & Manajemen Proyek ────────────────────────────────
  { code: 'CPMK041', cplCode: 'CPL04', description: 'Mampu menganalisis masalah komputasi yang kompleks menggunakan pendekatan berpikir komputasional.', mkCode: 'ENG62110' },
  { code: 'CPMK042', cplCode: 'CPL04', description: 'Mampu merancang dokumen manajemen proyek TI yang mencakup analisis risiko, sumber daya, dan jadwal pelaksanaan.', mkCode: '' },
  { code: 'CPMK043', cplCode: 'CPL04', description: 'Mampu mengembangkan solusi teknologi berbasis pendekatan transdisiplin untuk meningkatkan efisiensi operasional.', mkCode: '' },
  // ── CPL05 — Desain Aplikasi Multi-platform ─────────────────────────────
  { code: 'CPMK051', cplCode: 'CPL05', description: 'Mampu menguraikan konsep teoritis teknologi informasi, arsitektur sistem, serta aplikasi multi-platform yang relevan dengan kebutuhan industri dan masyarakat.', mkCode: 'INF61101' },
  { code: 'CPMK052', cplCode: 'CPL05', description: 'Mampu mengembangkan model simulasi aplikasi teknologi cerdas sesuai kebutuhan industri.', mkCode: '' },
  { code: 'CPMK053', cplCode: 'CPL05', description: 'Mampu menjelaskan, menganalisis, dan menerapkan konsep bidang informatika dalam merancang serta menggunakan aplikasi teknologi multi-platform yang relevan dengan kebutuhan industri dan masyarakat.', mkCode: 'UTM61101' },
  // ── CPL06 — Kewirausahaan TIK ──────────────────────────────────────────
  { code: 'CPMK061', cplCode: 'CPL06', description: 'Mampu menyusun rencana bisnis (business plan) untuk produk atau layanan digital yang layak.', mkCode: '' },
  { code: 'CPMK062', cplCode: 'CPL06', description: 'Mampu mengidentifikasi peluang pasar dan memodelkan nilai ekonomi dari inovasi teknologi informasi yang dikembangkan.', mkCode: '' },
  // ── CPL07 — Implementasi Computing ─────────────────────────────────────
  { code: 'CPMK071', cplCode: 'CPL07', description: 'Mampu mengimplementasikan kode program menggunakan prinsip clean code menggunakan bahasa pemrograman terkini.', mkCode: 'INF61102' },
  { code: 'CPMK072', cplCode: 'CPL07', description: 'Mampu mengevaluasi kinerja algoritma berdasarkan efisiensi waktu dan penggunaan sumber daya.', mkCode: 'INF62103' },
  { code: 'CPMK073', cplCode: 'CPL07', description: 'Mampu menjelaskan prinsip-prinsip dasar algoritma.', mkCode: 'INF61102' },
  // ── CPL08 — Pemikiran Logis & Inovatif ─────────────────────────────────
  { code: 'CPMK081', cplCode: 'CPL08', description: 'Mampu merancang solusi inovatif berbasis teknologi dengan mempertimbangkan aspek sosial, budaya, dan humaniora.', mkCode: 'INF61112' },
  { code: 'CPMK082', cplCode: 'CPL08', description: 'Mampu melaksanakan pengujian perangkat lunak secara sistematis untuk memastikan kualitas sistem.', mkCode: '' },
  { code: 'CPMK083', cplCode: 'CPL08', description: 'Mampu mengevaluasi dan menyusun argumen logis terhadap pemilihan solusi teknologi berdasarkan data dan bukti ilmiah.', mkCode: 'ENG62110' },
  { code: 'CPMK084', cplCode: 'CPL08', description: 'Mampu menjelaskan prinsip-prinsip dasar sains dan matematika di bidang Informatika.', mkCode: 'ENG61101' },
  // ── CPL09 — Analisis Kebutuhan Pengguna ────────────────────────────────
  { code: 'CPMK091', cplCode: 'CPL09', description: 'Mampu melakukan elisitasi kebutuhan pengguna untuk menyusun spesifikasi fungsional dan nonfungsional sistem komputasi.', mkCode: 'INF61102' },
  { code: 'CPMK092', cplCode: 'CPL09', description: 'Mampu mengevaluasi kinerja sistem yang ada dan mengusulkan perbaikan berbasis algoritma untuk meningkatkan efisiensi proses bisnis.', mkCode: '' },
  // ── CPL10 — UI/UX & Aplikasi Interaktif ────────────────────────────────
  { code: 'CPMK101', cplCode: 'CPL10', description: 'Mampu merancang antarmuka pengguna (UI) dan pengalaman pengguna (UX) berdasarkan prinsip desain yang berorientasi pada pengguna.', mkCode: 'INF61112' },
  { code: 'CPMK102', cplCode: 'CPL10', description: 'Mampu membangun prototipe aplikasi interaktif yang memenuhi aspek ketergunaan (usability) dan fungsi dasar sistem.', mkCode: 'INF62103' },
  // ── CPL11 — Solusi Computing Organisasi ────────────────────────────────
  { code: 'CPMK111', cplCode: 'CPL11', description: 'Mampu merancang arsitektur sistem sesuai kebutuhan proses bisnis organisasi.', mkCode: 'INF61109' },
  { code: 'CPMK112', cplCode: 'CPL11', description: 'Mampu mengimplementasikan solusi perangkat lunak multi-platform dengan memperhatikan interoperabilitas dasar.', mkCode: '' },
  { code: 'CPMK113', cplCode: 'CPL11', description: 'Mampu mengevaluasi solusi komputasi berdasarkan kesesuaian dengan kebutuhan bisnis dan kriteria kinerja sistem.', mkCode: '' },
  // ── CPL12 — Algoritma Bidang Spesialisasi ──────────────────────────────
  { code: 'CPMK121', cplCode: 'CPL12', description: 'Mampu menerapkan algoritma atau model komputasi pada salah satu bidang peminatan (Data Science, Network & Cyber Security, Enterprise System, IoT Development, atau Game Development).', mkCode: '' },
  { code: 'CPMK122', cplCode: 'CPL12', description: 'Mampu mengintegrasikan solusi komputasi ke dalam lingkungan operasional sederhana dengan memperhatikan aspek security dan reliability.', mkCode: 'INF61106' },
];

/** CPL → daftar kode CPMK */
export const CPL_CPMK_MAP: Record<string, string[]> = CPMK_LIST.reduce<Record<string, string[]>>(
  (acc, c) => { (acc[c.cplCode] ??= []).push(c.code); return acc; },
  {},
);

// ─── CPL ↔ Course Mapping (sumber: Kurikulum OBE IF 2024 Widyatama) ──────────
// Hanya MK semester 1–3. Referensi: pemetaan CPL–CPMK–MK per dokumen kurikulum.
export const CPL_COURSE_MAP: Record<string, string[]> = {
  // Ketakwaan & Kebangsaan — Agama (CPMK011-012), Pkn (CPMK013-014), Pancasila (CPMK013-014)
  CPL01: ['MKU62101', 'MKU62107', 'MKU61106'],
  // Profesionalisme & Komunikasi — Bhs Indonesia (CPMK023), English (CPMK023), PTI (CPMK021), Literasi Digital (CPMK021)
  CPL02: ['MKU61108', 'ENG61114', 'INF61101', 'UTM61101'],
  // Sistem Komputer & Algoritma — PTI, Algo I, Multimedia, Arch Komputer, Sis Operasi, Basis Data, Web, Struktur Data
  CPL03: ['INF61101', 'INF61102', 'INF62103', 'INF61106', 'INF61107', 'INF61109', 'INF61111', 'INF61113'],
  // Analisis & Manajemen Proyek — Statistika, Mat Informatika, Metode Numerik
  CPL04: ['ENG62110', 'INF62105', 'INF61108'],
  // Desain Aplikasi Multi-platform — PTI, Literasi Digital, Basis Data, PBO I
  CPL05: ['INF61101', 'UTM61101', 'INF61109', 'INF61110'],
  // Kewirausahaan TIK — belum ada MK di semester 1–3
  CPL06: [],
  // Implementasi Computing — Algo I, Multimedia, Algo II, Basis Data, Struktur Data
  CPL07: ['INF61102', 'INF62103', 'INF62104', 'INF61109', 'INF61113'],
  // Pemikiran Logis & Inovatif — PTI, Kalkulus I, Fisika, Statistika, Kalkulus II, Mat Inf, Metode Numerik, UI/UX, Struktur Data
  CPL08: ['INF61101', 'ENG61101', 'ENG61106', 'ENG62110', 'ENG62102', 'INF62105', 'INF61108', 'INF61112', 'INF61113'],
  // Analisis Kebutuhan Pengguna — belum cukup MK representatif di sem 1–3; baru terukur penuh di sem 4+
  CPL09: [],
  // UI/UX & Aplikasi Interaktif — baru diperkenalkan di sem 2–3, terukur penuh di sem 4+
  CPL10: [],
  // Solusi Computing Organisasi — baru dimulai di sem 3, terukur penuh di sem 4+
  CPL11: [],
  // Algoritma Bidang Spesialisasi — MK peminatan belum ada di sem 1–3
  CPL12: [],
};

// ─── Academic Semesters ───────────────────────────────────────────────────────
export interface AcademicSemesterDef {
  id: string;
  label: string;
  shortLabel: string;
  /** Student-semester numbers available per angkatan as of this academic semester */
  angkatan2024Sems: number[];
  angkatan2025Sems: number[];
}

export const ACADEMIC_SEMESTERS: AcademicSemesterDef[] = [
  {
    id: 'ganjil-2024',
    label: 'Ganjil 2024/2025',
    shortLabel: 'Ganjil 24/25',
    angkatan2024Sems: [1],
    angkatan2025Sems: [],
  },
  {
    id: 'genap-2025',
    label: 'Genap 2024/2025',
    shortLabel: 'Genap 24/25',
    angkatan2024Sems: [1, 2],
    angkatan2025Sems: [],
  },
  {
    id: 'ganjil-2025',
    label: 'Ganjil 2025/2026',
    shortLabel: 'Ganjil 25/26',
    angkatan2024Sems: [1, 2, 3],
    angkatan2025Sems: [1],
  },
];

// ─── Students ─────────────────────────────────────────────────────────────────
export interface StudentData {
  nim: string;
  name: string;
  angkatan: 2024 | 2025;
}

// ─── Angkatan 2024 — data asli ───────────────────────────────────────────────
const STUDENTS_2024: { nim: string; name: string }[] = [
  { nim: '240611009', name: 'SALMAN KHALIL AL FATHIR' },
  { nim: '240611015', name: 'FARHAN MAHA PUTRA' },
  { nim: '240611016', name: 'ILHAM WAHYUDI SILALAHI' },
  { nim: '240611019', name: 'NAUFAL DHEANA HANAFI' },
  { nim: '240611024', name: 'FAZAL RAMDANI' },
  { nim: '240611025', name: 'HAIDAR MAALIK AFLAH' },
  { nim: '240611026', name: 'RIAN PURNAMA' },
  { nim: '240611031', name: 'BAGAS BAHRUL ANWAR' },
  { nim: '240611033', name: 'KAFKA FAREL JANUAR' },
  { nim: '240611041', name: 'MICHAEL VERNANDO ANTONIUS LETSOIN' },
  { nim: '240611047', name: 'THUFAIL KARESKIA ISMADDUDIN' },
  { nim: '240611048', name: 'ZAKY SYASMI' },
  { nim: '240611051', name: 'MUHAMAD HANIF TAQORUB' },
  { nim: '240611056', name: 'VALENTINO PUTRA NOER SARIP' },
  { nim: '240611057', name: 'RUDI ARO NIRMANSYAH GULO' },
  { nim: '240611058', name: 'BANI SUCIYAWAN' },
  { nim: '240611063', name: 'MUHAMAD FAHRUL HIDAYAH' },
  { nim: '240611064', name: 'RICHARD CHRISTIAN YAKADEWA' },
  { nim: '240611069', name: 'JOSHUA CHANDRA HARIANTO' },
  { nim: '240611071', name: 'BAGASKARA MAHARDHIKA RUKMANA' },
  { nim: '240611084', name: 'NUR ALIFKA SALSABILA' },
  { nim: '240611087', name: 'SANDRO EGIARTO TANELAPH' },
  { nim: '240611093', name: 'MUHAMAD YASIR' },
  { nim: '240611097', name: 'MUHAMMAD ARYO IRWANTO' },
  { nim: '240611100', name: 'FAWWAZ RAMADHANU PUTRAWANDIRO' },
  { nim: '240611103', name: 'TAURA JHOSEPINA ALBAR' },
  { nim: '240611104', name: 'WILDAN FEBRIANA SAPUTRA' },
];

// ─── Nama dummy — untuk melengkapi ~100 mahasiswa per angkatan ───────────────
const _FN = [
  'AHMAD','ALDI','ARIF','BAGUS','BIMA','CAHYO','DANDI','DANU','DIMAS','DWI',
  'EKO','FAJAR','FAREL','GALIH','GILANG','HABIB','HENDRA','IRFAN','IQBAL','JOKO',
  'KEVIN','LUTHFI','MUHAMAD','NANDA','OSCAR','PANJI','RAFI','RIZAL','SANDI','SURYA',
  'TEGUH','UMAR','VINO','WAHYU','YOGI','ZULKIFLI','BAYU','DAFA','ERLANGGA','FAISAL',
  'AULIA','BILQIS','CANTIKA','DITA','FARA','GHINA','HANA','INDAH','KAMILA','LAILA',
];
const _LN = [
  'PRATAMA','SANTOSO','WIJAYA','KURNIAWAN','SETIAWAN','PURNAMA','KUSUMA',
  'NUGRAHA','HIDAYAT','FIRMANSYAH','GUNAWAN','RAHAYU','SAPUTRA','MAULANA',
  'RAHMAN','PRABOWO','WIBOWO','HAKIM','PUTRA','RAMADHAN',
  'PERMANA','HARAHAP','NASUTION','ISKANDAR','LUBIS','ANDRIANA','BUDIMAN','CAHYONO','DHARMA','FADILAH',
];

function genDummyStudents(
  count: number,
  nimFn: (i: number) => string,
  angkatan: 2024 | 2025,
  seed: number,
): StudentData[] {
  const rng = seededRng(seed);
  return Array.from({ length: count }, (_, i) => ({
    nim: nimFn(i),
    name: `${_FN[Math.floor(rng() * _FN.length)]} ${_LN[Math.floor(rng() * _LN.length)]}`,
    angkatan,
  }));
}

// angkatan 2024: 27 asli + 123 dummy = 150 total
// angkatan 2025: 132 dummy
// NIM 2024 extra → 240611105–240611227; NIM 2025 → 250611001–250611132
const EXTRA_2024 = genDummyStudents(123, (i) => String(240611105 + i), 2024, 20240001);
const DUMMY_2025 = genDummyStudents(132, (i) => `25061${String(1001 + i).slice(1)}`, 2025, 20250001);

export const STUDENTS: StudentData[] = [
  ...STUDENTS_2024.map((s) => ({ ...s, angkatan: 2024 as const })),
  ...EXTRA_2024,
  ...DUMMY_2025,
];

// ─── Grade Generation ─────────────────────────────────────────────────────────
// Mahasiswa baru semester 1–3: distribusi nilai lebih realistis.
// Fail rate: 28% (mudah) – 55% (sangat sulit). Nilai lulus menumpuk di 65–82.
function generateGrade(nim: string, courseCode: string, difficulty: number): number {
  const seed = Math.abs(strHash(nim + ':' + courseCode));
  const rng = seededRng(seed);
  const r = rng();
  const failRate = 0.12 + difficulty * 0.35; // 12%–29% fail rate → lebih realistis
  if (r < failRate) {
    return Math.round(38 + rng() * 24); // belum lulus: 38–62
  }
  return Math.round(65 + rng() * 20);   // lulus: 65–85 → IPK rata-rata ≈ 2.7
}

export const GRADES: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  for (const s of STUDENTS) {
    for (const c of COURSES) {
      map[`${s.nim}-${c.code}`] = generateGrade(s.nim, c.code, c.difficulty);
    }
  }
  return map;
})();

// ─── Helper: available courses for a student in a given academic semester ─────
export function getAvailableCourses(angkatan: 2024 | 2025, semId: string): string[] {
  const sem = ACADEMIC_SEMESTERS.find((s) => s.id === semId);
  if (!sem) return [];
  const semNums = angkatan === 2024 ? sem.angkatan2024Sems : sem.angkatan2025Sems;
  return COURSES.filter((c) => semNums.includes(c.semesterNum)).map((c) => c.code);
}

// ─── CPL Achievement Per Student ─────────────────────────────────────────────
export type CplStatus = 'met' | 'not_met' | 'no_data';

export interface StudentCplResult {
  student: StudentData;
  cplMap: Record<string, CplStatus>;
  cplPct: Record<string, number>;  // % passed courses per CPL (0 if no_data)
  metCount: number;                // CPLs with data that are met (pct >= 60)
  totalWithData: number;
}

export function computeStudentCplResults(
  students: StudentData[],
  semId: string,
): StudentCplResult[] {
  return students.map((student) => {
    const available = getAvailableCourses(student.angkatan, semId);
    const cplMap: Record<string, CplStatus> = {};
    const cplPct: Record<string, number> = {};
    let metCount = 0;
    let totalWithData = 0;

    for (const cpl of CPL_LIST) {
      const mapped = CPL_COURSE_MAP[cpl.code] ?? [];
      const inSem = mapped.filter((c) => available.includes(c));

      // CPL hanya no_data jika benar-benar tidak ada MK yang sudah diambil.
      // CPL dengan sedikit MK (mis. CPL12 baru 1 MK di sem 1-3) tetap dievaluasi
      // agar seluruh 12 CPL terlihat di dashboard kecuali yang sama sekali belum ada MK-nya.
      if (inSem.length === 0) {
        cplMap[cpl.code] = 'no_data';
        cplPct[cpl.code] = 0;
        continue;
      }

      const passed = inSem.filter((c) => (GRADES[`${student.nim}-${c}`] ?? 0) >= 65).length;
      const pct = Math.round((passed / inSem.length) * 100);
      cplPct[cpl.code] = pct;

      const status: CplStatus = pct >= 75 ? 'met' : 'not_met';
      cplMap[cpl.code] = status;
      totalWithData++;
      if (status === 'met') metCount++;
    }

    return { student, cplMap, cplPct, metCount, totalWithData };
  });
}

// ─── CPL Aggregate Stats ──────────────────────────────────────────────────────
export interface CplAggStat {
  code: string;
  shortName: string;
  description: string;
  category: CplCategory;
  met: number;
  notMet: number;
  noData: number;
  total: number;       // met + notMet
  pct: number;         // met / total * 100 (0 if total=0)
}

export function computeCplStats(results: StudentCplResult[]): CplAggStat[] {
  return CPL_LIST.map((cpl) => {
    let met = 0, notMet = 0, noData = 0;
    let pctSum = 0, pctCount = 0;
    for (const r of results) {
      const s = r.cplMap[cpl.code];
      if (s === 'met') {
        met++;
        pctSum += r.cplPct[cpl.code];
        pctCount++;
      } else if (s === 'not_met') {
        notMet++;
        pctSum += r.cplPct[cpl.code];
        pctCount++;
      } else {
        noData++;
      }
    }
    const total = met + notMet;
    return {
      code: cpl.code,
      shortName: cpl.shortName,
      description: cpl.description,
      category: cpl.category,
      met,
      notMet,
      noData,
      total,
      pct: pctCount > 0 ? Math.round(pctSum / pctCount) : 0,
    };
  });
}
