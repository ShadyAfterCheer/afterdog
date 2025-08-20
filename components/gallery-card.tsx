"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { GalleryItem } from "@/types"; // 确保引入你的类型定义

interface GalleryCardProps {
  item: GalleryItem;
  onItemClick: (item: GalleryItem) => void;
}

export function GalleryCard({ item, onItemClick }: GalleryCardProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      // 使用 transition 实现平滑的渐入效果
      className={`transition-opacity duration-500 ease-in-out ${
        isLoaded ? "opacity-100" : "opacity-0"
      }`}
    >
      <Card
        className="group cursor-pointer hover:shadow-lg"
        onClick={() => onItemClick(item)}
      >
        <div className="relative overflow-hidden">
          <Image
            src={item.generated_image}
            alt={item.person_name || "Gallery image"}
            width={400} // 这里可以给一个基准宽度
            height={600} // 这里给一个预估的平均高度，Next.js会计算宽高比
            className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
            // Next.js 的 Image 组件 onLoad 事件
            onLoad={() => setIsLoaded(true)}
            unoptimized={item.generated_image?.startsWith("data:")}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          />
        </div>
      </Card>
    </div>
  );
}
