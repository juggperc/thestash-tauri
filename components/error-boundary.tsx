"use client"

import { Component, ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center">
            <h1 className="font-mono text-2xl font-bold mb-4 lowercase">error</h1>
            <p className="font-mono text-muted-foreground lowercase mb-4">
              something went wrong. please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="font-mono border-2 border-border px-4 py-2 hover:bg-accent transition-colors lowercase"
            >
              reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

