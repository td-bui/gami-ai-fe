"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { FiEye, FiEyeOff } from "react-icons/fi";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";

// Map years of experience to proficiency level
const experienceOptions = [
  { value: "beginner", label: "Less than 1 year (Beginner)" },
  { value: "intermediate", label: "1-2 years (Intermediate)" },
  { value: "advanced", label: "3-4 years (Advanced)" },
  { value: "expert", label: "5+ years (Expert)" },
];

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    repassword: "",
    level: "", // <-- new field
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showRePassword, setShowRePassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password || !form.repassword || !form.level) {
      setError("All fields are required.");
      return;
    }
    if (form.password !== form.repassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBaseUrl}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          level: form.level, // <-- send to backend
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed.");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("username", form.username);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("level", data.level);
      
      router.push("/lesson");

    } catch (err) {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
        onSubmit={handleSubmit}
      >
        {/* Logo and App Name Header */}
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo.png"
            alt="App Logo"
            width={48}
            height={48}
            className="mb-2"
          />
          <span className="text-2xl font-bold">CodeXP</span>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="username">
            Username
          </label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lamaPurple"
            type="text"
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="email">
            Email
          </label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lamaPurple"
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-medium" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-lamaPurple"
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-lamaPurple transition-colors"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium" htmlFor="repassword">
            Confirm Password
          </label>
          <div className="relative">
            <input
              className="w-full border border-gray-300 rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-lamaPurple"
              type={showRePassword ? "text" : "password"}
              id="repassword"
              name="repassword"
              value={form.repassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              tabIndex={-1}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-lamaPurple transition-colors"
              onClick={() => setShowRePassword((v) => !v)}
              aria-label={showRePassword ? "Hide password" : "Show password"}
            >
              {showRePassword ? (
                <FiEyeOff className="h-5 w-5" />
              ) : (
                <FiEye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {/* Programming Experience Selection */}
        <div className="mb-6">
          <label className="block mb-1 font-medium" htmlFor="level">
            Years of Programming Experience
          </label>
          <select
            id="level"
            name="level"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lamaPurple"
            value={form.level}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Select your experience level
            </option>
            {experienceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}
        {loading && <Spinner />}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
        <div className="mt-4 text-center text-sm text-gray-600">
          Have an account?{" "}
          <Link
            href="/signin"
            className="text-lamaPurple hover:underline font-semibold"
          >
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}