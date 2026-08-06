import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TxFeedback, buttonClass, inputClass, type Tx } from "@/components/ui-bits";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — MedFund" },
      {
        name: "description",
        content:
          "Sign in to open a MedFund escrow, upload milestone evidence, or verify treatment as a hospital or NGO.",
      },
      { property: "og:title", content: "Sign In — MedFund" },
      {
        property: "og:description",
        content: "Access your MedFund patient or verifier account.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tx, setTx] = useState<Tx>({ state: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTx({ state: "pending", message: "Working…" });
    const res =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin },
          });

    if (res.error) {
      setTx({ state: "error", message: res.error.message });
      return;
    }
    if (mode === "signup" && !res.data.session) {
      setTx({ state: "success", message: "Check your email to confirm your account" });
      return;
    }
    setTx({ state: "success", message: "Signed in" });
    navigate({ to: "/fundraisers" });
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl">
        {mode === "signin" ? "Sign in" : "Create an account"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Patients and verifiers use the same login.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          className={inputClass}
          type="email"
          placeholder="you@example.ph"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className={inputClass}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className={`${buttonClass} w-full`}>
          {mode === "signin" ? "Sign in" : "Sign up"}
        </button>
        <TxFeedback tx={tx} />
      </form>
      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
