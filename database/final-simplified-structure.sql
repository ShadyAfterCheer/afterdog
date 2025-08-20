-- 最终简化的数据库结构
-- 只需要 gallery_items 表，猜测选项从表中随机获取

-- 1. 移除不需要的字段
ALTER TABLE public.gallery_items 
DROP COLUMN IF EXISTS correct_answer,
DROP COLUMN IF EXISTS wrong_answers;

-- 2. 验证简化后的表结构
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'gallery_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. 验证现有数据
SELECT 
  id,
  person_name,
  tags,
  is_public,
  created_at
FROM public.gallery_items 
LIMIT 5;

SELECT '最终简化数据库结构完成！' as status;
