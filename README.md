# AfterDog - 写实卡通风宠物头像生成器

一个基于 AI 的宠物头像生成应用，可以将人像照片转换为可爱的写实卡通风猫狗头像。

## 功能特性

- 🎨 **AI 头像生成**: 使用 Replicate API 将人像转换为写实卡通风宠物头像
- 🐱🐶 **双动物类型**: 支持猫咪和狗狗两种动物类型
- 👓 **配饰继承**: 智能检测并保留原图中的眼镜等配饰
- 🎮 **猜测游戏**: 4 选 1 猜测玩法，增加互动趣味性
- 📸 **照片墙**: 公开展示用户生成的作品
- ❤️ **社交功能**: 点赞、分享、举报等社交互动
- 📊 **个人中心**: 用户统计数据和作品管理
- 🔐 **用户认证**: 基于 Supabase 的完整认证系统

## 技术栈

- **前端**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **UI 组件**: shadcn/ui + Radix UI
- **后端**: Supabase (Auth, Database, Storage)
- **AI 生成**: Replicate API (InstantID)
- **部署**: Vercel

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd afterdog
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

创建 `.env.local` 文件：

```bash
cp env.example .env.local
```

编辑 `.env.local` 并配置你的服务密钥。详细设置说明请查看 [`SETUP.md`](./SETUP.md)。

> 💡 **提示**：项目启动时会显示配置提醒，按照提示完成设置即可。

### 4. 数据库设置

在 Supabase SQL 编辑器中执行 [`database/setup.sql`](./database/setup.sql) 脚本来创建所有必要的表和策略。

#### users 表

```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### uploads 表

```sql
CREATE TABLE uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### generations 表

```sql
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES uploads(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  animal_type TEXT CHECK (animal_type IN ('cat', 'dog')) NOT NULL,
  style_preset TEXT DEFAULT 'realistic_toon',
  keep_accessories BOOLEAN DEFAULT true,
  detected_accessories JSONB DEFAULT '[]',
  prompt TEXT NOT NULL,
  negative_prompt TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  result_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### gallery_items 表

```sql
CREATE TABLE gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES generations(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  title TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### guesses 表

```sql
CREATE TABLE guesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_item_id UUID REFERENCES gallery_items(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  guessed_animal_type TEXT CHECK (guessed_animal_type IN ('cat', 'dog')) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### reports 表

```sql
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_item_id UUID REFERENCES gallery_items(id) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Storage 设置

在 Supabase Storage 中创建以下 bucket：

- `uploads`: 存储用户上传的原图
- `generations`: 存储生成的宠物头像

### 6. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
afterdog/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── auth/              # 认证相关页面
│   ├── item/              # 详情页面
│   ├── login/             # 登录页面
│   ├── me/                # 个人中心
│   ├── upload/            # 上传页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   ├── ui/               # UI 基础组件
│   ├── navbar.tsx        # 导航栏
│   ├── gallery-grid.tsx  # 照片墙网格
│   └── providers.tsx     # 上下文提供者
├── lib/                  # 工具库
│   ├── supabase.ts       # Supabase 客户端
│   └── utils.ts          # 工具函数
├── types/                # TypeScript 类型定义
└── public/               # 静态资源
```

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### 环境变量配置

确保在 Vercel 中配置了所有必要的环境变量。

## 功能说明

### 头像生成流程

1. 用户上传人像照片
2. 系统检测配饰（眼镜等）
3. 用户选择动物类型（猫/狗）
4. 调用 Replicate API 生成宠物头像
5. 结果保存到 Supabase Storage
6. 可选择发布到照片墙

### 猜测游戏

- 用户查看其他用户的作品
- 猜测是猫还是狗
- 即时显示正确答案
- 记录猜测统计

### 社交功能

- 点赞作品
- 分享功能
- 举报不当内容
- 个人作品管理

## 限制说明

- 单用户并发生成：1 个
- 图片大小限制：5MB
- 支持格式：JPG、PNG、WebP
- 生成时间：60-90 秒

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
