import axiosClient from "../api/axiosClient";
import apiConfig from "../api.json";
import { Review, ReviewComment, CreateReviewPayload } from "../types/review";

/**
 * Helper chuẩn hóa URL hình ảnh:
 * Tự động chuyển đổi các đường dẫn tương đối `/uploads/...` hoặc chứa `localhost:8080`
 * thành URL đầy đủ dựa trên `apiConfig.baseUrl` để điện thoại truy cập mượt qua mạng LAN.
 */
export const resolveImageUrl = (url?: string | null): string => {
  if (!url) return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";
  const trimmed = String(url).trim();
  if (!trimmed) return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150";

  // Nếu là link Google Drive định dạng cũ
  const driveMatch = trimmed.match(/(?:\/d\/|id=)([A-Za-z0-9_-]{10,})/);
  if (driveMatch?.[1] && trimmed.includes("drive.google.com")) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }

  // Đường dẫn tương đối uploads trên server
  if (trimmed.startsWith("/uploads") || trimmed.startsWith("uploads")) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${apiConfig.baseUrl}${cleanPath}`;
  }

  // Thay thế localhost / 127.0.0.1 bằng baseUrl trong cấu hình
  if (trimmed.includes("localhost:") || trimmed.includes("127.0.0.1:")) {
    return trimmed.replace(/http:\/\/(localhost|127\.0\.0\.1):\d+/, apiConfig.baseUrl);
  }

  return trimmed;
};

const normalizeReview = (item: any, fallbackCategory?: string): Review => {
  const mediaList = Array.isArray(item?.media)
    ? item.media
    : Array.isArray(item?.images)
      ? item.images
      : Array.isArray(item?.hinh_anh)
        ? item.hinh_anh
        : [];

  return {
    id: Number(item?.id ?? item?.review_id ?? item?.postId ?? Date.now()),
    user_id: Number(item?.user_id ?? item?.user?.id ?? 0),
    user_name: item?.user_name ?? item?.author_name ?? item?.user?.ho_ten ?? item?.user?.ten_dang_nhap ?? "Người dùng",
    user_avatar: resolveImageUrl(item?.user_avatar ?? item?.author_avatar ?? item?.user?.avatar),
    is_purchased: Boolean(item?.is_purchased ?? item?.da_mua_hang ?? false),
    product_id: item?.product_id ?? item?.product?.id ?? null,
    product_name: item?.product_name ?? item?.product?.name ?? item?.plant_name ?? null,
    so_sao: Number(item?.so_sao ?? item?.rating ?? 5),
    noi_dung: item?.noi_dung ?? item?.content ?? "",
    status: (item?.status ?? "da_duyet") as Review["status"],
    so_luong_thich: Number(item?.so_luong_thich ?? item?.likes_count ?? item?.like_count ?? 0),
    is_liked: Boolean(item?.is_liked ?? false),
    media: mediaList.map((media: any, index: number) => {
      const rawUrl = media?.media_url ?? media?.url ?? media?.image_url ?? (typeof media === "string" ? media : "");
      return {
        id: Number(media?.id ?? index + 1),
        review_id: Number(item?.id ?? index + 1),
        loai_media: media?.loai_media ?? media?.type ?? "hinh_anh",
        media_url: resolveImageUrl(rawUrl),
        thumbnail_url: null,
      };
    }),
    comment_count: Number(item?.comment_count ?? item?.comments_count ?? 0),
    created_at: item?.created_at_formatted ?? item?.created_at ?? "Vừa xong",
    category_tag: item?.category_tag ?? item?.category_label ?? fallbackCategory ?? "Khám phá",
  };
};

const extractReviewList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.reviews)) return payload.reviews;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

/**
 * GET /explore/posts - Lấy danh sách bài viết từ MySQL thông qua Backend API
 * Hỗ trợ phân trang và lọc theo danh mục.
 * Tuyệt đối không fallback sang mock data nếu API lỗi.
 */
export async function getReviews(
  categoryTag?: string,
  currentUserId?: number,
  page = 1,
  limit = 20
): Promise<Review[]> {
  try {
    const response = await axiosClient.get("/explore/posts", {
      params: {
        category: categoryTag && categoryTag !== "Tất cả" ? categoryTag : undefined,
        user_id: currentUserId,
        page,
        limit,
      },
    });

    const list = extractReviewList(response.data);
    return list.map((item) => normalizeReview(item, categoryTag));
  } catch (error) {
    console.error("Lỗi getReviews:", error);
    throw error;
  }
}

/**
 * POST /explore/posts - Đăng bài viết mới kèm upload ảnh bằng Multer
 * Xác thực bằng JWT qua Authorization Header của axiosClient
 */
export async function createReview(
  payload: CreateReviewPayload,
  onUploadProgress?: (progress: number) => void
): Promise<Review> {
  const formData = new FormData();
  formData.append("content", payload.noi_dung);
  formData.append("rating", payload.so_sao.toString());
  if (payload.product_id) {
    formData.append("product_id", payload.product_id.toString());
  }
  if (payload.category_tag) {
    formData.append("category_tag", payload.category_tag);
  }

  payload.images.forEach((imageUri, index) => {
    const filename = imageUri.split("/").pop() || `photo_${index}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : "jpg";
    const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    // @ts-ignore
    formData.append("photos", {
      uri: imageUri,
      name: filename,
      type: type,
    });
  });

  const response = await axiosClient.post("/explore/posts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress?.(percent);
      }
    },
  });

  const reviewPayload = response.data?.data ?? response.data;
  return normalizeReview(reviewPayload, payload.category_tag);
}

