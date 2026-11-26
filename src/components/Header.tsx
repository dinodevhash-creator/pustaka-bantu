import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  savedCount: number;
  onNavigate: (sectionId: string) => void;
  onOpenFocusTimer: () => void;
}

export function Header({
  savedCount,
  onNavigate,
  onOpenFocusTimer,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'panduan', label: 'Panduan' },
    { id: 'alat-bantu', label: 'Alat Bantu' },
    { id: 'progres-skripsi', label: 'Progres Skripsi' },
    {
      id: 'tersimpan',
      label: savedCount > 0 ? `Tersimpan (${savedCount})` : 'Tersimpan',
    },
  ];

  const handleLinkClick = (id: string) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F7F9FC]/92 dark:bg-[#0B1220]/92 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/90">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#beranda"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('beranda');
          }}
          className="font-display text-lg font-extrabold tracking-tight text-[#111C33] dark:text-[#E8EEF9] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D4ED8] rounded"
        >
          Pustaka Bantu
        </a>

        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52607A] dark:text-slate-300"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleLinkClick(item.id)}
              className="py-1 border-b-2 border-transparent hover:border-[#1D4ED8] dark:hover:border-[#60A5FA] hover:text-[#111C33] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1D4ED8] rounded-sm"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenFocusTimer();
            }}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] dark:bg-[#2563EB] dark:hover:bg-[#3B82F6] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            Timer Fokus
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 text-[#111C33] dark:text-[#E8EEF9] bg-white dark:bg-[#131D31] cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#10192B] px-4 py-3">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLinkClick(item.id)}
                className="w-full text-left px-3 py-2.5 text-sm font-medium text-[#111C33] dark:text-[#E8EEF9] hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenFocusTimer();
              }}
              className="mt-2 w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-lg transition-colors"
            >
              Timer Fokus
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
