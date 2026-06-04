import React, { useEffect } from "react";
import { View, ScrollView, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfile, useUpdateProfile, useUploadAvatar } from "./hooks";
import { useAuth } from "@/features/auth/AuthContext";
import { profileSchema, type ProfileInput } from "./schemas";
import { Text } from "@/ui/Text";
import { Button } from "@/ui/Button";
import type { AppError } from "@/domain/errors";

export function EditProfileScreen() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id ?? null);
  const updateProfile = useUpdateProfile(user?.id ?? "");
  const uploadAvatar = useUploadAvatar(user?.id ?? "");

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { username: "" },
  });

  useEffect(() => {
    if (profile) reset({ username: profile.username ?? "" });
  }, [profile, reset]);

  async function pickAvatar() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Allow photo access to change your avatar."); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    try {
      await uploadAvatar.mutateAsync({ uri: asset.uri, mime: asset.mimeType ?? "image/jpeg" });
    } catch (e) {
      Alert.alert("Upload failed", (e as AppError).message);
    }
  }

  async function onSubmit(data: ProfileInput) {
    try {
      await updateProfile.mutateAsync({ username: data.username });
      router.back();
    } catch (e) {
      Alert.alert("Error", (e as AppError).message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-5 px-4 pt-4 pb-6" keyboardShouldPersistTaps="handled">
        <Text variant="h2">Edit profile</Text>

        {/* Avatar */}
        <View className="items-center gap-3">
          <Pressable onPress={pickAvatar} accessibilityRole="button" accessibilityLabel="Change avatar">
            {profile?.avatar_url ? (
              <Image
                source={profile.avatar_url}
                style={{ width: 96, height: 96, borderRadius: 48 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-full bg-surface">
                <Text variant="h1">{(profile?.username ?? user?.email ?? "?")[0]?.toUpperCase()}</Text>
              </View>
            )}
          </Pressable>
          <Button
            title={uploadAvatar.isPending ? "Uploading..." : "Change photo"}
            variant="ghost"
            loading={uploadAvatar.isPending}
            onPress={pickAvatar}
          />
        </View>

        {/* Username */}
        <View className="gap-1">
          <Text variant="small" className="font-semibold">Display name</Text>
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="h-12 rounded-md border border-border bg-surface px-4 text-text text-sm"
                placeholder="Your name"
                placeholderTextColor="#A1A1AA"
                value={value}
                onChangeText={onChange}
                accessibilityLabel="Display name"
              />
            )}
          />
          {errors.username && <Text variant="caption" className="text-danger">{errors.username.message}</Text>}
        </View>

        <View className="gap-1">
          <Text variant="small" className="font-semibold">Email</Text>
          <View className="h-12 justify-center rounded-md border border-border bg-surface px-4 opacity-60">
            <Text variant="small">{user?.email}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-bg px-4 py-3">
        <Button title="Save changes" loading={updateProfile.isPending} onPress={handleSubmit(onSubmit)} />
      </View>
    </SafeAreaView>
  );
}
