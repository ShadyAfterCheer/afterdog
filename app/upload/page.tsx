"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Upload, ImageIcon, Cat, Dog, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers";
import toast from "react-hot-toast";
import Image from "next/image";

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [animalType, setAnimalType] = useState<"cat" | "dog">("cat");
  const [keepAccessories, setKeepAccessories] = useState(true);
  const [detectedAccessories, setDetectedAccessories] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("文件大小不能超过 5MB");
        return;
      }
      setUploadedFile(file);
      detectAccessories(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    multiple: false,
  });

  const detectAccessories = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/detect-accessories", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDetectedAccessories(data.accessories || []);
      }
    } catch (error) {
      console.error("Error detecting accessories:", error);
    }
  };

  const handleUpload = async () => {
    if (!uploadedFile || !user) return;

    setGenerating(true);
    setUploadProgress(0);

    try {
      // 上传原图到 Supabase Storage
      const fileExt = uploadedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(fileName, uploadedFile);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(30);

      // 获取上传文件的 URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("uploads").getPublicUrl(fileName);

      // 创建上传记录
      const { data: uploadRecord, error: recordError } = await supabase
        .from("uploads")
        .insert({
          user_id: user.id,
          original_url: publicUrl,
          file_size: uploadedFile.size,
          file_name: uploadedFile.name,
        })
        .select()
        .single();

      if (recordError) {
        throw recordError;
      }

      setUploadProgress(60);

      // 开始生成
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uploadId: uploadRecord.id,
          animalType,
          keepAccessories,
          detectedAccessories,
        }),
      });

      if (!response.ok) {
        throw new Error("生成失败");
      }

      const { generationId } = await response.json();
      setUploadProgress(100);

      toast.success("生成任务已提交，请稍候查看结果！");
      router.push(`/item/${generationId}`);
    } catch (error) {
      console.error("Error:", error);
      toast.error("上传失败，请重试");
    } finally {
      setGenerating(false);
      setUploadProgress(0);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>请先登录</CardTitle>
            <CardDescription>登录后才能上传照片生成宠物头像</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              去登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-4">生成宠物头像</h1>
            <p className="text-muted-foreground text-lg">
              上传人像照片，AI 将为你生成可爱的写实卡通风宠物头像
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>上传照片</span>
              </CardTitle>
              <CardDescription>
                支持 JPG、PNG、WebP 格式，文件大小不超过 5MB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input {...getInputProps()} />
                {uploadedFile ? (
                  <div className="space-y-4">
                    <div className="relative w-32 h-32 mx-auto">
                      <Image
                        src={URL.createObjectURL(uploadedFile)}
                        alt="预览"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile.name}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive ? "释放文件" : "拖拽文件到此处"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        或点击选择文件
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {uploadedFile && (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">
                        选择动物类型
                      </Label>
                      <div className="flex space-x-4 mt-2">
                        <Button
                          variant={animalType === "cat" ? "default" : "outline"}
                          onClick={() => setAnimalType("cat")}
                          className="flex items-center space-x-2"
                        >
                          <Cat className="h-4 w-4" />
                          <span>猫咪</span>
                        </Button>
                        <Button
                          variant={animalType === "dog" ? "default" : "outline"}
                          onClick={() => setAnimalType("dog")}
                          className="flex items-center space-x-2"
                        >
                          <Dog className="h-4 w-4" />
                          <span>狗狗</span>
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">
                          继承配饰
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          保留原图中的眼镜等配饰
                        </p>
                      </div>
                      <Switch
                        checked={keepAccessories}
                        onCheckedChange={setKeepAccessories}
                      />
                    </div>

                    {detectedAccessories.length > 0 && (
                      <div>
                        <Label className="text-base font-medium">
                          检测到的配饰
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {detectedAccessories.map((accessory) => (
                            <span
                              key={accessory}
                              className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                            >
                              {accessory}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {generating && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">生成进度</span>
                        <span className="text-sm text-muted-foreground">
                          {uploadProgress}%
                        </span>
                      </div>
                      <Progress value={uploadProgress} />
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={generating}
                    className="w-full"
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {generating ? "生成中..." : "开始生成"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
