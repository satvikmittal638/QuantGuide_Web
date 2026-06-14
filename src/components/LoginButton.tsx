"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function LoginButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse" />;
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-4">
        {session.user.image && (
          <img src={session.user.image} alt="Avatar" className="w-10 h-10 rounded-full border border-gray-700" />
        )}
        <div className="hidden sm:flex sm:flex-col">
          <span className="text-sm font-medium text-gray-200">{session.user.name}</span>
          <span className="text-xs text-gray-500">{session.user.email}</span>
        </div>
        <button 
          onClick={() => signOut()}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2 px-4 rounded-lg transition-colors border border-gray-700 hover:border-gray-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={() => signIn("google")}
      className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-6 rounded-lg transition-colors border border-blue-500 hover:border-blue-400 shadow-lg shadow-blue-500/20"
    >
      Sign in with Google
    </button>
  );
}
