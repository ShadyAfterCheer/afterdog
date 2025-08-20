"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, User } from "lucide-react";
import { useAuth } from "@/components/providers";
import toast from "react-hot-toast";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [personName, setPersonName] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("文件大小不能超过 5MB");
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !personName.trim() || !user) {
      toast.error("请填写完整信息");
      return;
    }

    setIsUploading(true);

    try {
      // 转换文件为 base64
      const base64Data = await convertFileToBase64(selectedFile);

      // 调用 API 创建记录
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personName: personName.trim(),
          generatedImage: base64Data,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "上传失败");
      }

      toast.success("上传成功！");
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("上传失败，请重试");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setPreviewUrl("");
      setPersonName("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>上传照片</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 文件上传 */}
          <div className="space-y-4">
            <Label htmlFor="file-upload">选择照片</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {previewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={previewUrl}
                      alt="预览"
                      className="w-32 h-32 object-cover rounded-lg mx-auto"
                    />
                    <p className="text-sm text-muted-foreground">
                      点击重新选择
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-sm text-muted-foreground">
                      点击选择照片或拖拽到此处
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* 用户信息 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <Label htmlFor="person-name">这是谁的照片？</Label>
            </div>
            <Input
              id="person-name"
              placeholder="请输入姓名"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !personName.trim() || isUploading}
            >
              {isUploading ? "上传中..." : "上传"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
