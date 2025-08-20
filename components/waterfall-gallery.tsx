"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GalleryItem } from "@/types";
import { WifiOff } from "lucide-react";
import Masonry from "react-masonry-css";

import { GuessModal } from "./guess-modal";
import { GalleryCard } from "./gallery-card"; // 引入新的卡片组件

interface GalleryItemWithDetails extends GalleryItem {}

interface PaginationInfo {
  hasNextPage: boolean;
  [key: string]: any;
}

export function WaterfallGallery() {
  const [items, setItems] = useState<GalleryItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [fetchError, setFetchError] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] =
    useState<GalleryItemWithDetails | null>(null);
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [allNames, setAllNames] = useState<string[]>([]);

  const loadingRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef<boolean>(false);
  const hasNextPageRef = useRef<boolean>(false);
  const isInitialLoadRef = useRef<boolean>(true);

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

  const fetchGalleryItems = useCallback(
    async (offset: number, limit: number) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      const isAppending = offset > 0;
      if (isAppending) setLoadingMore(true);

      try {
        const response = await fetch(
          `/api/gallery?offset=${offset}&limit=${limit}`
        );
        if (!response.ok) throw new Error("Failed to fetch gallery items");
        const data = await response.json();

        if (isAppending) {
          setItems((prev) => [...prev, ...(data.items || [])]);
        } else {
          setItems(data.items || []);
        }

        setPagination(data.pagination);
        hasNextPageRef.current = data.pagination?.hasNextPage || false;
      } catch (error) {
        console.error("Error fetching gallery items:", error);
        if (!isAppending) setFetchError(true);
      } finally {
        if (isAppending) setLoadingMore(false);
        else setLoading(false);
        isLoadingRef.current = false;
      }
    },
    []
  );

  useEffect(() => {
    isInitialLoadRef.current = true;
    setLoading(true);
    setFetchError(false);
    const initData = async () => {
      await fetchGalleryItems(0, 16);
      await fetchAllNames();
      isInitialLoadRef.current = false;
    };
    initData();
  }, [fetchGalleryItems, fetchAllNames]);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        !isInitialLoadRef.current &&
        hasNextPageRef.current &&
        !isLoadingRef.current
      ) {
        const offset = items.length;
        const limit = 8;
        fetchGalleryItems(offset, limit);
      }
    },
    [fetchGalleryItems, items.length]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "800px", // 提前 800px 开始加载，优化体验
    });
    const loaderElement = loadingRef.current;
    if (loaderElement && pagination?.hasNextPage) {
      observer.observe(loaderElement);
    }
    return () => observer.disconnect();
  }, [handleIntersection, pagination?.hasNextPage]);

  const handleItemClick = (item: GalleryItemWithDetails) => {
    setSelectedItem(item);
    setShowGuessModal(true);
  };

  const breakpointColumnsObj = {
    default: 6,
    1536: 6, // 2xl
    1280: 5, // xl
    1024: 4, // lg
    768: 3, // md
    640: 2, // sm
    500: 1,
  };

  if (loading) {
    const skeletonHeights = [
      280, 320, 260, 350, 300, 290, 340, 270, 310, 330, 285, 295,
    ];
    return (
      <div className="w-full max-w-none">
        {/* 使用 Masonry 渲染骨架屏，使其结构与真实内容一致 */}
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="my-masonry-grid flex" // 注意这里没有 gap，因为 gap 由 column 的 padding 模拟
          columnClassName="my-masonry-grid_column"
        >
          {skeletonHeights.map((height, i) => (
            <div
              key={i}
              className="break-inside-avoid mb-4 animate-pulse rounded-lg border bg-card shadow-sm overflow-hidden"
            >
              <div
                className="bg-muted w-full"
                style={{ height: `${height}px` }}
              />
            </div>
          ))}
        </Masonry>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center text-center">
        <WifiOff className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">加载失败</h3>
        <p className="text-muted-foreground">
          无法连接到服务器，请检查你的网络并稍后重试。
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid flex"
        columnClassName="my-masonry-grid_column"
      >
        {items.map((item) => (
          <div key={item.id} className="mb-4">
            <GalleryCard item={item} onItemClick={handleItemClick} />
          </div>
        ))}
      </Masonry>

      {pagination?.hasNextPage && (
        <div ref={loadingRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-muted-foreground">加载中...</span>
            </div>
          )}
        </div>
      )}

      {!pagination?.hasNextPage && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>已经到底啦 ~</p>
        </div>
      )}

      {items.length === 0 && !loading && !fetchError && (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium mb-2">这里空空如也</h3>
          <p className="text-muted-foreground">暂时还没有任何图片。</p>
        </div>
      )}

      <GuessModal
        open={showGuessModal}
        onClose={() => setShowGuessModal(false)}
        item={selectedItem}
        allNames={allNames}
      />
    </div>
  );
}
