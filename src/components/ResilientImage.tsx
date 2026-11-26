import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  fallbackTitle?: string;
}

export function ResilientImage({
  src,
  alt,
  caption,
  className = '',
  fallbackTitle = 'Pustaka Bantu Mahasiswa',
}: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-300 p-8 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-8 h-8 text-[#1D4ED8] dark:text-[#60A5FA] mb-3" />
        <p className="font-display font-semibold text-base text-[#111C33] dark:text-[#E8EEF9]">
          {fallbackTitle}
        </p>
        {caption && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            {caption}
          </p>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
