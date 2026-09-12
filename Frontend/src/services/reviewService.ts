import axiosClient from "../api/axiosClient";
import { Review, ReviewComment, CreateReviewPayload } from "../types/review";

// Dữ liệu mẫu (Mock data) khi chưa kết nối backend hoặc test local
const INITIAL_MOCK_REVIEWS: Review[] = [
  {
    id: 101,
    user_id: 1,
    user_name: "Nguyễn Minh Anh",
    user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    is_purchased: true,
    product_id: 1,
    product_name: "Sen Đá Ngọc Bích (Jade Plant)",
    so_sao: 5,
    noi_dung: "Cây nhận được tươi xanh và mọng nước lắm mọi người ơi! Đóng gói cực kỳ cẩn thận, có kèm cả hướng dẫn tưới nước nữa. Sẽ tiếp tục ủng hộ shop! 🌿💚",
    status: "da_duyet",
    so_luong_thich: 24,
    is_liked: false,
    media: [
      {
        id: 1,
        review_id: 101,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=800"
      },
      {
        id: 2,
        review_id: 101,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800"
      },
      {
        id: 3,
        review_id: 101,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800"
      }
    ],
    comment_count: 3,
    created_at: "2 giờ trước",
    category_tag: "Đánh giá hot"
  },
  {
    id: 102,
    user_id: 2,
    user_name: "Trần Bảo Long",
    user_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    is_purchased: false,
    so_sao: 5,
    noi_dung: "Vừa thu hoạch cây Kim Tiền từ Mini game xong khoe liền! Cây lớn cực kỳ nhanh nếu bón phân đúng hạn nha cả nhà 🪴✨",
    status: "da_duyet",
    so_luong_thich: 18,
    is_liked: true,
    media: [
      {
        id: 4,
        review_id: 102,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1545241047-6083a3684587?w=800"
      }
    ],
    comment_count: 1,
    created_at: "5 giờ trước",
    category_tag: "Khoe cây 🌿"
  },
  {
    id: 103,
    user_id: 3,
    user_name: "Lê Thu Thảo",
    user_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    is_purchased: true,
    product_id: 2,
    product_name: "Xương Rồng Kim Sơn",
    so_sao: 4,
    noi_dung: "Góc làm việc sinh động hẳn lên nhờ chậu xương rồng này. Cây khỏe, không tốn công chăm sóc nhiều.",
    status: "da_duyet",
    so_luong_thich: 9,
    is_liked: false,
    media: [
      {
        id: 5,
        review_id: 103,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1519336056116-bc0f1771dcb6?w=800"
      },
      {
        id: 6,
        review_id: 103,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800"
      },
      {
        id: 7,
        review_id: 103,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800"
      },
      {
        id: 8,
        review_id: 103,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1520412099551-62b6bafeb5bb?w=800"
      },
      {
        id: 9,
        review_id: 103,
        loai_media: "hinh_anh",
        media_url: "https://images.unsplash.com/photo-1446071103084-c257b5f64323?w=800"
      }
    ],
    comment_count: 5,
    created_at: "1 ngày trước",
    category_tag: "Đánh giá hot"
  }
];

const MOCK_COMMENTS: Record<number, ReviewComment[]> = {
  101: [
    {
      id: 201,
      review_id: 101,
      user_id: 4,
      user_name: "Phạm Hải Đăng",
      user_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      noi_dung: "Cây sen đá này tưới bao nhiêu lần 1 tuần vậy bạn?",
      created_at: "1 giờ trước",
      replies: [
        {
          id: 202,
          review_id: 101,
          user_id: 1,
          user_name: "Nguyễn Minh Anh",
          user_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
          parent_id: 201,
          noi_dung: "@Phạm Hải Đăng Khoảng 3-4 ngày mình tưới 1 lần vừa đủ ẩm đất nhé bạn!",
          created_at: "45 phút trước"
        }
      ]
    },
    {
      id: 203,
      review_id: 101,
      user_id: 5,
      user_name: "Hoàng Mỹ Duyên",
      user_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      noi_dung: "Đẹp quá! Mình cũng vừa đặt 1 chậu.",
      created_at: "30 phút trước"
    }
  ]
};

