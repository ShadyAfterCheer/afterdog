-- 更新 guesses 表结构以支持名字猜测功能

-- 1. 删除旧的 guesses 表
DROP TABLE IF EXISTS public.guesses;

-- 2. 重新创建 guesses 表，使用 guessed_name 字段
CREATE TABLE IF NOT EXISTS public.guesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gallery_item_id UUID REFERENCES public.gallery_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  guessed_name TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gallery_item_id, user_id, guessed_name)
);

-- 3. 启用 RLS
ALTER TABLE public.guesses ENABLE ROW LEVEL SECURITY;

-- 4. 创建基本策略
CREATE POLICY "Anyone can view guesses" ON public.guesses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own guesses" ON public.guesses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. 插入一些测试猜测数据
INSERT INTO public.guesses (gallery_item_id, user_id, guessed_name, is_correct) VALUES
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '张三', false),
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '李四', false),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', '王五', false)
ON CONFLICT (gallery_item_id, user_id, guessed_name) DO NOTHING;

SELECT 'guesses 表更新完成！' as status;
