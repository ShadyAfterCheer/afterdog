"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

export function EnvWarning() {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // 检查是否缺少环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseKey ||
      supabaseUrl.includes("placeholder") ||
      supabaseKey.includes("placeholder")
    ) {
      setShowWarning(true);
    }
  }, []);

  if (!showWarning) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle className="text-yellow-800">环境变量未配置</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWarning(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-yellow-700 text-sm mb-3">
            项目需要配置 Supabase 环境变量才能正常运行。请按照以下步骤设置：
          </p>
          <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
            <li>
              创建{" "}
              <code className="bg-yellow-100 px-1 rounded">.env.local</code>{" "}
              文件
            </li>
            <li>
              复制{" "}
              <code className="bg-yellow-100 px-1 rounded">env.example</code>{" "}
              中的内容
            </li>
            <li>填入你的 Supabase 项目配置</li>
            <li>重启开发服务器</li>
          </ol>
          <p className="text-yellow-600 text-xs mt-2">
            详细设置说明请查看{" "}
            <code className="bg-yellow-100 px-1 rounded">SETUP.md</code> 文件
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

