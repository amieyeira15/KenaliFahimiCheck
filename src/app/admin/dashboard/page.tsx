
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      if (!supabase) {
        router.replace("/admin");
        return;
      }

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.replace("/admin");
        return;
      }

      setEmail(data.user.email || "");
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  async function logout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.replace("/admin");
  }

  if (loading) {
    return <main className="wrap">Sedang memuatkan dashboard...</main>;
  }

  return (
    <main className="wrap">
      <a className="brand" href="/">
        RUMAHKU <span>CHECK</span>
      </a>

      <div className="panel" style={{ marginTop: 30 }}>
        <h1>Admin Dashboard</h1>
        <p className="muted">
          Selamat datang, {email}
        </p>

        <h2>Pengurusan RumahKu Check</h2>
        <p>
          Anda berjaya masuk ke kawasan pentadbir sistem.
        </p>

        <button className="btn" onClick={logout}>
          Log keluar
        </button>
      </div>
    </main>
  );
}
