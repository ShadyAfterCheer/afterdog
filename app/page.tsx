"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { WaterfallGallery } from "@/components/waterfall-gallery";
import { UploadModal } from "@/components/upload-modal";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    // 可以在这里添加刷新逻辑
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="min-h-screen">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <WaterfallGallery />
        </div>
      </main>

      {/* 上传模态框 */}
      <UploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
