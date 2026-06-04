import React from "react";
import { View } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";

interface State {
  hasError: boolean;
  message?: string;
}

// App-level error boundary — catches render crashes so users see a recovery
// screen instead of a white screen. Wire Sentry capture here when added.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    // TODO(M7): Sentry.captureException(error)
    if (__DEV__) console.error("ErrorBoundary caught:", error);
  }

  reset = () => this.setState({ hasError: false, message: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center gap-4 bg-bg px-8">
          <Text variant="h1">Something went wrong</Text>
          <Text variant="small" className="text-center text-muted">
            The app hit an unexpected error. Try again.
          </Text>
          <Button title="Try again" onPress={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}
