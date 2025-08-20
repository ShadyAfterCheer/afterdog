"use client";

import Link from "next/link";
import { useAuth } from "./providers";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { supabase } from "@/lib/supabase";
import { LogOut, Upload, Home, User, Vote } from "lucide-react";
import { useEffect, useState } from "react";

export function Navbar() {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 0;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-shadow duration-200 ${
        scrolled ? "shadow-md" : "shadow-sm"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-xl">AfterShip 疯狂动物城</span>
        </Link>

        <div className="flex items-center space-x-4">
          {user && (
            <Link href="/upload">
              <Button variant="ghost" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                上传
              </Button>
            </Link>
          )}

          {loading ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <div className="flex items-center space-x-2">
              <Link href="/me">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  我的
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <a
              href="https://ai-day.aftership.dev/pages/vote"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                <Vote className="h-4 w-4 mr-2" />
                投我一票
              </Button>
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
