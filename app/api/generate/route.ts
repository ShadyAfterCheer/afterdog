import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 验证用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { personName, generatedImage } = await request.json();

    // 直接创建 gallery_item 记录
    const { data: galleryItem, error: insertError } = await supabase
      .from("gallery_items")
      .insert({
        person_name: personName,
        generated_image: generatedImage,
        is_public: true,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create gallery item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      itemId: galleryItem.id,
      message: "Gallery item created successfully",
    });
  } catch (error) {
    console.error("Error in generate API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
