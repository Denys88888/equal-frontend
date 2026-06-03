import { Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Home, RotateCw, ChevronDown, ChevronUp } from 'lucide-react';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.hash = '/';
    window.location.reload();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-[100dvh] w-full flex items-center justify-center px-6"
          style={{ backgroundColor: '#F7F4EE' }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="w-full max-w-[360px] flex flex-col items-center text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4, ease: easeOutExpo }}
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: 'rgba(187,131,201,0.12)' }}
            >
              <AlertTriangle size={36} className="text-[#BB83C9]" strokeWidth={1.5} />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4, ease: easeOutExpo }}
              className="text-2xl font-bold text-[#232323] mb-2"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Something went wrong
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4, ease: easeOutExpo }}
              className="text-sm text-[#232323] opacity-50 mb-8 max-w-[280px]"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif", lineHeight: 1.55 }}
            >
              We&apos;re sorry, but an unexpected error occurred. You can try reloading the app or go back home.
            </motion.p>

            {/* Error Details - Collapsible */}
            {this.state.error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="w-full mb-6"
              >
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-[#BB83C9] opacity-70 hover:opacity-100 transition-opacity"
                  style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
                >
                  Error details
                  {this.state.showDetails ? (
                    <ChevronUp size={14} strokeWidth={2} />
                  ) : (
                    <ChevronDown size={14} strokeWidth={2} />
                  )}
                </button>

                {this.state.showDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25, ease: easeOutExpo }}
                    className="mt-2 p-4 rounded-xl bg-white text-left overflow-hidden"
                    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  >
                    <pre
                      className="text-[11px] text-[#E86A6A] whitespace-pre-wrap break-all leading-relaxed"
                      style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
                    >
                      {this.state.error.name}: {this.state.error.message}
                      {'\n'}
                      {this.state.error.stack}
                    </pre>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4, ease: easeOutExpo }}
              className="w-full flex flex-col gap-3"
            >
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={this.handleReload}
                className="w-full h-14 rounded-full bg-[#BB83C9] text-white text-base font-semibold flex items-center justify-center gap-2"
                style={{
                  fontFamily: "'Outfit', system-ui, sans-serif",
                  boxShadow: '0 4px 16px rgba(187,131,201,0.3)',
                }}
              >
                <RotateCw size={18} strokeWidth={2} />
                Reload App
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={this.handleGoHome}
                className="w-full h-12 rounded-full border border-[rgba(35,35,35,0.1)] bg-[rgba(255,255,255,0.72)] text-[#232323] text-base font-semibold flex items-center justify-center gap-2"
                style={{
                  backdropFilter: 'blur(12px)',
                  fontFamily: "'Outfit', system-ui, sans-serif",
                }}
              >
                <Home size={18} strokeWidth={2} />
                Go Home
              </motion.button>
            </motion.div>

            {/* Footer branding */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="mt-8 text-[11px] text-[#232323] opacity-25"
              style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
            >
              Equal
            </motion.p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}
