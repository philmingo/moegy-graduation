"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertCircle, RefreshCcw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import config from "@/lib/theme-config"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console (in production, you'd send this to an error tracking service)
    console.error("❌ [ERROR BOUNDARY] Uncaught error:", error)
    console.error("❌ [ERROR BOUNDARY] Error info:", errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className={`min-h-screen ${config.theme.background} flex items-center justify-center p-4`}>
          <div className="max-w-2xl w-full">
            <div className="relative">
              <div
                className={`absolute inset-0 ${config.theme.status.warning.gradient}/20 ${config.ui.borderRadius.medium} ${config.ui.blur.medium}`}
              />
              <div
                className={`relative ${config.theme.glass.light} ${config.ui.borderRadius.medium} p-8 md:p-12`}
              >
                {/* Error Icon */}
                <div
                  className={`w-20 h-20 ${config.theme.status.warning.gradient} ${config.ui.borderRadius.large} flex items-center justify-center mx-auto mb-6`}
                >
                  <AlertCircle className="h-10 w-10 text-white" />
                </div>

                {/* Error Message */}
                <h1
                  className={`${config.ui.typography.sizes["3xl"]} ${config.ui.typography.weights.bold} ${config.theme.text.primary} text-center mb-4`}
                >
                  Oops! Something went wrong
                </h1>

                <p className={`${config.theme.text.secondary} text-center mb-6 text-lg`}>
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>

                {/* Error Details (Development only) */}
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-300 font-mono text-sm mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary className="text-red-300 text-sm cursor-pointer hover:text-red-200">
                          Component Stack
                        </summary>
                        <pre className="text-red-300 text-xs mt-2 overflow-x-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={this.handleReset}
                    className={`${config.theme.primary.gradient} ${config.theme.primary.gradientHover} text-white px-6 py-3 ${config.ui.borderRadius.small} transition-all duration-300`}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>

                  <Button
                    onClick={() => (window.location.href = "/")}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10 px-6 py-3"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                {/* Help Text */}
                <p className="text-white/60 text-center mt-6 text-sm">
                  If this problem persists, please contact support or refresh the page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simple Error Fallback Component
 * Can be used as a custom fallback for specific error boundaries
 */
export function SimpleErrorFallback({ error, resetError }: { error?: Error; resetError?: () => void }) {
  return (
    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-4">
        <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-red-300 font-semibold mb-2">Error Loading Content</h3>
          <p className="text-red-200 text-sm mb-4">
            {error?.message || "An unexpected error occurred while loading this content."}
          </p>
          {resetError && (
            <Button
              onClick={resetError}
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <RefreshCcw className="h-3 w-3 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
