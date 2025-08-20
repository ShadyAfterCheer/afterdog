import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "8");
    const offset = (page - 1) * limit;

    // 查询总数
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

    // 查询分页数据 - 只选择猜测游戏需要的字段
    const { data: items, error: itemsError } = await supabase
      .from("gallery_items")
      .select("id, person_name, generated_image")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // 确保返回的数据是唯一的
    const uniqueItems = items
      ? Array.from(new Map(items.map((item) => [item.id, item])).values())
      : [];

    if (itemsError) {
      console.error("Items error:", itemsError);
      return NextResponse.json(
        { error: "Failed to get items" },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;

    return NextResponse.json({
      items: uniqueItems,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPrevPage: page > 1,
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
