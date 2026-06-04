import { useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { registerForPushNotifications } from "@/lib/notifications";

// Registers for push once a user is signed in. Persisting the token to a
// `push_tokens` table is a backend follow-up (M8); for now it registers + logs.
export function PushRegistration() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session?.user) return;
    registerForPushNotifications().then((token) => {
      if (token && __DEV__) console.log("[push] expo token:", token);
      // TODO(M8): upsert token into a push_tokens table keyed by user id.
    });
  }, [session?.user]);

  return null;
}
