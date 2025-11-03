"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { isConnected, address, disconnect, connect, isConnecting } =
    useWallet();
  const [showMenu, setShowMenu] = React.useState(false);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".user-menu-container")) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMenu]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/30 border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-2xl font-bold neon-text neon-cyan"
            >
              BTC<span className="neon-pink">WARFARE</span>
            </motion.div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg transition-all ${
                pathname === "/"
                  ? "bg-neon-cyan/20 text-neon-cyan font-medium"
                  : "text-gray-300 hover:text-neon-cyan"
              }`}
            >
              Home
            </Link>
            <Link
              href="/how-it-works"
              className={`px-3 py-2 rounded-lg transition-all ${
                pathname === "/how-it-works"
                  ? "bg-neon-cyan/20 text-neon-cyan font-medium"
                  : "text-gray-300 hover:text-neon-cyan"
              }`}
            >
              How It Works
            </Link>
            {isConnected && (
              <Link
                href="/account"
                className={`px-3 py-2 rounded-lg transition-all ${
                  pathname === "/account"
                    ? "bg-neon-cyan/20 text-neon-cyan font-medium"
                    : "text-gray-300 hover:text-neon-cyan"
                }`}
              >
                Account
              </Link>
            )}
            <Link
              href="/support"
              className={`px-3 py-2 rounded-lg transition-all ${
                pathname === "/support"
                  ? "bg-neon-cyan/20 text-neon-cyan font-medium"
                  : "text-gray-300 hover:text-neon-cyan"
              }`}
            >
              Support
            </Link>
            <Link
              href="/terms"
              className={`px-3 py-2 rounded-lg transition-all ${
                pathname === "/terms"
                  ? "bg-neon-cyan/20 text-neon-cyan font-medium"
                  : "text-gray-300 hover:text-neon-cyan"
              }`}
            >
              Terms
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Play Button - Only visible when connected */}
            {isConnected && (
              <Link href="/battle">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    pathname === "/battle"
                      ? "bg-neon-cyan/30 text-neon-cyan"
                      : "bg-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/30"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  <span className="text-sm font-medium">Play</span>
                </motion.button>
              </Link>
            )}
            {isConnected && address ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="glass-strong rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-all"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-200">
                    {formatAddress(address)}
                  </span>
                </button>

                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 glass-strong rounded-lg p-2 border border-white/10"
                  >
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-all"
                      onClick={() => setShowMenu(false)}
                    >
                      Account
                    </Link>
                    <button
                      onClick={() => {
                        disconnect();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      Disconnect
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <button
                onClick={() => connect()}
                disabled={isConnecting}
                className="px-4 py-2 bg-neon-cyan text-black font-bold rounded-lg hover:bg-opacity-90 transition-all glow-cyan disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
