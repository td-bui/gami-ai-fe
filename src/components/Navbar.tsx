"use client";
import { useEffect, useState, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

const Navbar = () => {
  const [username, setUsername] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUsername = localStorage.getItem("username");
      if (storedUsername) setUsername(storedUsername);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (refreshToken) {
      try {
        await fetch(`${apiBaseUrl}/api/auth/logout?refreshToken=${refreshToken}`, {
          method: "POST",
        });
      } catch (err) {
        console.log("Logout failed:", err);
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("username");
    window.location.href = "/sign-in";
  };

  return (
    <div className="flex items-center justify-between p-4 w-full h-[10%] bg-[#749BC2] text-white shadow">
      {/* Logo/Link on the left */}
      <Link
        href="/lesson"
        className="flex items-center gap-2 h-8"
      >
        <Image src="/logo.png" alt="logo" width={32} height={32} />
        <span className="hidden lg:block font-bold">CodeXP</span>
      </Link>
      {/* NAVIGATION OPTIONS */}
      <div className="flex items-center gap-6 h-8">
        <Link
            href="/lesson"
            className="px-3 py-1 rounded-full bg-white text-[#749BC2] border-2 border-[#749BC2] font-semibold text-sm hover:bg-blue-100 hover:text-blue-700 transition"
          >
            Python
          </Link>
          <Link
            href="/problems"
            className="px-3 py-1 rounded-full bg-white text-[#749BC2] border-2 border-[#749BC2] font-semibold text-sm hover:bg-blue-100 hover:text-blue-700 transition"
          >
            Practice
        </Link>
        {/* ICONS AND USER on the right */}
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="" width={20} height={20} />
        </div>
        <div className="bg-white rounded-full w-7 h-7 flex items-center justify-center cursor-pointer relative">
          <Image src="/announcement.png" alt="" width={20} height={20} />
          <div className="absolute -top-3 -right-3 w-5 h-5 flex items-center justify-center bg-purple-500 text-white rounded-full text-xs">
            1
          </div>
        </div>
        {/* Profile + Username */}
        <div
          ref={profileRef}
          className="flex flex-row items-center gap-2 bg-white px-2 py-1 rounded-full cursor-pointer relative"
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          <Image src="/profile.png" alt="" width={22} height={22} className="rounded-full" />
          <span className="text-xs font-bold text-gray-700">{username || "Guest"}</span>
          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-10 right-0 bg-white text-gray-700 rounded shadow-lg py-2 w-36 z-50">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setShowDropdown(false);
                  // Navigate to user profile page if you have one
                  window.location.href = "/profile";
                }}
              >
                User profile
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
        <UserButton />
      </div>
    </div>
  );
};

export default Navbar;
