-- 简化的数据库结构
-- 只需要 gallery_items 表，猜测功能从同一表中随机获取

-- 1. 删除不需要的表
DROP TABLE IF EXISTS public.guesses;
DROP TABLE IF EXISTS public.reports;
DROP TABLE IF EXISTS public.generations;
DROP TABLE IF EXISTS public.uploads;

-- 2. 简化 gallery_items 表，添加猜测相关字段
ALTER TABLE public.gallery_items 
ADD COLUMN IF NOT EXISTS correct_answer TEXT NOT NULL DEFAULT '未知用户',
ADD COLUMN IF NOT EXISTS wrong_answers TEXT[] DEFAULT ARRAY['张三', '李四', '王五', '赵六']::TEXT[];

-- 3. 更新现有数据，设置正确答案
UPDATE public.gallery_items 
SET correct_answer = person_name 
WHERE correct_answer = '未知用户';

-- 4. 更新测试数据，设置错误答案选项
UPDATE public.gallery_items 
SET wrong_answers = ARRAY['张三', '李四', '王五', '赵六'] 
WHERE id = '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE public.gallery_items 
SET wrong_answers = ARRAY['张三', '王五', '赵六', '钱七'] 
WHERE id = '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE public.gallery_items 
SET wrong_answers = ARRAY['张三', '李四', '赵六', '钱七'] 
WHERE id = '33333333-cccc-cccc-cccc-cccccccccccc';

UPDATE public.gallery_items 
SET wrong_answers = ARRAY['张三', '李四', '王五', '钱七'] 
WHERE id = '44444444-dddd-dddd-dddd-dddddddddddd';

UPDATE public.gallery_items 
SET wrong_answers = ARRAY['张三', '李四', '王五', '赵六'] 
WHERE id = '55555555-eeee-eeee-eeee-eeeeeeeeeeee';

-- 5. 简化 RLS 策略
DROP POLICY IF EXISTS "Anyone can view public gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON public.gallery_items;

-- 允许任何人查看公开的数据
CREATE POLICY "Anyone can view public gallery items" ON public.gallery_items
  FOR SELECT USING (is_public = true);

-- 允许任何人插入数据（简化版）
CREATE POLICY "Anyone can insert gallery items" ON public.gallery_items
  FOR INSERT WITH CHECK (true);

-- 6. 验证数据
SELECT 
  id,
  person_name,
  correct_answer,
  wrong_answers,
  tags,
  is_public
FROM public.gallery_items 
LIMIT 5;

SELECT '简化数据库结构完成！' as status;
