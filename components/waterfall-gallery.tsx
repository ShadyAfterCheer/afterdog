"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { GalleryItem } from "@/types";
import { GuessModal } from "./guess-modal";
import { UploadModal } from "./upload-modal";
import Image from "next/image";
import toast from "react-hot-toast";

interface GalleryItemWithDetails extends GalleryItem {}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function WaterfallGallery() {
  const [items, setItems] = useState<GalleryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedItem, setSelectedItem] =
    useState<GalleryItemWithDetails | null>(null);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [allNames, setAllNames] = useState<string[]>([]);

  // 滚动加载相关
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const currentPageRef = useRef<number>(1);

  // 获取所有用户名称
  const fetchAllNames = useCallback(async () => {
    try {
      const response = await fetch("/api/names");
      const data = await response.json();

      if (response.ok) {
        setAllNames(data.names || []);
      }
    } catch (error) {
      console.error("Error fetching names:", error);
    }
  }, []);

  // 获取图片数据
  const fetchGalleryItems = useCallback(
    async (page: number = 1, append: boolean = false) => {
      try {
        // 防止重复请求同一页
        if (append && pagination?.page === page) {
          console.log("跳过重复请求:", page);
          return;
        }

        // 首屏拉取16条，后续每页8条
        const limit = page === 1 ? 16 : 8;
        const response = await fetch(
          `/api/gallery?page=${page}&limit=${limit}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch gallery items");
        }

        if (append) {
          // 防止重复添加相同的数据
          setItems((prev) => {
            const newItems = data.items || [];
            const existingIds = new Set(
              prev.map((item: GalleryItemWithDetails) => item.id)
            );
            const uniqueNewItems = newItems.filter(
              (item: GalleryItemWithDetails) => !existingIds.has(item.id)
            );
            console.log(`第${page}页加载了${uniqueNewItems.length}条新数据`);
            return [...prev, ...uniqueNewItems];
          });
        } else {
          setItems(data.items);
          console.log(`初始加载了${data.items?.length || 0}条数据`);
        }

        setPagination(data.pagination);
        // 更新当前页码引用
        currentPageRef.current = page;
      } catch (error) {
        console.error("Error fetching gallery items:", error);
        toast.error("加载图片失败");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pagination?.page]
  );

  // 初始加载
  useEffect(() => {
    fetchGalleryItems(1, false);
    fetchAllNames();
  }, [fetchGalleryItems, fetchAllNames]);

  // 滚动加载设置
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const now = Date.now();
        // 添加防抖，确保两次请求之间至少间隔1秒
        if (
          entry.isIntersecting &&
          pagination?.hasNextPage &&
          !loadingMore &&
          now - lastRequestTimeRef.current > 1000
        ) {
          const nextPage = currentPageRef.current + 1;
          console.log(`准备加载第${nextPage}页`);
          lastRequestTimeRef.current = now;
          setLoadingMore(true);
          fetchGalleryItems(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [pagination?.hasNextPage, loadingMore, fetchGalleryItems]);

  const handleItemClick = (item: GalleryItemWithDetails) => {
    console.log("Item clicked:", {
      id: item.id,
      person_name: item.person_name,
      generated_image: item.generated_image,
    });

    // 简化版：直接显示猜测游戏
    setSelectedItem(item);
    setShowGuessModal(true);
  };

  const handleUploadSuccess = () => {
    // 重新加载第一页数据和用户名称
    fetchGalleryItems(1, false);
    fetchAllNames();
  };

  if (loading) {
    // 创建不同高度的skeleton来模拟真实的瀑布流
    const skeletonHeights = [
      280, 320, 260, 350, 300, 290, 340, 270, 310, 330, 285, 295, 315, 275, 325,
      305, 295, 335, 265, 345,
    ];

    return (
      <div className="w-full max-w-none">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 w-full max-w-none">
          {skeletonHeights.map((height, i) => (
            <div
              key={i}
              className="break-inside-avoid mb-4 animate-pulse rounded-lg border bg-card shadow-sm overflow-hidden"
            >
              <div
                className="bg-muted w-full h-full"
                style={{
                  height: `${height}px`,
                  minHeight: "250px",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* 瀑布流布局 */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-4 w-full max-w-none">
        {items.map((item) => (
          <Card
            key={item.id}
            className="break-inside-avoid mb-4 group cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={() => handleItemClick(item)}
          >
            <div className="relative overflow-hidden">
              <Image
                src={item.generated_image}
                alt={`${item.person_name}的宠物头像`}
                width={400}
                height={400}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized={item.generated_image?.startsWith("data:")}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              />

              {/* 悬停操作栏 */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="flex space-x-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/90 text-black hover:bg-white"
                  >
                    猜猜是谁
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 加载更多指示器 */}
      {pagination?.hasNextPage && (
        <div ref={loadingRef} className="flex justify-center py-8">
          {loadingMore ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">加载中...</span>
            </div>
          ) : (
            <div className="h-6"></div> // 占位符，用于触发滚动加载
          )}
        </div>
      )}

      {/* 没有更多数据提示 */}
      {!pagination?.hasNextPage && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>已经到底啦 ~</p>
        </div>
      )}

      {/* 空状态 */}
      {items.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">还没有照片</h3>
          <p className="text-muted-foreground mb-4">
            上传第一张照片开始你的宠物头像之旅吧！
          </p>
          <Button onClick={() => setShowUploadModal(true)}>上传照片</Button>
        </div>
      )}

      {/* 猜测模态框 */}
      <GuessModal
        open={showGuessModal}
        onClose={() => setShowGuessModal(false)}
        item={selectedItem}
        allNames={allNames}
      />

      {/* 上传模态框 */}
      <UploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
