const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// 从环境变量读取配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ 请确保设置了 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量"
  );
  process.exit(1);
}

// 创建 Supabase 客户端
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupDatabase() {
  try {
    console.log("🚀 开始设置数据库...");

    // 读取 SQL 脚本
    const sqlPath = path.join(__dirname, "../database/setup.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    console.log("📝 执行 SQL 脚本...");

    // 执行 SQL 脚本
    const { error } = await supabase.rpc("exec_sql", { sql: sqlContent });

    if (error) {
      // 如果 exec_sql 函数不存在，我们分段执行
      console.log("⚠️  分段执行 SQL 脚本...");
      await executeSqlInParts(sqlContent);
    } else {
      console.log("✅ SQL 脚本执行成功！");
    }

    console.log("🎉 数据库设置完成！");
  } catch (error) {
    console.error("❌ 数据库设置失败:", error.message);
    process.exit(1);
  }
}

async function executeSqlInParts(sqlContent) {
  // 分割 SQL 语句
  const statements = sqlContent
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (statement.trim()) {
      try {
        console.log(`执行语句 ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });
        if (error) {
          console.log(`⚠️  语句 ${i + 1} 执行失败，跳过:`, error.message);
        }
      } catch (err) {
        console.log(`⚠️  语句 ${i + 1} 执行失败，跳过:`, err.message);
      }
    }
  }
}

// 运行设置
setupDatabase();

