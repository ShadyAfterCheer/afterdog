"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Upload, Trophy, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers";
import { GalleryItem, Generation, UserStats } from "@/types";
import { formatDate } from "@/lib/utils";
import Image from "next/image";

interface GalleryItemWithDetails extends GalleryItem {
  generation: Generation;
}

export default function MePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [myItems, setMyItems] = useState<GalleryItemWithDetails[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      fetchUserStats();
      fetchMyItems();
    }
  }, [user, loading]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // 获取用户统计数据
      const { data: uploads } = await supabase
        .from("uploads")
        .select("id")
        .eq("user_id", user.id);

      const { data: generations } = await supabase
        .from("generations")
        .select("id")
        .eq("user_id", user.id);

      setStats({
        total_uploads: uploads?.length || 0,
        total_generations: generations?.length || 0,
        total_likes: 0,
        correct_guesses: 0,
        total_guesses: 0,
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchMyItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching my items:", error);
        return;
      }

      setMyItems(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* 用户信息 */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-lg">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user.email}</CardTitle>
                  <CardDescription>
                    加入时间：{formatDate(user.created_at)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 统计数据 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Upload className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.total_uploads}
                      </p>
                      <p className="text-sm text-muted-foreground">上传次数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.total_generations}
                      </p>
                      <p className="text-sm text-muted-foreground">生成次数</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.total_likes}</p>
                      <p className="text-sm text-muted-foreground">获得点赞</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.total_guesses > 0
                          ? Math.round(
                              (stats.correct_guesses / stats.total_guesses) *
                                100
                            )
                          : 0}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground">
                        猜测正确率
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 内容标签页 */}
          <Tabs defaultValue="my-items" className="space-y-4">
            <TabsList>
              <TabsTrigger value="my-items">我的作品</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
            </TabsList>

            <TabsContent value="my-items" className="space-y-4">
              {myItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      还没有生成过宠物头像
                    </p>
                    <Button onClick={() => router.push("/upload")}>
                      开始生成
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myItems.map((item) => (
                    <Card
                      key={item.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <Image
                          src={item.generated_image}
                          alt={item.person_name || "宠物头像"}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          unoptimized={item.generated_image?.startsWith(
                            "data:"
                          )}
                        />
                      </div>
                      <CardHeader className="pb-3">
                        <h3 className="font-semibold text-lg">
                          {item.person_name}
                        </h3>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>账户设置</CardTitle>
                  <CardDescription>管理你的账户信息和偏好设置</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">邮箱</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">账户创建时间</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => supabase.auth.signOut()}
                  >
                    退出登录
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
