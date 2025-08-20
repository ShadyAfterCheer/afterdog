"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, XCircle, Trophy, Clock } from "lucide-react";
import { useAuth } from "@/components/providers";
import { GalleryItem } from "@/types";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GalleryItemWithDetails extends GalleryItem {}

interface GuessModalProps {
  open: boolean;
  onClose: () => void;
  item: GalleryItemWithDetails | null;
  allNames?: string[];
}

export function GuessModal({
  open,
  onClose,
  item,
  allNames = [],
}: GuessModalProps) {
  const { user } = useAuth();
  const [selectedName, setSelectedName] = useState<string>("");
  const [isGuessing, setIsGuessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [hasGuessed, setHasGuessed] = useState(false);
  const [userGuesses, setUserGuesses] = useState<string[]>([]);

  // 生成5个随机名字选项
  const [nameOptions, setNameOptions] = useState<string[]>([]);
  const [showVoteDialog, setShowVoteDialog] = useState(false);

  // 检查是否已经显示过投票弹窗
  const hasShownVoteDialog = () => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("hasShownVoteDialog") === "true";
  };

  // 标记投票弹窗已显示
  const markVoteDialogShown = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem("hasShownVoteDialog", "true");
  };

  useEffect(() => {
    if (item && open) {
      // 重置状态
      setSelectedName("");
      setShowResult(false);
      setIsCorrect(false);
      setHasGuessed(false);
      setUserGuesses([]);

      // 检查用户是否已经猜测过
      checkUserGuesses();

      // 生成名字选项
      generateNameOptions();
    }
  }, [item, open]);

  // 添加调试信息
  useEffect(() => {
    console.log("GuessModal state:", {
      item: item?.person_name,
      open,
      selectedName,
      nameOptions,
      attemptsLeft,
      showResult,
      isCorrect,
    });
  }, [
    item,
    open,
    selectedName,
    nameOptions,
    attemptsLeft,
    showResult,
    isCorrect,
  ]);

  const checkUserGuesses = async () => {
    // 简化版：每次都重置为3次机会
    setAttemptsLeft(3);
    setHasGuessed(false);
    setUserGuesses([]);
  };

  const generateNameOptions = async () => {
    if (!item) return;

    try {
      // 使用预加载的名称列表
      const otherNames = allNames.filter((name) => name !== item.person_name);

      // 生成选项：4个其他用户的名字 + 1个正确答案
      const wrongOptions = otherNames
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      // 如果错误选项不够，用默认选项补充
      while (wrongOptions.length < 4) {
        wrongOptions.push(`未知用户${wrongOptions.length + 1}`);
      }

      const options = [...wrongOptions, item.person_name].sort(
        () => Math.random() - 0.5
      );
      setNameOptions(options);
      console.log("Generated options:", options);
    } catch (error) {
      console.error("Error generating options:", error);
      // 如果出错，使用默认选项
      const defaultOptions = ["张三", "李四", "王五", "赵六", item.person_name];
      setNameOptions(defaultOptions.sort(() => Math.random() - 0.5));
    }
  };

  const handleGuess = async () => {
    console.log("handleGuess called:", {
      selectedName,
      item: item?.person_name,
    });

    if (!item || !selectedName || isGuessing) return;

    setIsGuessing(true);

    try {
      const correctAnswer = item.person_name || "未知用户";
      const isCorrectGuess = selectedName === correctAnswer;

      console.log("Guess result:", {
        selectedName,
        correctAnswer,
        isCorrectGuess,
      });

      setIsCorrect(isCorrectGuess);
      setShowResult(true);
      setAttemptsLeft((prev) => prev - 1);
      setUserGuesses((prev) => [...prev, selectedName]);

      if (isCorrectGuess) {
        toast.success("恭喜！猜对了！");
        // 只在第一次猜对时显示投票确认框
        if (!hasShownVoteDialog()) {
          setShowVoteDialog(true);
        }
      } else {
        toast.error(`猜错了，还有 ${attemptsLeft - 1} 次机会`);
      }
    } catch (error) {
      console.error("Error in handleGuess:", error);
      toast.error("猜测失败");
    } finally {
      setIsGuessing(false);
    }
  };

  const handleClose = () => {
    setSelectedName("");
    setShowResult(false);
    setIsCorrect(false);
    setHasGuessed(false);
    setUserGuesses([]);
    onClose();
  };

  if (!item) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>猜猜这是谁？</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 图片展示 */}
            <div className="flex justify-center">
              <div className="relative w-56 h-56 overflow-hidden rounded-lg border-2 border-gray-200 shadow-md">
                <Image
                  src={item.generated_image}
                  alt="宠物头像"
                  fill
                  className="object-cover"
                  unoptimized={item.generated_image?.startsWith("data:")}
                />
              </div>
            </div>

            {/* 猜测游戏 */}
            {attemptsLeft > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">选择正确答案：</h4>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm text-muted-foreground">
                      还有 {attemptsLeft} 次机会
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {nameOptions.map((name) => (
                    <Button
                      key={name}
                      variant={selectedName === name ? "default" : "outline"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log("Option clicked:", name);
                        setSelectedName(name);
                      }}
                      disabled={isGuessing}
                      className="h-12 text-sm"
                    >
                      {name}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Submit button clicked");
                    handleGuess();
                  }}
                  disabled={!selectedName || isGuessing}
                  className="w-full"
                >
                  {isGuessing ? "提交中..." : "提交答案"}
                </Button>
              </div>
            )}

            {/* 猜测结果 */}
            {showResult && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    isCorrect
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                      {isCorrect ? "恭喜猜对了！" : "猜错了，再试试吧！"}
                    </span>
                  </div>
                  {!isCorrect && attemptsLeft > 0 && (
                    <p className="text-sm mt-1">还有 {attemptsLeft} 次机会</p>
                  )}
                </div>
              </div>
            )}

            {/* 已猜测状态 */}
            {hasGuessed && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">你已经参与过猜测了</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  你的猜测记录：{userGuesses.join(", ")}
                </div>
              </div>
            )}

            {/* 机会用完 */}
            {attemptsLeft === 0 && !isCorrect && (
              <div className="p-4 rounded-lg bg-yellow-50 text-yellow-800 border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">机会用完了</span>
                </div>
                <p className="text-sm mt-1">
                  正确答案是：<strong>{item.person_name}</strong>
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 投票确认框 */}
      <AlertDialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🎉 恭喜你猜对了！</AlertDialogTitle>
            <AlertDialogDescription>
              如果你喜欢这个项目的话，就投我一票吧！
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowVoteDialog(false);
                markVoteDialogShown(); // 标记已显示，即使用户取消也记录
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowVoteDialog(false);
                markVoteDialogShown(); // 标记已显示
                window.open(
                  "https://ai-day.aftership.dev/pages/vote",
                  "_blank"
                );
              }}
            >
              去投票
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