/**
 * POST /explore/posts/:id/like - Toggle Thích / Bỏ thích bài viết
 * Yêu cầu JWT, lưu quan hệ trong MySQL bảng explore_likes
 */
export async function toggleReviewLike(
  reviewId: number
): Promise<{ is_liked: boolean; total_likes: number }> {
  const response = await axiosClient.post(`/explore/posts/${reviewId}/like`);
  const data = response.data?.data ?? response.data;
  return {
    is_liked: Boolean(data?.is_liked),
    total_likes: Number(data?.likes_count ?? data?.total_likes ?? 0),
  };
}

/**
 * GET /explore/posts/:id/comments - Lấy danh sách bình luận kèm User Avatar và tên thật
 */
export async function getReviewComments(reviewId: number): Promise<ReviewComment[]> {
  const response = await axiosClient.get(`/explore/posts/${reviewId}/comments`);
  const rawList = response.data?.data || (Array.isArray(response.data) ? response.data : []);

  return rawList.map((item: any) => ({
    id: Number(item.id),
    review_id: Number(item.review_id ?? item.post_id ?? reviewId),
    user_id: Number(item.user_id),
    user_name: item.user_name || item.author_name || "Người dùng",
    user_avatar: resolveImageUrl(item.user_avatar || item.author_avatar),
    parent_id: item.parent_id ?? null,
    noi_dung: item.noi_dung || item.content || "",
    created_at: item.created_at || "Vừa xong",
    replies: Array.isArray(item.replies)
      ? item.replies.map((reply: any) => ({
          id: Number(reply.id),
          review_id: Number(reply.review_id ?? reply.post_id ?? reviewId),
          user_id: Number(reply.user_id),
          user_name: reply.user_name || reply.author_name || "Người dùng",
          user_avatar: resolveImageUrl(reply.user_avatar || reply.author_avatar),
          parent_id: reply.parent_id ?? item.id ?? null,
          noi_dung: reply.noi_dung || reply.content || "",
          created_at: reply.created_at || "Vừa xong",
        }))
      : [],
  }));
}

/**
 * POST /explore/posts/:id/comments - Gửi bình luận mới
 * Yêu cầu JWT, lưu vào MySQL bảng explore_comments
 */
export async function postReviewComment(
  reviewId: number,
  noiDung: string,
  parentId?: number | null
): Promise<ReviewComment> {
  const response = await axiosClient.post(`/explore/posts/${reviewId}/comments`, {
    content: noiDung,
    parent_id: parentId ?? null,
  });

  const payload = response.data?.data ?? response.data;
  return {
    id: Number(payload.id),
    review_id: Number(payload.review_id ?? reviewId),
    user_id: Number(payload.user_id),
    user_name: payload.user_name || payload.author_name || "Bạn",
    user_avatar: resolveImageUrl(payload.user_avatar || payload.author_avatar),
    parent_id: payload.parent_id ?? parentId ?? null,
    noi_dung: payload.noi_dung || payload.content || noiDung,
    created_at: payload.created_at || "Vừa xong",
    replies: [],
  };
}
