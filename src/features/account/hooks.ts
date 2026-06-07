import { Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/domain/services/keys";
import { getProfile, updateProfile, uploadAvatar } from "@/domain/services/profile";
import {
  getAddresses, saveAddress, updateAddress, deleteAddress, setDefaultAddress,
} from "@/domain/services/address";
import { getReviewsByProduct, createReview, deleteReview } from "@/domain/services/review";
import type { AppError } from "@/domain/errors";

export function useProfile(userId: string | null) {
  return useQuery({
    queryKey: qk.profile(userId ?? ""),
    queryFn: () => getProfile(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useUpdateProfile(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: Parameters<typeof updateProfile>[1]) => updateProfile(userId, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile(userId) }),
  });
}

export function useUploadAvatar(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uri, mime }: { uri: string; mime: string }) => {
      const url = await uploadAvatar(userId, uri, mime);
      // Persist the new URL on the profile so it survives reloads.
      await updateProfile(userId, { avatar_url: url });
      return url;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile(userId) }),
  });
}

export function useAddresses(userId: string | null) {
  return useQuery({
    queryKey: ["addresses", userId ?? ""],
    queryFn: () => getAddresses(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useSaveAddress(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (address: Parameters<typeof saveAddress>[1]) => saveAddress(userId, address),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses", userId] }),
  });
}

export function useUpdateAddress(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Parameters<typeof updateAddress>[1] }) =>
      updateAddress(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses", userId] }),
  });
}

export function useDeleteAddress(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses", userId] }),
    onError: (e) => {
      const msg = (e as AppError).message ?? "";
      if (msg.includes("restrict") || msg.includes("violates foreign key")) {
        Alert.alert("Không thể xoá", "Địa chỉ này đang được dùng cho đơn hàng.");
      } else {
        Alert.alert("Lỗi", msg || "Không thể xoá địa chỉ.");
      }
    },
  });
}

export function useSetDefaultAddress(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => setDefaultAddress(userId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["addresses", userId] }),
  });
}

export function useReviews(productId: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => getReviewsByProduct(productId),
    staleTime: 60_000,
  });
}

export function useCreateReview(userId: string, productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment: string }) =>
      createReview(productId, userId, rating, comment),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", productId] }),
  });
}

export function useDeleteReview(userId: string, productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteReview(id, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews", productId] }),
  });
}
