"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthProvider";
import { userApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast/ToastProvider";

const roles = [
  { value: "manager", label: "01. Manager" },
  { value: "store_keeper", label: "02. Store keeper" },
  { value: "production_manager", label: "03. Production Manager" },
];

export default function NewUserPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(roles[0].value);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) router.push("/signin");
  }, [isAuthenticated, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      addToast({ variant: "error", title: "Missing fields", message: "Please fill all required fields" });
      return;
    }
    setSubmitting(true);
    try {
      await userApi.create({ name, email, password, role });
      addToast({ variant: "success", title: "User added", message: `${name} (${roles.find(r=>r.value===role)?.label})` });
      router.push("/users");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-title-md font-semibold text-gray-800 dark:text-white/90">Add User</h1>
        <Link href="/users" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Back</Link>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:max-w-2xl">
        <div>
          <Label>Name</Label>
          <Input placeholder="Full name" defaultValue={name} onChange={(e: any) => setName(e.target?.value ?? "")} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" placeholder="email@example.com" defaultValue={email} onChange={(e: any) => setEmail(e.target?.value ?? "")} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" placeholder="Password" defaultValue={password} onChange={(e: any) => setPassword(e.target?.value ?? "")} />
        </div>
        <div>
          <Label>Role</Label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-11 w-full rounded-lg border bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <Link href="/users" className="rounded-lg border px-4 py-2 text-sm dark:border-gray-800">Cancel</Link>
          <Button disabled={submitting}>{submitting ? "Saving..." : "Save User"}</Button>
        </div>
      </form>
    </div>
  );
}
