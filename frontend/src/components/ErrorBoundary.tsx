import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Enterprise React Error Boundary
 * Traps runtime render exceptions, prevents white-screen cascades, and displays a
 * tactile Caldera OSINT telemetry diagnostics crash recovery HUD.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });
    console.error('[HIRELENS ERROR BOUNDARY TRAPPED EXCEPTION]', error, errorInfo);
  }

  public handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public handleReload = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#DFDCD5] px-4 py-12 text-[#0A0A0B]">
          <div className="hl-frame hl-shadow w-full max-w-xl border border-[#0A0A0B] bg-[#F5F4F0] p-6 md:p-8">
            <div className="flex items-center gap-3 border-b border-[#0A0A0B] pb-4">
              <span className="flex h-9 w-9 items-center justify-center border border-[#0A0A0B] bg-[#FC5000] text-white">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <p className="hl-mono text-[10px] uppercase tracking-[0.2em] text-[#FC5000]">
                  TERMINAL SYSTEM CRASH EXCEPTION // TRAPPED
                </p>
                <h1 className="hl-title text-xl leading-tight">UI Telemetry Render Fault</h1>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-[#0A0A0B]/80">
              An unexpected exception was caught by the HireLens defensive boundary. All background
              collectors remain healthy and active.
            </p>

            {this.state.error && (
              <div className="mt-4 overflow-hidden border border-[#0A0A0B] bg-[#0A0A0B] p-3 text-[11px] text-white">
                <p className="hl-mono text-[#FC5000]">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="hl-mono mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap opacity-60 text-[10px]">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={this.handleReload}
                className="hl-mono hl-press-flat flex items-center gap-2 border border-[#0A0A0B] bg-[#0A0A0B] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-white hover:bg-[#FC5000]"
              >
                <RefreshCw className="h-3.5 w-3.5" /> [ RELOAD TERMINAL ]
              </button>
              <button
                onClick={this.handleReset}
                className="hl-mono hl-press-flat flex items-center gap-2 border border-[#0A0A0B] bg-white px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[#0A0A0B] hover:bg-[#DFDCD5]"
              >
                <Home className="h-3.5 w-3.5" /> [ RETURN TO RADAR ]
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
