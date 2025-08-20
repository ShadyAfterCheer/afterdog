-- AfterDog 增强版数据库设置脚本
-- 支持猜测游戏和标签功能

-- 1. 创建 users 表（不依赖 auth.users）
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 uploads 表
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 generations 表
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
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

-- 4. 创建 gallery_items 表
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES public.generations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  description TEXT,
  person_name TEXT, -- 新增：照片中的人名
  tags TEXT[], -- 新增：标签数组
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建 guesses 表（增强版）
CREATE TABLE IF NOT EXISTS public.guesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_item_id UUID REFERENCES public.gallery_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  guessed_name TEXT NOT NULL, -- 修改：猜测的人名
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gallery_item_id, user_id, guessed_name) -- 修改：允许同一用户对同一项目多次猜测
);

-- 6. 创建 reports 表
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_item_id UUID REFERENCES public.gallery_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 8. 创建基本策略（简化版）
CREATE POLICY "Anyone can view users" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view uploads" ON public.uploads
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view generations" ON public.generations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view public gallery items" ON public.gallery_items
  FOR SELECT USING (is_public = true);

CREATE POLICY "Anyone can view guesses" ON public.guesses
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view reports" ON public.reports
  FOR SELECT USING (true);

-- 9. 插入测试数据
INSERT INTO public.users (id, email, name, avatar_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'test1@example.com', '测试用户1', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com', '测试用户2', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
  ('33333333-3333-3333-3333-333333333333', 'test3@example.com', '测试用户3', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face')
ON CONFLICT (id) DO NOTHING;

-- 10. 插入测试上传记录
INSERT INTO public.uploads (id, user_id, original_url, file_size, file_name) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'https://example.com/upload1.jpg', 1024000, 'upload1.jpg'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'https://example.com/upload2.jpg', 2048000, 'upload2.jpg'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'https://example.com/upload3.jpg', 1536000, 'upload3.jpg')
ON CONFLICT (id) DO NOTHING;

-- 11. 插入测试生成记录
INSERT INTO public.generations (id, upload_id, user_id, animal_type, prompt, negative_prompt, status, result_url) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'cat', 'A realistic cartoon cat', 'bad quality', 'completed', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=center'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'dog', 'A realistic cartoon dog', 'bad quality', 'completed', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop&crop=center'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'cat', 'A realistic cartoon cat', 'bad quality', 'completed', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=400&fit=crop&crop=center')
ON CONFLICT (id) DO NOTHING;

-- 12. 插入测试照片墙项目（增强版）
INSERT INTO public.gallery_items (id, generation_id, user_id, title, description, person_name, tags, likes_count) VALUES
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '张三的猫咪头像', '这是张三的照片，标签：前端开发, 男生, 资深', '张三', ARRAY['前端开发', '男生', '资深'], 15),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', '李四的狗狗头像', '这是李四的照片，标签：产品经理, 女生, 新人', '李四', ARRAY['产品经理', '女生', '新人'], 23),
  ('33333333-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', '王五的猫咪头像', '这是王五的照片，标签：后端开发, 男生, 大佬', '王五', ARRAY['后端开发', '男生', '大佬'], 8)
ON CONFLICT (id) DO NOTHING;

SELECT '增强版数据库设置完成！' as status;
