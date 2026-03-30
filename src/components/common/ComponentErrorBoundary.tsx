import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  crashId?: string;
}

export class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const crashId = Math.random().toString(36).slice(2, 9).toUpperCase();
    return { hasError: true, error, crashId };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component error:', error, errorInfo);

    const crashId = this.state.crashId ?? Math.random().toString(36).slice(2, 9).toUpperCase();
    fetch('/api/data/crash-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        crashId,
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        boundary: this.props.componentName || 'component',
      }),
    }).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 rounded-lg border border-border bg-muted/30 text-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive/60" />
          <p className="text-sm text-muted-foreground">
            {this.props.fallbackMessage || '此模块加载出错'}
          </p>
          {this.state.crashId && (
            <p className="text-xs text-muted-foreground/40 font-mono">
              错误ID: {this.state.crashId}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => this.setState({ hasError: false, error: undefined, crashId: undefined })}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            重试
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
