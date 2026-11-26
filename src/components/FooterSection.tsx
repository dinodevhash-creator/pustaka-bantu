import { ArrowUp, PlayCircle } from 'lucide-react';
import { ResilientImage } from './ResilientImage';

interface FooterSectionProps {
  onJumpToMentalHealth: () => void;
  onOpenPromoVideo: () => void;
  onScrollTop: () => void;
}

export function FooterSection({
  onJumpToMentalHealth,
  onOpenPromoVideo,
  onScrollTop,
}: FooterSectionProps) {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0D1627]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pb-10 border-b border-slate-200/80 dark:border-slate-800">
          <div className="lg:col-span-5 overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 min-h-[200px]">
            <ResilientImage
              src="/src/assets/images/study_calm_library_1795656705544.jpg"
              alt="Ruang baca kampus modern dengan jendela besar menghadap pepohonan hijau dan meja belajar kayu"
              fallbackTitle="Ruang Belajar Tenang"
              caption="Belajar bertahap, istirahat cukup, dan jaga kesehatan mental selama kuliah."
              className="w-full h-full object-cover lg:h-full"
            />
          </div>

          <div className="lg:col-span-7 flex flex-col justify-between bg-[#F7F9FC] dark:bg-[#111B2E] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
            <div>
              <p className="text-xs font-medium text-[#52607A] dark:text-slate-400">
                Pengingat di Tengah Kesibukan Kuliah
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-[#111C33] dark:text-[#F1F5F9]">
                Istirahat adalah bagian dari produktivitas
              </h2>
              <p className="mt-2.5 text-sm text-[#4A5873] dark:text-slate-300 leading-relaxed max-w-[60ch]">
                Bila beban kuliah, skripsi, atau tekanan akademik terasa terlalu berat hingga
                mengganggu tidur dan aktivitas harianmu lebih dari dua minggu, jangan hadapi
                sendirian. Hubungi layanan konseling kampus, psikolog puskesmas, atau layanan
                darurat <strong className="font-mono text-[#111C33] dark:text-white">119 ext. 8</strong>.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={onJumpToMentalHealth}
                className="text-xs font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 cursor-pointer"
              >
                Baca panduan kesehatan mental mahasiswa →
              </button>
              <span className="text-xs text-[#52607A] dark:text-slate-400">
                Pintasan cepat: tekan <kbd className="font-mono px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1220]">/</kbd> untuk mencari kapan saja
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#52607A] dark:text-slate-400">
          <p className="max-w-2xl leading-relaxed">
            <strong className="font-semibold text-[#111C33] dark:text-slate-200">
              Pustaka Bantu Mahasiswa.
            </strong>{' '}
            Panduan umum. Untuk aturan resmi, selalu cek buku pedoman kampus dan dosen
            pembimbingmu.
          </p>
          <div className="flex items-center gap-4 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={onOpenPromoVideo}
              className="inline-flex items-center gap-1.5 font-semibold text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>Video Promosi</span>
            </button>
            <button
              type="button"
              onClick={onScrollTop}
              className="inline-flex items-center gap-1.5 font-semibold text-[#111C33] dark:text-slate-200 hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Kembali ke atas</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
