import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// 强制动态渲染
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "8");

    // --- 关键改动 (1): 优先使用 offset ---
    // 直接读取 'offset' 参数。如果不存在，则通过 'page' 计算，实现向后兼容。
    const offsetParam = searchParams.get("offset");
    const page = parseInt(searchParams.get("page") || "1");
    const offset = offsetParam ? parseInt(offsetParam) : (page - 1) * limit;

    // 查询总数 (逻辑不变)
    const { count, error: countError } = await supabase
      .from("gallery_items")
      .select("*", { count: "exact", head: true })
      .eq("is_public", true);

    if (countError) {
      console.error("Count error:", countError);
      return NextResponse.json(
        { error: "Failed to get count" },
        { status: 500 }
      );
    }

    // 查询分页数据 - 使用正确的 offset
    const { data: items, error: itemsError } = await supabase
      .from("gallery_items")
      .select("id, person_name, generated_image")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1); // 这里现在会使用前端直接传来的 offset

    if (itemsError) {
      console.error("Items error:", itemsError);
      return NextResponse.json(
        { error: "Failed to get items" },
        { status: 500 }
      );
    }

    // 确保返回的数据是唯一的 (这段逻辑可以保留作为安全措施)
    const uniqueItems = items
      ? Array.from(new Map(items.map((item) => [item.id, item])).values())
      : [];

    // --- 关键改动 (2): 修正 hasNextPage 的计算方式 ---
    // 旧的计算方式 `page < totalPages` 在纯 offset 模式下不可靠。
    // 新的计算方式更精确：检查当前请求的终点是否小于总数。
    const hasNextPage = offset + uniqueItems.length < (count || 0);
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      items: uniqueItems,
      pagination: {
        page, // 仍然可以返回 page 用于调试
        limit,
        total: count || 0,
        totalPages,
        hasNextPage, // 使用了更可靠的计算结果
        hasPrevPage: offset > 0,
      },
    });
  } catch (error) {
    console.error("Error in gallery API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
