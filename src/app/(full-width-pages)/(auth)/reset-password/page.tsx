"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { authApi } from "@/lib/api";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = params.get("token") || "";
  const emailFromUrl = params.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const disabled = useMemo(() => !email || !token || !password || password !== passwordConfirmation, [email, token, password, passwordConfirmation]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword({ email, token, password, password_confirmation: passwordConfirmation });
      addToast({ variant: "success", title: "Password reset", message: "Your password has been reset. Please sign in." });
      router.replace("/signin");
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to reset password";
      addToast({ variant: "error", title: "Error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w/full max-w-md mx-auto py-10">
        <div className="mb-6">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Reset Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Paste the token from your email and set a new password.</p>
        </div>
        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <div>
              <Label>Token <span className="text-error-500">*</span></Label>
              <Input placeholder="Reset token" defaultValue={token} onChange={(e: any) => setToken(e.target?.value ?? "")} />
            </div>
            <div>
              <Label>Email <span className="text-error-500">*</span></Label>
              <Input type="email" placeholder="you@example.com" defaultValue={email} onChange={(e: any) => setEmail(e.target?.value ?? "")} />
            </div>
            <div>
              <Label>New Password <span className="text-error-500">*</span></Label>
              <Input type="password" placeholder="New password" defaultValue={password} onChange={(e: any) => setPassword(e.target?.value ?? "")} />
            </div>
            <div>
              <Label>Confirm Password <span className="text-error-500">*</span></Label>
              <Input type="password" placeholder="Confirm password" defaultValue={passwordConfirmation} onChange={(e: any) => setPasswordConfirmation(e.target?.value ?? "")} />
            </div>
            <div>
              <Button className="w-full" size="sm" disabled={loading || disabled}>{loading ? "Resetting..." : "Reset Password"}</Button>
            </div>
          </div>
        </form>
        <div className="mt-6 text-sm flex gap-4">
          <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Back to Sign In</Link>
          <Link href="/forgot-password" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Request new link</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
