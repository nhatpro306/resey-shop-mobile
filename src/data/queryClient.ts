import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // catalog-ish default; override per-query for cart/orders
      gcTime: 24 * 60 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Warm-start cache; stale-while-revalidate. Swap AsyncStorage -> MMKV later for speed.
export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "resey-query-cache",
});
