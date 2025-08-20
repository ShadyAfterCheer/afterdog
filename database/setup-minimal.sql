-- AfterDog 最小化数据库设置脚本
-- 在 Supabase SQL Editor 中执行

-- 1. 创建 users 表
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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
  is_public BOOLEAN DEFAULT true,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建 guesses 表
CREATE TABLE IF NOT EXISTS public.guesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_item_id UUID REFERENCES public.gallery_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  guessed_animal_type TEXT CHECK (guessed_animal_type IN ('cat', 'dog')) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gallery_item_id, user_id)
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

-- 8. 创建基本策略
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view their own uploads" ON public.uploads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own generations" ON public.generations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public gallery items" ON public.gallery_items
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own gallery items" ON public.gallery_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view and create their own guesses" ON public.guesses
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 9. 插入测试数据
INSERT INTO public.users (id, email, name, avatar_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'test1@example.com', '测试用户1', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com', '测试用户2', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'),
  ('33333333-3333-3333-3333-333333333333', 'test3@example.com', '测试用户3', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face')
ON CONFLICT (id) DO NOTHING;

-- 10. 插入测试生成记录
INSERT INTO public.generations (id, upload_id, user_id, animal_type, prompt, negative_prompt, status, result_url) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'cat', 'A realistic cartoon cat', 'bad quality', 'completed', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&crop=center'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'dog', 'A realistic cartoon dog', 'bad quality', 'completed', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=400&fit=crop&crop=center'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'cat', 'A realistic cartoon cat', 'bad quality', 'completed', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400&h=400&fit=crop&crop=center')
ON CONFLICT (id) DO NOTHING;

-- 11. 插入测试照片墙项目
INSERT INTO public.gallery_items (id, generation_id, user_id, title, description, likes_count) VALUES
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '可爱的小猫咪', '这是一只非常可爱的小猫咪', 15),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', '忠诚的小狗', '这是一只忠诚的小狗', 23),
  ('33333333-cccc-cccc-cccc-cccccccccccc', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', '优雅的猫咪', '这是一只优雅的猫咪', 8)
ON CONFLICT (id) DO NOTHING;

SELECT '数据库设置完成！' as status;

