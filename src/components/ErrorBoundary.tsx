import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    // Limpar cache do localStorage relacionado ao app
    try {
      // Preservar tokens de autenticação
      const authToken = localStorage.getItem("sb-bqoghpzvluixuddaerwk-auth-token");
      
      // Recarregar a página
      window.location.reload();
    } catch (e) {
      window.location.reload();
    }
  };

  handleClearAndReload = () => {
    try {
      // Limpar todo o localStorage exceto auth
      const authToken = localStorage.getItem("sb-bqoghpzvluixuddaerwk-auth-token");
      localStorage.clear();
      if (authToken) {
        localStorage.setItem("sb-bqoghpzvluixuddaerwk-auth-token", authToken);
      }
      window.location.reload();
    } catch (e) {
      localStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="w-12 h-12 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Ops! Algo deu errado
              </h1>
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado ao carregar o sistema. 
                Isso pode ser causado por dados em cache desatualizados.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={this.handleReload}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button 
                onClick={this.handleClearAndReload}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Limpar Cache e Recarregar
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left mt-6 p-4 bg-muted rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Detalhes técnicos (dev only)
                </summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40 text-destructive">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
