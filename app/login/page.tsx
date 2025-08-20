"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chrome } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (error) {
      toast.error("Google 登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">欢迎来到 AfterDog</CardTitle>
          <CardDescription>
            使用 Google 账户登录，开始生成你的写实卡通风宠物头像
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">A</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                写实卡通风宠物头像生成器
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                上传照片，生成可爱的宠物头像，让同事猜猜你是谁！
              </p>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 text-base"
            size="lg"
          >
            <Chrome className="h-5 w-5 mr-3" />
            {loading ? "登录中..." : "使用 Google 账户登录"}
          </Button>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              登录即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
