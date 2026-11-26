import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Terjadi kesalahan saat memuat halaman.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F9FC] dark:bg-[#0B1220] p-6">
          <div className="max-w-md w-full bg-white dark:bg-[#111B2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4">
            <h1 className="font-display text-xl font-bold text-[#111C33] dark:text-[#F1F5F9]">
              Terjadi kendala sementara
            </h1>
            <p className="text-sm text-[#4A5873] dark:text-slate-300 leading-relaxed">
              Muat ulang halaman untuk melanjutkan sesi belajarmu. Progres yang sudah tersimpan
              tetap aman.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
