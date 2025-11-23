"use client";

import React, { useState } from "react";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Link from "next/link";
import { useToast } from "@/components/ui/toast/ToastProvider";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const { addToast } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      const msg = res?.message || "If the email exists, a reset link has been sent.";
      setMessage(msg);
      addToast({ variant: "success", title: "Email sent", message: msg });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Failed to send reset link";
      addToast({ variant: "error", title: "Error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w/full max-w-md mx-auto py-10">
        <div className="mb-6">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">Forgot Password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email to receive a password reset link.</p>
        </div>
        {message && (
          <div className="mb-4 text-sm text-success-700 bg-success-50 border border-success-200 rounded px-3 py-2">{message}</div>
        )}
        <form onSubmit={onSubmit}>
          <div className="space-y-6">
            <div>
              <Label>Email <span className="text-error-500">*</span></Label>
              <Input type="email" placeholder="you@example.com" defaultValue={email} onChange={(e: any) => setEmail(e.target?.value ?? "")} />
            </div>
            <div>
              <Button className="w-full" size="sm" disabled={loading}>{loading ? "Sending..." : "Send Reset Link"}</Button>
            </div>
          </div>
        </form>
        <div className="mt-6 text-sm">
          <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
