// app/praticien/connexion/page.tsx
// Connexion praticien en 2 étapes : email + mot de passe, puis code TOTP (2FA obligatoire).
"use client";

import React, { useState } from "react";

export default function PraticienConnexionPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/praticien/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de la connexion");
      setTempToken(data.tempToken);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/praticien/auth/totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Code incorrect");
      window.location.href = "/praticien/dossiers";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#FCFBF6] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#0A2E5C]">Espace médecin conseil</h1>
          <p className="text-sm text-[#5B6472] mt-1">Accès sécurisé — 2FA obligatoire</p>
        </div>

        <div className="rounded-2xl border border-[#E7E3DA] bg-white p-6 shadow-sm">
          {step === 1 ? (
            <form onSubmit={submitStep1} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#16233A] mb-1.5">E-mail professionnel</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7E3DA] focus:outline-none focus:border-[#0A2E5C]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#16233A] mb-1.5">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E7E3DA] focus:outline-none focus:border-[#0A2E5C]"
                />
              </div>
              {error && <p className="text-sm text-[#CC1C29]">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#0A2E5C] text-white font-semibold hover:bg-[#00275B] transition-colors disabled:opacity-60"
              >
                {loading ? "Vérification…" : "Continuer"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitStep2} className="space-y-4">
              <p className="text-sm text-[#5B6472]">
                Saisissez le code à 6 chiffres de votre application d&apos;authentification.
              </p>
              <input
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                autoFocus
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl border border-[#E7E3DA] text-center text-2xl tracking-[0.4em] font-mono focus:outline-none focus:border-[#0A2E5C]"
              />
              {error && <p className="text-sm text-[#CC1C29]">{error}</p>}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 rounded-xl bg-[#CC1C29] text-white font-semibold hover:bg-[#E11B2A] transition-colors disabled:opacity-60"
              >
                {loading ? "Vérification…" : "Accéder aux dossiers"}
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setError(null); setCode(""); }}
                className="w-full text-sm text-[#5B6472] hover:text-[#0A2E5C]"
              >
                ← Recommencer
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