let localReviewsState = [...INITIAL_MOCK_REVIEWS];

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
    user_name: item?.user_name ?? item?.author_name ?? item?.user?.ho_ten ?? item?.user?.name ?? item?.name ?? "Người dùng",
    user_avatar: item?.user_avatar ?? item?.author_avatar ?? item?.user?.avatar ?? item?.avatar_url ?? null,
    is_purchased: Boolean(item?.is_purchased ?? item?.da_mua_hang ?? false),
    product_id: item?.product_id ?? item?.product?.id ?? null,
    product_name: item?.product_name ?? item?.product?.name ?? item?.plant_name ?? null,
    so_sao: Number(item?.so_sao ?? item?.rating ?? 5),
    noi_dung: item?.noi_dung ?? item?.content ?? "",
    status: (item?.status ?? "da_duyet") as Review["status"],
    so_luong_thich: Number(item?.so_luong_thich ?? item?.likes_count ?? item?.like_count ?? 0),
    is_liked: Boolean(item?.is_liked ?? false),
    media: mediaList.map((media: any, index: number) => ({
      id: Number(media?.id ?? index + 1),
      review_id: Number(item?.id ?? item?.review_id ?? item?.postId ?? index + 1),
      loai_media: media?.loai_media ?? media?.type ?? "hinh_anh",
      media_url: media?.media_url ?? media?.url ?? media?.image_url ?? String(media ?? ""),
      thumbnail_url: media?.thumbnail_url ?? null,
    })),
    comment_count: Number(item?.comment_count ?? item?.comments_count ?? 0),
    created_at: item?.created_at ?? item?.createdAt ?? item?.created_at_formatted ?? "Vừa xong",
    category_tag: item?.category_tag ?? item?.category ?? item?.category_label ?? fallbackCategory ?? "Khám phá",
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

/** GET /explore/posts - Lấy danh sách review/bài viết từ backend hoặc fallback local */
export async function getReviews(categoryTag?: string, currentUserId?: number): Promise<Review[]> {
  const endpoints = ["/explore/posts", "/api/reviews"];
  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const response = await axiosClient.get(endpoint, {
        params: {
          category: categoryTag && categoryTag !== "Tất cả" ? categoryTag : undefined,
          user_id: currentUserId
        }
      });

      const list = extractReviewList(response.data);
      if (list.length > 0) {
        const formatted = list.map((item) => normalizeReview(item, categoryTag));
        localReviewsState = formatted;
        return formatted;
      }
    } catch (error) {
      lastError = error;
      console.log(`Request failed for ${endpoint}:`, error);
    }
  }

  console.log("Dùng dữ liệu fallback mock cho reviews:", lastError);

  if (categoryTag && categoryTag !== "Tất cả") {
    return localReviewsState.filter((r) => r.category_tag === categoryTag);
  }
  return localReviewsState;
}

