"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/admin");
  }

  return (
    <main className="wrap narrow" style={{ paddingBlock: "6rem" }}>
      <p className="kicker">// layer8 admin</p>
      <h1 className="font-display" style={{ fontSize: "2rem", marginTop: "0.6rem" }}>sign in</h1>

      <form onSubmit={handleSubmit} style={{ marginTop: "2rem" }}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{error}</p>}
        <button type="submit" className="btn btn-solid" disabled={loading}>
          {loading ? "> checking..." : "> sign_in"}
        </button>
      </form>
    </main>
  );
}
