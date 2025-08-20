-- 修复 gallery_items 表的 RLS 策略
-- 确保匿名用户可以查看公开的数据

-- 1. 删除现有的策略
DROP POLICY IF EXISTS "Anyone can view public gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Users can insert their own gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Users can update their own gallery items" ON public.gallery_items;

-- 2. 重新创建策略
-- 允许任何人查看公开的数据
CREATE POLICY "Anyone can view public gallery items" ON public.gallery_items
  FOR SELECT USING (is_public = true);

-- 允许认证用户插入自己的数据
CREATE POLICY "Users can insert their own gallery items" ON public.gallery_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许认证用户更新自己的数据
CREATE POLICY "Users can update their own gallery items" ON public.gallery_items
  FOR UPDATE USING (auth.uid() = user_id);

-- 3. 验证策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'gallery_items';

SELECT 'RLS 策略修复完成！' as status;
