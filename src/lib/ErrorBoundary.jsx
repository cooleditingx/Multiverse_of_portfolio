import { Component } from 'react';

/**
 * Catches render crashes (the WebGL scenes are the likely culprits on old
 * devices) so a broken universe shows a plain-HTML fallback instead of a
 * white screen. Class component because error boundaries can't be hooks.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen grid place-items-center bg-[var(--space-bg)] px-6 text-center">
        <div>
          <p className="font-mono text-sm text-[var(--ink-dim)] mb-3">
            SIGNAL LOST — this universe hit a snag.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="font-mono text-sm text-[var(--cyan)] border border-[var(--cyan)] rounded px-4 py-2 hover:bg-[var(--cyan)] hover:text-black transition-colors"
          >
            RE-ENTER ORBIT (reload)
          </button>
        </div>
      </div>
    );
  }
}
