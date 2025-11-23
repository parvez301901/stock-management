"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { authApi } from "@/lib/api";

export default function Profile() {
  const { user, isAuthenticated, ready, logout, setUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }
    setName((user as any)?.name ?? "");
    setEmail((user as any)?.email ?? "");
    setRole((user as any)?.role ?? "");
    setAvatarPreview((user as any)?.avatar_url ?? null);
  }, [ready, isAuthenticated, user, router]);

  const onAvatarChange = (f: File | null) => {
    setAvatar(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };

  const onClearAvatar = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      fd.append('avatar_clear', 'true');
      const updated = await authApi.updateMe(fd);
      setUser(updated);
      setAvatar(null);
      setAvatarPreview(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      if (name) fd.append('name', name);
      if (avatar) fd.append('avatar', avatar);
      const updated = await authApi.updateMe(fd);
      setUser(updated);
    } catch (e: any) {
      // noop or show a toast if you have a provider here
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!ready) return null;
  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={avatarPreview || "/images/user/user-01.png"} className="h-16 w-16 rounded-full object-cover" alt="avatar" />
              <div>
                <input type="file" accept="image/*" onChange={(e) => onAvatarChange(e.target.files?.[0] || null)} />
                <div className="text-xs text-gray-500 dark:text-gray-400">Upload a new avatar</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Name</div>
              <input
                className="mt-1 h-11 w-full rounded-lg border bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <input
                disabled
                className="mt-1 h-11 w-full rounded-lg border bg-gray-50 px-3 text-sm dark:border-gray-800 dark:bg-gray-800/40 dark:text-white/70"
                value={email}
                readOnly
              />
            </div>
            <div>
              <div className="text-xs text-gray-500">Role</div>
              <input
                disabled
                className="mt-1 h-11 w-full rounded-lg border bg-gray-50 px-3 text-sm dark:border-gray-800 dark:bg-gray-800/40 dark:text-white/70"
                value={role}
                readOnly
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 dark:border-gray-800">
              <div className="text-sm text-gray-700 dark:text-gray-300">Account</div>
              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-lg border px-3 py-2 text-sm dark:border-gray-800"
                  onClick={() => router.refresh()}
                >
                  Refresh
                </button>
                <button
                  className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  className="rounded-lg border px-3 py-2 text-sm dark:border-gray-800"
                  onClick={onClearAvatar}
                  disabled={saving}
                >
                  Clear Avatar
                </button>
                <button
                  className="rounded-lg bg-error-500 px-3 py-2 text-sm font-medium text-white hover:bg-error-600"
                  onClick={logout}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
