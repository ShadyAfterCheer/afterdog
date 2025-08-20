#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 环境变量未设置");
  console.log("请确保 .env.local 文件中包含：");
  console.log("NEXT_PUBLIC_SUPABASE_URL=你的_SUPABASE_URL");
  console.log("SUPABASE_SERVICE_ROLE_KEY=你的_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupGoogleAuth() {
  console.log("🔐 开始设置 Google 登录...\n");

  try {
    // 1. 检查当前认证配置
    console.log("📋 检查当前认证配置...");
    const { data: authConfig, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ 无法获取认证配置:", authError.message);
      return;
    }

    console.log("✅ 认证服务连接正常");

    // 2. 显示设置指南
    console.log("\n📖 Google 登录设置指南：\n");
    console.log("1️⃣ 创建 Google Cloud 项目：");
    console.log("   - 访问: https://console.cloud.google.com/");
    console.log("   - 创建新项目或选择现有项目");
    console.log("   - 启用 Google+ API\n");

    console.log("2️⃣ 配置 OAuth 2.0 凭据：");
    console.log("   - 导航到: API 和服务 → 凭据");
    console.log("   - 点击: 创建凭据 → OAuth 2.0 客户端 ID");
    console.log("   - 应用类型: Web 应用");
    console.log("   - 授权重定向 URI:");
    console.log(`      ${supabaseUrl}/auth/v1/callback\n`);

    console.log("3️⃣ 授权域名配置：");
    console.log("   - 添加以下授权域名：");
    console.log(`      ${supabaseUrl.replace("https://", "")}`);
    console.log("      localhost\n");

    console.log("4️⃣ 在 Supabase 中配置：");
    console.log("   - 访问: https://supabase.com/dashboard");
    console.log("   - 选择你的项目");
    console.log("   - 导航到: Authentication → Providers");
    console.log("   - 找到 Google 并点击启用");
    console.log(
      "   - 填入从 Google Cloud Console 获取的 Client ID 和 Client Secret\n"
    );

    console.log("5️⃣ 测试登录：");
    console.log("   - 重启开发服务器: npm run dev");
    console.log("   - 访问: http://localhost:3000/login");
    console.log("   - 点击 Google 登录按钮测试\n");

    // 3. 检查是否已有 Google 提供商配置
    console.log("🔍 检查 Google 提供商状态...");

    // 注意：Supabase 管理 API 不直接支持获取提供商配置
    // 这里我们通过尝试获取用户来检查连接
    console.log("✅ Google 提供商配置需要在 Supabase Dashboard 中手动完成");

    console.log("\n🎯 下一步操作：");
    console.log("1. 按照上述指南在 Google Cloud Console 中创建 OAuth 凭据");
    console.log("2. 在 Supabase Dashboard 中启用 Google 提供商");
    console.log("3. 测试登录功能");
    console.log("4. 如果遇到问题，查看浏览器控制台和 Supabase 日志");

    console.log("\n📞 获取帮助：");
    console.log("- Supabase Auth 文档: https://supabase.com/docs/guides/auth");
    console.log(
      "- Google OAuth 文档: https://developers.google.com/identity/protocols/oauth2"
    );
    console.log("- Supabase Discord: https://discord.gg/supabase");
  } catch (error) {
    console.error("❌ 设置过程中发生错误:", error.message);
  }
}

// 运行设置
setupGoogleAuth();