/** POST /explore/posts - Đăng bài viết / đánh giá mới có đính kèm ảnh */
export async function createReview(
  payload: CreateReviewPayload,
  onUploadProgress?: (progress: number) => void
): Promise<Review> {
  const endpoints = ["/explore/posts", "/api/reviews"];

  for (const endpoint of endpoints) {
    try {
      const formData = new FormData();
      formData.append("user_id", (payload.user_id || 1).toString());
      formData.append("rating", payload.so_sao.toString());
      formData.append("content", payload.noi_dung);
      if (payload.product_id) {
        formData.append("product_id", payload.product_id.toString());
      }
      if (payload.category_tag) {
        formData.append("category_tag", payload.category_tag);
      }

      payload.images.forEach((imageUri, index) => {
        const filename = imageUri.split("/").pop() || `photo_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        // @ts-ignore - React Native FormData file objects are not typed in this project
        formData.append("photos", { uri: imageUri, name: filename, type });
      });

      const response = await axiosClient.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onUploadProgress?.(percent);
          }
        }
      });

      const reviewPayload = response.data?.data ?? response.data?.review ?? response.data;
      if (reviewPayload && (reviewPayload.id || reviewPayload.review_id || reviewPayload.postId)) {
        const created = normalizeReview(reviewPayload, payload.category_tag || "Mới nhất");
        localReviewsState = [created, ...localReviewsState];
        return created;
      }
    } catch (error) {
      console.log(`Request failed for ${endpoint} (createReview):`, error);
    }
  }

  onUploadProgress?.(100);

  const newReview: Review = {
    id: Date.now(),
    user_id: payload.user_id || 1,
    user_name: payload.user_name || "Bạn (Tôi)",
    user_avatar: payload.user_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    is_purchased: payload.product_id ? true : false,
    product_id: payload.product_id || null,
    product_name: null,
    so_sao: payload.so_sao,
    noi_dung: payload.noi_dung,
    status: "da_duyet",
    so_luong_thich: 0,
    is_liked: false,
    media: payload.images.map((img, idx) => ({
      id: Date.now() + idx,
      review_id: Date.now(),
      loai_media: "hinh_anh",
      media_url: img
    })),
    comment_count: 0,
    created_at: "Vừa xong",
    category_tag: payload.category_tag || "Mới nhất"
  };

  localReviewsState = [newReview, ...localReviewsState];
  return newReview;
}

/** POST /explore/posts/:id/like - Toggle Like/Unlike */
export async function toggleReviewLike(reviewId: number, currentUserId?: number): Promise<{ is_liked: boolean; total_likes: number }> {
  const endpoints = [`/explore/posts/${reviewId}/like`, `/api/reviews/${reviewId}/like`];

  for (const endpoint of endpoints) {
    try {
      const response = await axiosClient.post(endpoint, { user_id: currentUserId || 1 });
      const payload = response.data?.data ?? response.data;
      if (payload && typeof payload.is_liked === "boolean") {
        return {
          is_liked: payload.is_liked,
          total_likes: Number(payload.total_likes ?? payload.totalLikes ?? payload.so_luong_thich ?? 0),
        };
      }
      if (payload && typeof payload.success === "boolean") {
        return {
          is_liked: Boolean(payload.is_liked),
          total_likes: Number(payload.likes_count ?? payload.total_likes ?? 0),
        };
      }
    } catch (error) {
      console.log(`Request failed for ${endpoint} (toggleReviewLike):`, error);
    }
  }

  const review = localReviewsState.find((r) => r.id === reviewId);
  if (review) {
    review.is_liked = !review.is_liked;
    review.so_luong_thich += review.is_liked ? 1 : -1;
    return { is_liked: review.is_liked, total_likes: review.so_luong_thich };
  }
  return { is_liked: true, total_likes: 1 };
}

/** GET /explore/posts/:id/comments - Lấy bình luận của bài viết */
export async function getReviewComments(reviewId: number): Promise<ReviewComment[]> {
  const endpoints = [`/explore/posts/${reviewId}/comments`, `/api/reviews/${reviewId}/comments`];

  for (const endpoint of endpoints) {
    try {
      const response = await axiosClient.get(endpoint);
      const rawList = response.data?.data || (Array.isArray(response.data) ? response.data : null);
      if (Array.isArray(rawList)) {
        return rawList.map((item: any) => ({
          id: Number(item.id ?? item.comment_id ?? Date.now()),
          review_id: Number(item.review_id ?? item.post_id ?? reviewId),
          user_id: Number(item.user_id ?? item.user?.id ?? 1),
          user_name: item.user_name ?? item.author_name ?? item.user?.ho_ten ?? item.user?.name ?? "Người dùng",
          user_avatar: item.user_avatar ?? item.author_avatar ?? item.user?.avatar ?? null,
          parent_id: item.parent_id ?? null,
          noi_dung: item.noi_dung ?? item.content ?? "",
          created_at: item.created_at ?? item.createdAt ?? item.created_at_formatted ?? "Vừa xong",
          replies: Array.isArray(item.replies) ? item.replies.map((reply: any) => ({
            id: Number(reply.id ?? reply.comment_id ?? Date.now()),
            review_id: Number(reply.review_id ?? reply.post_id ?? reviewId),
            user_id: Number(reply.user_id ?? reply.user?.id ?? 1),
            user_name: reply.user_name ?? reply.author_name ?? reply.user?.ho_ten ?? reply.user?.name ?? "Người dùng",
            user_avatar: reply.user_avatar ?? reply.author_avatar ?? reply.user?.avatar ?? null,
            parent_id: reply.parent_id ?? item.id ?? null,
            noi_dung: reply.noi_dung ?? reply.content ?? "",
            created_at: reply.created_at ?? reply.createdAt ?? reply.created_at_formatted ?? "Vừa xong"
          })) : []
        }));
      }
    } catch (error) {
      console.log(`Request failed for ${endpoint} (getReviewComments):`, error);
    }
  }

  return MOCK_COMMENTS[reviewId] || [];
}

/** POST /explore/posts/:id/comments - Đăng bình luận / câu trả lời */
export async function postReviewComment(
  reviewId: number,
  noiDung: string,
  parentId?: number | null
): Promise<ReviewComment> {
  const endpoints = [`/explore/posts/${reviewId}/comments`, `/api/reviews/${reviewId}/comments`];

  for (const endpoint of endpoints) {
    try {
      const response = await axiosClient.post(endpoint, {
        user_id: 1,
        content: noiDung,
        parent_id: parentId ?? null
      });
      const payload = response.data?.data ?? response.data?.comment ?? response.data;
      if (payload && (payload.id || payload.comment_id)) {
        return {
          id: Number(payload.id ?? payload.comment_id ?? Date.now()),
          review_id: Number(payload.review_id ?? reviewId),
          user_id: Number(payload.user_id ?? 1),
          user_name: payload.user_name ?? payload.author_name ?? "Bạn (Tôi)",
          user_avatar: payload.user_avatar ?? payload.author_avatar ?? null,
          parent_id: payload.parent_id ?? parentId ?? null,
          noi_dung: payload.noi_dung ?? payload.content ?? noiDung,
          created_at: payload.created_at ?? payload.createdAt ?? payload.created_at_formatted ?? "Vừa xong"
        };
      }
    } catch (error) {
      console.log(`Request failed for ${endpoint} (postReviewComment):`, error);
    }
  }

  const newComment: ReviewComment = {
    id: Date.now(),
    review_id: reviewId,
    user_id: 1,
    user_name: "Bạn (Tôi)",
    user_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    parent_id: parentId,
    noi_dung: noiDung,
    created_at: "Vừa xong"
  };

  if (!MOCK_COMMENTS[reviewId]) {
    MOCK_COMMENTS[reviewId] = [];
  }
  MOCK_COMMENTS[reviewId].unshift(newComment);

  return newComment;
}
