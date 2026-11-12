import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-5">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 mb-2">
              Đã xảy ra lỗi hiển thị hệ thống
            </h1>
            <p className="text-sm text-slate-600 mb-5 leading-relaxed">
              Ứng dụng gặp sự cố ngoài ý muốn khi xử lý giao diện báo cáo. Vui
              lòng tải lại trang để khôi phục.
            </p>
            {this.state.error?.message && (
              <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-3 text-left text-xs font-mono text-red-700 break-words">
                {this.state.error.message}
              </div>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Tải lại Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface FetchErrorCardProps {
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export function FetchErrorCard({
  message,
  onRetry,
  isRetrying = false,
}: FetchErrorCardProps) {
  return (
    <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-red-200 shadow-sm p-8 text-center">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-4">
        <AlertOctagon className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Không thể tải dữ liệu tiến độ từ Google Sheets
      </h2>
      <p className="text-sm text-slate-600 mb-4 leading-relaxed">
        Vui lòng kiểm tra kết nối mạng hoặc đảm bảo liên kết CSV đã được xuất bản
        công khai trên Google Sheets.
      </p>
      <div className="mb-6 rounded-xl bg-red-50/70 border border-red-100 px-4 py-3 text-xs text-red-700 text-left break-words">
        <span className="font-semibold">Chi tiết lỗi: </span>
        {message}
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium shadow-sm transition-colors cursor-pointer"
      >
        <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
        {isRetrying ? 'Đang thử kết nối lại...' : 'Thử tải lại dữ liệu'}
      </button>
    </div>
  );
}
