import axiosClient from "../api/axiosClient";

export type DailyTaskReward = {
  type: "water" | "fertilizer" | "seed";
  amount: number;
};

export type DailyTask = {
  id: "daily_login" | "view_products" | "like_post" | "share_event" | "community_explore";
  title: string;
  description: string;
  status: "INCOMPLETE" | "CLAIMABLE" | "CLAIMED";
  progress?: number;
  target?: number;
  reward: DailyTaskReward;
};

export type DailyTasksResponse = {
  date: string;
  tasks: DailyTask[];
};

export type ClaimTaskResponse = {
  success: boolean;
  taskId: string;
  status: "CLAIMED";
  reward: DailyTaskReward;
  updatedTurns?: {
    water_turns: number;
    fert_turns: number;
    water_max: number;
    fert_max: number;
  };
  rewardSeed?: {
    id: string;
    name: string;
    emoji: string;
  };
  inventorySeed?: {
    id: string;
    name: string;
    emoji: string;
    quantity: number;
  };
  message?: string;
};

export type UserSeedInventoryItem = {
  seed_id: string;
  quantity: number;
  name: string;
  emoji: string;
  updated_at?: string;
};

/**
 * Lấy danh sách nhiệm vụ hàng ngày từ Backend
 */
export async function getDailyTasks(): Promise<DailyTasksResponse> {
  const res = await axiosClient.get<DailyTasksResponse>(`/api/daily-tasks?_t=${Date.now()}`, {
    headers: {
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
    },
  });
  return res.data;
}

/**
 * Điểm danh đăng nhập ngày mới
 */
export async function checkInDailyTask(): Promise<{ success: boolean; message: string }> {
  const res = await axiosClient.post("/api/daily-tasks/check-in");
  return res.data;
}

/**
 * Ghi nhận hành động xem sản phẩm
 */
export async function recordProductView(productId: number | string): Promise<{
  success: boolean;
  progress: number;
  target: number;
  completed: boolean;
}> {
  const res = await axiosClient.post("/api/daily-tasks/product-view", { productId });
  return res.data;
}

/**
 * Ghi nhận hành động khám phá cộng đồng
 */
export async function recordCommunityExplore(): Promise<{ success: boolean; completed: boolean }> {
  const res = await axiosClient.post("/api/daily-tasks/community-explore");
  return res.data;
}

/**
 * Ghi nhận hành động chia sẻ sự kiện
 */
export async function recordEventShare(): Promise<{ success: boolean; completed: boolean }> {
  const res = await axiosClient.post("/api/daily-tasks/event-share");
  return res.data;
}

/**
 * Nhận phần thưởng nhiệm vụ (Backend kiểm tra điều kiện thực tế trên database)
 * Không gửi completed hay progress lên Backend.
 */
export async function claimDailyTask(taskId: string): Promise<ClaimTaskResponse> {
  const res = await axiosClient.post<ClaimTaskResponse>(`/api/daily-tasks/${taskId}/claim`);
  return res.data;
}

/**
  * Lấy kho hạt giống thực tế từ Database MySQL của user
  */
export async function getSeedInventory(): Promise<UserSeedInventoryItem[]> {
  const res = await axiosClient.get<{ success: boolean; inventory: UserSeedInventoryItem[] }>(
    `/api/daily-tasks/seed-inventory?_t=${Date.now()}`,
    {
      headers: {
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
    }
  );
  return res.data?.inventory || [];
}

/**
  * Tiêu hao 1 hạt giống khi người dùng chọn trồng
  */
export async function consumeSeedInventory(seedId: string): Promise<{ success: boolean; remainingQuantity?: number }> {
  const res = await axiosClient.post<{ success: boolean; remainingQuantity?: number }>(
    "/api/daily-tasks/seed-inventory/consume",
    { seedId }
  );
  return res.data;
}
