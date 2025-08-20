require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// 初始化 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importGalleryData() {
  const generatedDir = path.join(__dirname, "../generated");

  try {
    // 读取所有 JSON 文件
    const files = fs
      .readdirSync(generatedDir)
      .filter((file) => file.endsWith(".json"))
      .sort();

    console.log(`找到 ${files.length} 个文件需要处理...`);

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        console.log(`处理文件: ${file}`);

        // 读取文件内容
        const filePath = path.join(generatedDir, file);
        const rawData = fs.readFileSync(filePath, "utf8");
        const data = JSON.parse(rawData);

        // 提取数据
        const username = data.username;
        const originalAvatar = data.original_avatar; // base64
        const generatedAvatar = data.generated_avatar; // base64
        const animalType = data.animal_type;
        const createdAt = data.created_at;
        const status = data.status;

        // 只处理成功的生成
        if (status !== "success") {
          console.log(`  跳过 ${username} - 状态: ${status}`);
          continue;
        }

        // 转换为 data URI 格式
        const originalImageDataUri = `data:image/jpeg;base64,${originalAvatar}`;
        const generatedImageDataUri = `data:image/png;base64,${generatedAvatar}`;

        // 生成标签
        const tags = [animalType === "cat" ? "猫系" : "狗系", "AI生成"];

        // 检查用户是否已存在
        const { data: existingItem, error: checkError } = await supabase
          .from("gallery_items")
          .select("id")
          .eq("person_name", username)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          throw checkError;
        }

        if (existingItem) {
          console.log(`  ${username} 已存在，跳过...`);
          continue;
        }

        // 插入到数据库 (使用系统默认用户ID)
        const { data: insertedData, error: insertError } = await supabase
          .from("gallery_items")
          .insert({
            person_name: username,
            original_image: originalImageDataUri,
            generated_image: generatedImageDataUri,
            tags: tags,
            is_public: true,
            created_at: createdAt,
            user_id: "11111111-1111-1111-1111-111111111111", // 系统默认用户
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        console.log(`  ✅ ${username} 导入成功 (ID: ${insertedData.id})`);
        successCount++;
      } catch (error) {
        console.error(`  ❌ 处理 ${file} 时出错:`, error.message);
        errorCount++;
      }
    }

    console.log("\n导入完成!");
    console.log(`成功: ${successCount} 个`);
    console.log(`失败: ${errorCount} 个`);

    // 查询最终数据
    const { data: finalData, error: finalError } = await supabase
      .from("gallery_items")
      .select("id, person_name, tags, created_at")
      .order("created_at", { ascending: false });

    if (finalError) {
      throw finalError;
    }

    console.log("\n当前数据库中的所有记录:");
    finalData.forEach((item) => {
      console.log(
        `- ${item.person_name} (${item.tags.join(", ")}) - ${item.created_at}`
      );
    });
  } catch (error) {
    console.error("❌ 导入过程出错:", error);
  }
}

// 运行导入
importGalleryData();
