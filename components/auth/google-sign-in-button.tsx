"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string>
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  mode = "signin"
}: {
  mode?: "signin" | "link";
}) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !buttonRef.current || !window.google?.accounts?.id) {
      return;
    }
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ credential, mode })
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          toast.error(data.error || "Unable to continue with Google.");
          return;
        }
        toast.success(
          mode === "link"
            ? "Google account linked."
            : "Signed in with Google successfully."
        );
        router.push("/dashboard");
        router.refresh();
      }
    });
    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: mode === "link" ? "continue_with" : "signin_with",
      shape: "pill",
      width: "320"
    });
  }, [clientId, mode, router]);

  if (!clientId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Google Sign-In becomes available when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured.
      </div>
    );
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div className="min-h-11" ref={buttonRef} />
    </>
  );
}
