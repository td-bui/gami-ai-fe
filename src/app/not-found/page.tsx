"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-4xl font-bold text-gray-700 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-500 mb-8">Sorry, the page you are looking for does not exist.</p>
      <Link href="/lesson" className="px-6 py-2 bg-blue-600 text-white rounded font-semibold">
        Go Home
      </Link>
    </div>
  );
}