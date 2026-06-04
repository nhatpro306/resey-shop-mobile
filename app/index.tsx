import { Redirect } from "expo-router";

// Entry point. Auth-gating wired in M2; for now land on the storefront tabs.
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
