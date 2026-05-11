"use client";

import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Plane, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode: "popup";
  }): void;
  renderButton(
    element: HTMLElement,
    options: {
      theme: "outline";
      size: "large";
      shape: "pill";
      text: "continue_with";
      width: number;
    },
  ): void;
  cancel(): void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

type LoginClientProps = {
  googleClientId?: string;
};

export function LoginClient({ googleClientId }: LoginClientProps) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    googleClientId ? null : "Google sign-in is not configured yet.",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isGisReady, setIsGisReady] = useState(false);

  const onGoogleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      const idToken = response.credential;

      if (!idToken) {
        setErrorMessage("Google authentication did not return a valid token.");
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const apiResponse = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        });
        const payload = (await apiResponse.json()) as {
          status: "success" | "error";
          data?: { message?: string };
        };

        if (!apiResponse.ok || payload.status !== "success") {
          throw new Error(payload.data?.message ?? "Sign-in failed. Please try again.");
        }

        router.replace("/customers");
        router.refresh();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Sign-in failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  const initializeGoogleSignIn = useCallback(() => {
    if (!googleClientId) {
      setErrorMessage("Google sign-in is not configured yet.");
      return;
    }

    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity || !buttonRef.current) {
      setErrorMessage("Google Sign-In is currently unavailable.");
      return;
    }

    googleIdentity.initialize({
      client_id: googleClientId,
      callback: onGoogleCredential,
      ux_mode: "popup",
    });
    buttonRef.current.innerHTML = "";
    googleIdentity.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 320,
    });
    setIsGisReady(true);
    setErrorMessage(null);
  }, [googleClientId, onGoogleCredential]);

  return (
    <main className="min-h-dvh bg-[#09111f] text-white">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initializeGoogleSignIn}
        onError={() => setErrorMessage("Failed to load Google Sign-In.")}
      />

      <div className="mx-auto grid min-h-dvh w-full max-w-6xl gap-10 px-5 py-8 md:px-8 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-16">
        <section className="flex flex-col justify-center">
          <Image
            src="/brand/travox-logo-light.svg"
            width={220}
            height={55}
            priority
            alt="Travox"
            className="h-auto w-44 sm:w-56"
          />

          <div className="mt-12 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-50/10 px-3 py-1 text-xs font-medium text-cyan-100">
              <Plane className="h-4 w-4" />
              Travel agency command center
            </div>

            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Secure access for every booking, payment, and report.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Continue with Google to enter your Travox workspace with permission-aware access and server-managed sessions.
            </p>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <FeatureTile
              icon={<ShieldCheck className="h-5 w-5 text-emerald-200" />}
              title="Permission-aware"
              text="Owner and admin access is resolved server-side before protected screens render."
            />
            <FeatureTile
              icon={<Lock className="h-5 w-5 text-sky-200" />}
              title="Cookie sessions"
              text="Tokens are issued through httpOnly cookies instead of browser token storage."
            />
          </div>
        </section>

        <section className="flex items-center justify-center lg:justify-end">
          <div className="w-full max-w-md rounded-lg border border-white/15 bg-white/10 p-6 shadow-2xl shadow-black/30 backdrop-blur sm:p-8">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-300/15 p-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Welcome back</h2>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Use your approved Google account to continue.
                </p>
              </div>
            </div>

            <div className="mt-7 rounded-lg border border-white/15 bg-[#0d1728] p-4">
              {errorMessage ? (
                <div className="mb-4 rounded-lg border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  {errorMessage}
                </div>
              ) : null}

              <div className="relative min-h-11">
                <div
                  ref={buttonRef}
                  className={`flex justify-center transition-opacity ${isLoading ? "opacity-0" : "opacity-100"}`}
                />

                {isLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </div>
                ) : null}
              </div>

              {!isGisReady && !isLoading ? (
                <p className="mt-3 text-center text-xs text-slate-300">
                  Preparing secure Google sign-in...
                </p>
              ) : null}
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-slate-300">
              Access is limited to approved Travox workspace users.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function FeatureTile({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="mb-3 inline-flex rounded-lg bg-white/10 p-2">{icon}</div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}
