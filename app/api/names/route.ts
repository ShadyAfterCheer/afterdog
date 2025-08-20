import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 获取所有公开的用户名称
    const { data: names, error } = await supabase
      .from("gallery_items")
      .select("person_name")
      .eq("is_public", true)
      .not("person_name", "is", null);

    if (error) {
      console.error("Error fetching names:", error);
      return NextResponse.json(
        { error: "Failed to fetch names" },
        { status: 500 }
      );
    }

    // 去重并排序
    const uniqueNames = Array.from(
      new Set(names.map((item) => item.person_name))
    ).sort();

    return NextResponse.json({
      names: uniqueNames,
      count: uniqueNames.length,
    });
  } catch (error) {
    console.error("Error in names API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
