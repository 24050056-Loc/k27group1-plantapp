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

/** Helper map dữ liệu backend explore_posts sang interface Review của FE */
function mapBackendPostToReview(item: any): Review {
  let mediaList: any[] = [];
  if (Array.isArray(item.images)) {
    mediaList = item.images.map((imgUrl: string, idx: number) => ({
      id: idx + 1,
      review_id: item.id,
      loai_media: "hinh_anh",
      media_url: imgUrl
    }));
  }

  return {
    id: item.id,
    user_id: item.user_id || 1,
    user_name: item.author_name || "Người dùng",
    user_avatar: item.author_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    is_purchased: Boolean(item.da_mua_hang),
    product_id: null,
    product_name: item.plant_name || undefined,
    so_sao: item.rating || 5,
    noi_dung: item.content || "",
    status: "da_duyet",
    so_luong_thich: item.likes_count || 0,
    is_liked: Boolean(item.is_liked),
    media: mediaList,
    comment_count: item.comments_count || 0,
    created_at: item.created_at_formatted || "Vừa xong",
    category_tag: item.category_label || item.category_tag || "Mới nhất"
  };
}

/** GET /explore/posts - Lấy danh sách review/bài viết từ Backend MySQL */
export async function getReviews(categoryTag?: string, currentUserId?: number): Promise<Review[]> {
  try {
    let catParam = categoryTag;
    if (catParam === "Tất cả") catParam = undefined;
    else if (catParam === "Đánh giá hot") catParam = "danh_gia_hot";
    else if (catParam === "Khoe cây 🌿") catParam = "khoe_cay";
    else if (catParam === "Mẹo chăm sóc" || catParam === "Mẹo chăm cây") catParam = "meo_cham_cay";

    const response = await axiosClient.get("/explore/posts", {
      params: { 
        category: catParam,
        user_id: currentUserId
      }
    });

    const rawList = response.data?.data || (Array.isArray(response.data) ? response.data : null);
    if (Array.isArray(rawList)) {
      const formatted = rawList.map(mapBackendPostToReview);
      localReviewsState = formatted;
      return formatted;
    }
  } catch (error) {
    console.log("Không thể lấy bài viết từ server, dùng dữ liệu local mock:", error);
  }

  if (categoryTag && categoryTag !== "Tất cả") {
    return localReviewsState.filter((r) => r.category_tag === categoryTag);
  }
  return localReviewsState;
}

/** POST /explore/posts - Đăng bài viết / đánh giá mới lưu trực tiếp vào Database MySQL */
export async function createReview(
  payload: CreateReviewPayload,
  onUploadProgress?: (progress: number) => void
): Promise<Review> {
  try {
    const formData = new FormData();
    formData.append("user_id", (payload.user_id || 1).toString());
    formData.append("rating", payload.so_sao.toString());
    formData.append("content", payload.noi_dung);
    if (payload.category_tag) {
      formData.append("category_tag", payload.category_tag);
    }

    payload.images.forEach((imageUri, index) => {
      const filename = imageUri.split("/").pop() || `photo_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      // @ts-ignore
      formData.append("photos", { uri: imageUri, name: filename, type });
    });

    const response = await axiosClient.post("/explore/posts", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress?.(percent);
        }
      }
    });

    if (response.data && response.data.success) {
      // Re-fetch lại danh sách từ server để đồng bộ mới nhất
      const updatedList = await getReviews(payload.category_tag, payload.user_id);
      const newest = updatedList.find((r) => r.id === response.data.postId || r.id === response.data.id);
      if (newest) return newest;
    }
  } catch (error: any) {
    console.error("Lỗi đăng bài lên backend server:", error?.response?.data || error?.message || error);
    onUploadProgress?.(100);
  }

  // Fallback local review nếu lỗi kết nối
  const newReview: Review = {
    id: Date.now(),
    user_id: payload.user_id || 1,
    user_name: "Người dùng",
    user_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    is_purchased: payload.product_id ? true : false,
    product_id: payload.product_id || null,
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
  try {
    const response = await axiosClient.post(`/explore/posts/${reviewId}/like`, { user_id: currentUserId || 1 });
    if (response.data && response.data.success) {
      return {
        is_liked: response.data.is_liked,
        total_likes: response.data.likes_count
      };
    }
  } catch (error) {
    console.log("Lỗi toggle like server, fallback local mock");
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
  try {
    const response = await axiosClient.get(`/explore/posts/${reviewId}/comments`);
    const rawList = response.data?.data || (Array.isArray(response.data) ? response.data : null);
    if (Array.isArray(rawList)) {
      return rawList.map((c: any) => ({
        id: c.id,
        review_id: c.post_id,
        user_id: c.user_id,
        user_name: c.author_name || "Người dùng",
        user_avatar: c.author_avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        parent_id: null,
        noi_dung: c.content,
        created_at: c.created_at_formatted || "Vừa xong"
      }));
    }
  } catch (error) {
    console.log("Lỗi lấy comment từ server");
  }
  return MOCK_COMMENTS[reviewId] || [];
}

/** POST /explore/posts/:id/comments - Đăng bình luận */
export async function postReviewComment(
  reviewId: number,
  noiDung: string,
  parentId?: number | null
): Promise<ReviewComment> {
  try {
    const response = await axiosClient.post(`/explore/posts/${reviewId}/comments`, {
      user_id: 1,
      content: noiDung
    });
    if (response.data && response.data.success) {
      return {
        id: response.data.commentId || Date.now(),
        review_id: reviewId,
        user_id: 1,
        user_name: "Bạn (Tôi)",
        user_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
        parent_id: parentId,
        noi_dung: noiDung,
        created_at: "Vừa xong"
      };
    }
  } catch (error) {
    console.log("Lỗi đăng comment server");
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
