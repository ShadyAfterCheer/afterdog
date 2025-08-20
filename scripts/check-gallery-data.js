require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkGalleryData() {
  try {
    // 查询所有记录
    const { data, error } = await supabase
      .from("gallery_items")
      .select("id, person_name, generated_image, original_image, tags")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`数据库中共有 ${data.length} 条记录:`);
    console.log("");

    data.forEach((item) => {
      const generatedIsBase64 = item.generated_image?.startsWith("data:");
      const originalIsBase64 = item.original_image?.startsWith("data:");

      console.log(`${item.person_name}:`);
      console.log(`  ID: ${item.id}`);
      console.log(`  标签: ${item.tags.join(", ")}`);
      console.log(`  生成图片: ${generatedIsBase64 ? "Base64 ✅" : "URL ❌"}`);
      console.log(`  原图片: ${originalIsBase64 ? "Base64 ✅" : "URL ❌"}`);
      console.log("");
    });

    // 统计
    const base64Count = data.filter(
      (item) =>
        item.generated_image?.startsWith("data:") &&
        item.original_image?.startsWith("data:")
    ).length;

    const urlCount = data.length - base64Count;

    console.log(`Base64 格式: ${base64Count} 条`);
    console.log(`URL 格式: ${urlCount} 条`);
  } catch (error) {
    console.error("❌ 检查数据时出错:", error);
  }
}

checkGalleryData();
