import { Component, type ReactNode } from "react";
import { t } from "../i18n";

// A crash shows a message instead of a blank iframe in the Verse8 shell.
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="screen">
          <p>{t("문제가 생겼어요. 새로고침해 주세요.")}</p>
          <small>{this.state.error.message}</small>
        </div>
      );
    }
    return this.props.children;
  }
}
