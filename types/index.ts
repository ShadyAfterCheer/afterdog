export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Upload {
  id: string;
  user_id: string;
  original_url: string;
  thumbnail_url?: string;
  file_size: number;
  file_name: string;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  upload_id: string;
  user_id: string;
  animal_type: "cat" | "dog";
  style_preset: "realistic_toon";
  keep_accessories: boolean;
  detected_accessories: string[];
  prompt: string;
  negative_prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  result_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface GalleryItem {
  id: string;
  person_name: string; // 用户名：用来存放用户的名称
  generated_image: string; // 生成图：用户生成出来的图像（base64 编码）
}

export interface Guess {
  id: string;
  gallery_item_id: string;
  user_id: string;
  guessed_name: string; // 修改：猜测的人名
  is_correct: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  gallery_item_id: string;
  user_id: string;
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  total_uploads: number;
  total_generations: number;
  total_likes: number;
  correct_guesses: number;
  total_guesses: number;
}
