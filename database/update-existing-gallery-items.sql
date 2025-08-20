-- 更新现有的 gallery_items 表结构
-- 保留现有数据，添加新字段

-- 1. 备份现有数据（可选）
-- 如果需要，可以先导出现有数据

-- 2. 添加新字段到现有的 gallery_items 表
ALTER TABLE public.gallery_items 
ADD COLUMN IF NOT EXISTS person_name TEXT,
ADD COLUMN IF NOT EXISTS original_image TEXT,
ADD COLUMN IF NOT EXISTS generated_image TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 3. 更新现有数据，将 generation 表中的数据迁移到新字段
UPDATE public.gallery_items 
SET 
  generated_image = (
    SELECT result_url 
    FROM public.generations 
    WHERE generations.id = gallery_items.generation_id
  ),
  person_name = COALESCE(gallery_items.title, '未知用户'),
  tags = ARRAY[]::TEXT[]
WHERE generated_image IS NULL;

-- 4. 将字段设置为 NOT NULL（在数据迁移完成后）
ALTER TABLE public.gallery_items 
ALTER COLUMN person_name SET NOT NULL,
ALTER COLUMN original_image SET NOT NULL,
ALTER COLUMN generated_image SET NOT NULL;

-- 5. 为 original_image 设置默认值（使用 generated_image 作为占位符）
UPDATE public.gallery_items 
SET original_image = generated_image 
WHERE original_image IS NULL;

-- 6. 删除不再需要的字段（可选，如果确定不需要的话）
-- ALTER TABLE public.gallery_items DROP COLUMN IF EXISTS generation_id;
-- ALTER TABLE public.gallery_items DROP COLUMN IF EXISTS title;
-- ALTER TABLE public.gallery_items DROP COLUMN IF EXISTS description;
-- ALTER TABLE public.gallery_items DROP COLUMN IF EXISTS likes_count;

-- 7. 更新测试数据
UPDATE public.gallery_items 
SET 
  person_name = '张三',
  tags = ARRAY['前端开发', '男生', '资深']
WHERE id = '11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

UPDATE public.gallery_items 
SET 
  person_name = '李四',
  tags = ARRAY['后端开发', '女生', '新人']
WHERE id = '22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

UPDATE public.gallery_items 
SET 
  person_name = '王五',
  tags = ARRAY['产品经理', '男生', '大佬']
WHERE id = '33333333-cccc-cccc-cccc-cccccccccccc';

-- 8. 验证更新结果
SELECT 
  id,
  person_name,
  tags,
  LENGTH(original_image) as original_image_length,
  LENGTH(generated_image) as generated_image_length
FROM public.gallery_items 
LIMIT 5;

SELECT 'gallery_items 表更新完成！' as status;
