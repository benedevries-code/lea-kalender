"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FAMILY_MEMBERS } from "@/lib/types";

export default function SelectUser() {
  const router = useRouter();
  const [selected, setSelected] = useState("");

  const handleSelect = () => {
    if (!selected) return;
    window.localStorage.setItem("bruno_user", selected);
    window.sessionStorage.setItem("bruno_just_selected", "true");
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100 max-w-md w-full">
        <h1 className="text-2xl font-extrabold text-primary mb-6 text-center">Wer bist du?</h1>
        <select
          className="w-full px-4 py-3 border border-primary rounded-xl mb-6 focus:ring-2 focus:ring-primary focus:border-transparent"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">Bitte Namen auswählen</option>
          {FAMILY_MEMBERS.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
          <option value="Lea">Lea</option>
        </select>
        <button
          className="w-full py-3 bg-primary text-white font-semibold rounded-xl shadow hover:bg-primary/90 transition-all disabled:opacity-50"
          disabled={!selected}
          onClick={handleSelect}
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
