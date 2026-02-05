"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FAMILY_MEMBERS } from "@/lib/types";

export default function SelectUser() {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"select" | "password">("select");

  const checkUser = async () => {
    if (!selected) return;
    setLoading(true);
    setError("");
    
    try {
      const res = await fetch(`/api/auth?name=${encodeURIComponent(selected)}`);
      const data = await res.json();
      
      setIsFirstTime(!data.hasPassword);
      setStep("password");
    } catch {
      setError("Fehler beim Pruefen des Benutzers");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      setError("Bitte Passwort eingeben");
      return;
    }

    if (isFirstTime && password !== confirmPassword) {
      setError("Passwoerter stimmen nicht ueberein");
      return;
    }

    if (isFirstTime && password.length < 4) {
      setError("Passwort muss mindestens 4 Zeichen haben");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selected,
          password,
          isFirstTime
        })
      });

      const data = await res.json();

      if (data.success) {
        window.sessionStorage.setItem("bruno_user", selected);
        window.sessionStorage.setItem("bruno_just_selected", "true");
        window.location.href = "/";
      } else {
        setError(data.error || "Login fehlgeschlagen");
      }
    } catch {
      setError("Fehler beim Login");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStep("select");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setIsFirstTime(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700 max-w-md w-full">
        <h1 className="text-2xl font-extrabold text-primary mb-6 text-center">
          {step === "select" ? "Wer bist du?" : isFirstTime ? "Passwort festlegen" : "Anmelden"}
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        {step === "select" ? (
          <>
            <select
              className="w-full px-4 py-3 border border-primary rounded-xl mb-6 focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 dark:text-white"
              value={selected}
              onChange={e => setSelected(e.target.value)}
            >
              <option value="">Bitte Namen auswaehlen</option>
              {FAMILY_MEMBERS.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value="Lea">Lea</option>
            </select>
            <button
              className="w-full py-3 bg-primary text-white font-semibold rounded-xl shadow hover:bg-primary/90 transition-all disabled:opacity-50"
              disabled={!selected || loading}
              onClick={checkUser}
            >
              {loading ? "Pruefe..." : "Weiter"}
            </button>
          </>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-4">
              Hallo <span className="font-semibold text-primary">{selected}</span>!
              {isFirstTime 
                ? " Bitte lege jetzt dein persoenliches Passwort fest."
                : " Bitte gib dein Passwort ein."}
            </p>

            <input
              type="password"
              placeholder="Passwort"
              className="w-full px-4 py-3 border border-primary rounded-xl mb-4 focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isFirstTime && handleLogin()}
            />

            {isFirstTime && (
              <input
                type="password"
                placeholder="Passwort bestaetigen"
                className="w-full px-4 py-3 border border-primary rounded-xl mb-4 focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
              />
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white font-semibold rounded-xl shadow hover:bg-gray-300 dark:hover:bg-gray-500 transition-all"
                onClick={goBack}
              >
                Zurueck
              </button>
              <button
                className="flex-1 py-3 bg-primary text-white font-semibold rounded-xl shadow hover:bg-primary/90 transition-all disabled:opacity-50"
                disabled={!password || loading}
                onClick={handleLogin}
              >
                {loading ? "..." : isFirstTime ? "Passwort setzen" : "Anmelden"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
