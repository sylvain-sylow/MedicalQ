// app/(assure)/connexion/page.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { API_URL } from "@/lib/api/config";

export default function ConnexionPage() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Formater le téléphone si nécessaire (doit commencer par + et chiffres)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith("+")) {
      // Si l'utilisateur saisit sans le +, on suppose la France par défaut (+33)
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+33" + formattedPhone.slice(1);
      } else {
        formattedPhone = "+" + formattedPhone;
      }
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setPhone(formattedPhone);
      setStep("otp");
      setTimer(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Veuillez saisir le code complet de 6 chiffres.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: fullOtp }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Code incorrect");
      }

      // Rediriger vers l'espace dossier
      window.location.href = "/dossier";
    } catch (err: any) {
      setError(err.message);
      // Réinitialiser le code en cas d'erreur
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    // Focus sur la case suivante
    if (val && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFBF6] px-6">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl border border-stone-200/60 shadow-xl shadow-stone-100/50"
      >
        <div className="text-center mb-8">
          <span className="text-[#CC1C29] font-bold text-xs uppercase tracking-widest bg-red-50 px-3 py-1 rounded-full">
            Espace Sécurisé
          </span>
          <h1 className="text-2xl font-bold text-[#0A2E5C] mt-4">
            {step === "phone" ? "Connexion assurée" : "Vérification OTP"}
          </h1>
          <p className="text-stone-500 text-sm mt-2">
            {step === "phone"
              ? "Saisissez votre numéro de téléphone pour recevoir votre code d'accès par SMS."
              : `Nous avons envoyé un code de 6 chiffres au ${phone}.`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-900 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Numéro de téléphone
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+33 6 12 34 56 78"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-4 py-3.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-850 font-semibold focus:outline-none focus:border-red-650 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#0A2E5C] hover:bg-[#00275B] text-white font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Recevoir le code SMS"
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider text-center mb-4">
                Code de sécurité
              </label>
              <div className="flex justify-between gap-2 max-w-xs mx-auto">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-12 h-14 bg-stone-50 border-2 border-stone-200 rounded-xl text-center font-bold text-xl text-stone-850 focus:outline-none focus:border-red-650 transition-colors"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#CC1C29] hover:bg-[#E11B2A] text-white font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                "Valider et se connecter"
              )}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-stone-500 hover:text-stone-700 text-xs font-medium underline"
              >
                Modifier le numéro de téléphone
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
