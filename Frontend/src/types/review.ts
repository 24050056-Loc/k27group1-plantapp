export type ReviewMedia = {
  id: number;
  review_id: number;
  loai_media: "hinh_anh" | "video";
  media_url: string;
  thumbnail_url?: string | null;
};

export type ReviewComment = {
  id: number;
  review_id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string | null;
  parent_id?: number | null;
  noi_dung: string;
  created_at: string;
  replies?: ReviewComment[];
};

export type Review = {
  id: number;
  user_id: number;
  user_name: string;
  user_avatar?: string | null;
  is_purchased?: boolean;
  product_id?: number | null;
  product_name?: string | null;
  so_sao: number;
  noi_dung: string;
  status: "cho_duyet" | "da_duyet" | "tu_choi";
  so_luong_thich: number;
  is_liked?: boolean;
  media: ReviewMedia[];
  comment_count: number;
  created_at: string;
  category_tag?: string;
};

export type CreateReviewPayload = {
  user_id?: number;
  product_id?: number;
  so_sao: number;
  noi_dung: string;
  images: string[]; // Uri array from image picker
  category_tag?: string;
  user_name?: string;
  user_avatar?: string | null;
};
