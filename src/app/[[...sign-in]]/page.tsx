"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Spinner from "@/components/Spinner";

const LoginPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBaseUrl}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Sign in failed");
        setLoading(false);
        return;
      }

      const data = await res.json();
      // Store token and username in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("username", username);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("level", data.level);
      router.push("/lesson");
    } catch (err) {
      setError("Network error");
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-lamaSkyLight">
      <form
        onSubmit={handleSubmit}
        className="bg-white px-8 py-20 rounded-lg shadow-2xl flex flex-col gap-4 min-w-[400px] max-w-full"
      >
        <div className="flex flex-col items-center mb-4">
          <h1 className="text-2xl font-bold flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="" width={52} height={52} />
            <span>CodeXP</span>
          </h1>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Username</label>
          <input
            type="text"
            required
            className="p-2 rounded-md ring-1 ring-gray-300 w-80 text-base"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Password</label>
          <input
            type="password"
            required
            className="p-2 rounded-md ring-1 ring-gray-300 w-80 text-base"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}
        {loading && <Spinner />}
        
        <button
          type="submit"
          className="bg-blue-500 text-white font-bold my-3 rounded-md w-80 text-sm p-[10px]"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <div className="text-xs text-gray-500 mb-2 text-center mt-1">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-blue-500 hover:underline font-semibold">
            Sign Up
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
