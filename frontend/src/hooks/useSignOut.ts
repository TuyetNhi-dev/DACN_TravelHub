"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ApiError } from "@/lib/api-client";

/** Signs out, then goes home. `onDone` lets a menu close itself first. */
export function useSignOut(onDone?: () => void) {
  const { logout } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    setBusy(true);
    setError("");
    try {
      await logout();
      onDone?.();
      router.push("/");
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Không thể đăng xuất.");
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, signOut };
}
