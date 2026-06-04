import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetProduct, adminCreateProduct, adminUpdateProduct,
  adminAddProductImage, adminDeleteProductImage,
  type CreateProductData, type UpdateProductData,
} from "@/domain/services/admin/product";
import { adminListUsers, adminToggleUserActive, adminSetUserRole } from "@/domain/services/admin/user";
import { getStoreSettings, updateStoreSettings } from "@/domain/services/settings";
import { uploadProductImage } from "@/domain/services/storage";
import { qk } from "@/domain/services/keys";
import type { UserRole, StoreSettingsType } from "@/domain/types";

export function useAdminProduct(productId: string | null) {
  return useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => adminGetProduct(productId!),
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductData) => adminCreateProduct(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products"] }),
  });
}

export function useUpdateAdminProduct(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProductData) => adminUpdateProduct(productId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-product", productId] });
    },
  });
}

export function useUploadProductImage(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ uri, mime, isPrimary, sortOrder }: {
      uri: string; mime: string; isPrimary: boolean; sortOrder: number;
    }) => {
      const ext = mime.split("/")[1] ?? "jpg";
      const filename = `${sortOrder}-${Date.now()}.${ext}`;
      const url = await uploadProductImage(productId, uri, mime, filename);
      return adminAddProductImage(productId, url, isPrimary, sortOrder);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-product", productId] }),
  });
}

export function useDeleteProductImage(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageId: number) => adminDeleteProductImage(imageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-product", productId] }),
  });
}

export function useAdminUsers(page: number) {
  return useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => adminListUsers(page, 30),
    staleTime: 30_000,
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      adminToggleUserActive(userId, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminSetUserRole(userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useStoreSettings() {
  return useQuery({
    queryKey: qk.storeSettings(),
    queryFn: getStoreSettings,
    staleTime: 60_000,
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: number; fields: Partial<StoreSettingsType> }) =>
      updateStoreSettings(id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.storeSettings() }),
  });
}
