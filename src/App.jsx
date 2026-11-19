import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import AuthCard from "./components/AuthCard";
import DashboardView from "./components/DashboardView";
import { api } from "./services/api";

export default function App() {
  const [user, setUser] = useState(() => api.getUser());

  useEffect(() => {
    // Listen for global 401 unauthorized events
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener("vaultauth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("vaultauth:unauthorized", handleUnauthorized);
  }, []);

  const handleAuthenticated = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0A0D14] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Cybersecurity ambient glow & grid backdrop */}
      <div className="fixed inset-0 bg-cyber-grid opacity-60 pointer-events-none"></div>

      {/* Top Navbar */}
      <Navbar user={user} onLogout={handleLogout} />

      {/* Main Viewport Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10">
        {user ? (
          <DashboardView user={user} onLogout={handleLogout} />
        ) : (
          <AuthCard onAuthenticated={handleAuthenticated} />
        )}
      </main>

      {/* Corporate Enterprise Footer */}
      <footer className="border-t border-slate-200/80 dark:border-[#1A2232] bg-white/40 dark:bg-[#0A0D14]/40 py-4 px-4 text-center text-xs text-slate-400 dark:text-slate-500 relative z-10 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>Polaris School of Technology • Track PST_PD_154</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="hover:text-brand-500 cursor-pointer">Security Whitepaper</span>
            <span>•</span>
            <span className="hover:text-brand-500 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="text-brand-500 font-semibold">VaultAuth SSO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
