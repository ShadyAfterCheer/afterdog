-- AfterDog 数据库设置脚本
-- 在 Supabase SQL 编辑器中运行此脚本

-- 1. 创建 users 表（扩展 auth.users）
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建 uploads 表
CREATE TABLE public.uploads (
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
CREATE TABLE public.generations (
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
CREATE TABLE public.gallery_items (
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
CREATE TABLE public.guesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_item_id UUID REFERENCES public.gallery_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  guessed_animal_type TEXT CHECK (guessed_animal_type IN ('cat', 'dog')) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 防止同一用户对同一项目重复猜测
  UNIQUE(gallery_item_id, user_id)
);

-- 6. 创建 reports 表
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_item_id UUID REFERENCES public.gallery_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 创建索引以提高查询性能
CREATE INDEX idx_uploads_user_id ON public.uploads(user_id);
CREATE INDEX idx_generations_user_id ON public.generations(user_id);
CREATE INDEX idx_generations_status ON public.generations(status);
CREATE INDEX idx_gallery_items_user_id ON public.gallery_items(user_id);
CREATE INDEX idx_gallery_items_public ON public.gallery_items(is_public) WHERE is_public = true;
CREATE INDEX idx_gallery_items_created_at ON public.gallery_items(created_at DESC);
CREATE INDEX idx_guesses_user_id ON public.guesses(user_id);
CREATE INDEX idx_guesses_gallery_item_id ON public.guesses(gallery_item_id);

-- 8. 创建更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. 为相关表添加更新时间戳触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON public.uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON public.generations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gallery_items_updated_at BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. 创建自动插入用户信息的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 创建触发器：当新用户注册时自动创建用户记录
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. 启用 RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 13. 创建 RLS 策略

-- users 表策略
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- uploads 表策略
CREATE POLICY "Users can view their own uploads" ON public.uploads
  FOR ALL USING (auth.uid() = user_id);

-- generations 表策略
CREATE POLICY "Users can view their own generations" ON public.generations
  FOR ALL USING (auth.uid() = user_id);

-- gallery_items 表策略
CREATE POLICY "Anyone can view public gallery items" ON public.gallery_items
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own gallery items" ON public.gallery_items
  FOR ALL USING (auth.uid() = user_id);

-- guesses 表策略
CREATE POLICY "Users can view and create their own guesses" ON public.guesses
  FOR ALL USING (auth.uid() = user_id);

-- reports 表策略
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

-- 14. 创建存储桶（需要在 Supabase 管理面板中手动创建，但这里提供参考）
-- 在 Supabase Storage 中创建以下桶：
-- 桶名: uploads
-- 公开访问: false
-- 允许的文件类型: image/jpeg, image/png, image/webp

-- 桶名: generations  
-- 公开访问: true
-- 允许的文件类型: image/png, image/jpeg

-- 15. Storage 策略（在 Storage 设置中添加）
-- 对于 uploads 桶：
-- INSERT: auth.uid() = (storage.foldername(name))[1]::uuid
-- SELECT: auth.uid() = (storage.foldername(name))[1]::uuid
-- UPDATE: auth.uid() = (storage.foldername(name))[1]::uuid
-- DELETE: auth.uid() = (storage.foldername(name))[1]::uuid

-- 对于 generations 桶：
-- INSERT: true (允许所有认证用户)
-- SELECT: true (公开访问)
-- UPDATE: false
-- DELETE: false

