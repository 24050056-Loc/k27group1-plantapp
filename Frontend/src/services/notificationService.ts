import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// ─── Cấu hình hiển thị thông báo khi app đang foreground ─────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Channel ID ───────────────────────────────────────────────────────────────
const PLANT_CHANNEL_ID = "plant-care";
const VOUCHER_CHANNEL_ID = "voucher-ready";
const MILESTONE_CHANNEL_ID = "milestone";

// ─── Tạo notification channels cho Android ───────────────────────────────────
async function ensureChannels() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(PLANT_CHANNEL_ID, {
      name: "🌿 Chăm sóc cây",
      description: "Nhắc nhở tưới nước và chăm sóc cây hàng ngày",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2E7D32",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
      enableVibrate: true,
    });
    await Notifications.setNotificationChannelAsync(VOUCHER_CHANNEL_ID, {
      name: "🎁 Phần thưởng & Voucher",
      description: "Thông báo khi bạn nhận được voucher hoặc phần thưởng mới",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500],
      lightColor: "#FF8F00",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
      enableVibrate: true,
    });
    await Notifications.setNotificationChannelAsync(MILESTONE_CHANNEL_ID, {
      name: "🏆 Cột mốc & Thành tích",
      description: "Thông báo khi cây đạt giai đoạn phát triển mới",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 100, 300],
      lightColor: "#1565C0",
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
    });
  }
}

// ─── Yêu cầu quyền thông báo ─────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannels();

  if (!Device.isDevice) {
    return true;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: false,
      },
    });
    finalStatus = status;
  }

  return finalStatus === "granted";
}

// ─── Lên lịch thông báo "Cây sắp lên giai đoạn" ─────────────────────────────
export async function scheduleStageAlmostDoneNotification(
  stageName: string,
  secondsFromNow: number
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "🌱 Cây sắp lên giai đoạn mới!",
        subtitle: "PlantApp — Tiến trình cây",           // iOS subtitle
        body: `Cây của bạn sắp trở thành ${stageName}. Vào chăm sóc thêm một chút để cây lên ngay nhé!`,
        sound: true,
        badge: 1,
        data: { type: "stage_almost_done", stageName },
        ...(Platform.OS === "android" && {
          channelId: MILESTONE_CHANNEL_ID,
          color: "#2E7D32",
          priority: "high",
          sticky: false,
          vibrate: [0, 300, 100, 300],
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });
    return id;
  } catch (e) {
    console.warn("scheduleStageAlmostDoneNotification error:", e);
    return null;
  }
}

// ─── Thông báo tức thì: Voucher sẵn sàng nhận ────────────────────────────────
export async function sendVoucherReadyNotification(
  voucherLabel: string,
  stageName: string
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🎁 Phần thưởng đang chờ bạn!",
        subtitle: "PlantApp — Voucher mới",              // iOS subtitle
        body: `Cây đã đạt ${stageName}! Nhận ${voucherLabel} ngay trong PlantApp trước khi hết hạn nhé.`,
        sound: true,
        badge: 1,
        data: { type: "voucher_ready", voucherLabel, stageName },
        ...(Platform.OS === "android" && {
          channelId: VOUCHER_CHANNEL_ID,
          color: "#FF8F00",
          priority: "max",
          sticky: false,
          vibrate: [0, 500, 200, 500],
        }),
      },
      trigger: null, // Ngay lập tức
    });
  } catch (e) {
    console.warn("sendVoucherReadyNotification error:", e);
  }
}

// ─── Thông báo nhắc tưới cây hằng ngày ───────────────────────────────────────
const MORNING_MESSAGES = [
  {
    title: "☀️ Chào buổi sáng! Đến giờ tưới cây rồi.",
    body: "Một ngụm nước mát trong lành sẽ giúp cây xanh tốt suốt cả ngày. Tưới ngay bạn nhé! 🌿",
  },
  {
    title: "🌤️ Buổi sáng mát mẻ, cây đang chờ bạn!",
    body: "Mỗi lần tưới nước là thêm một điểm kinh nghiệm. Chăm sóc cây để sớm lên giai đoạn mới nhé.",
  },
  {
    title: "💧 Sáng sớm rồi, cây khát nước đó!",
    body: "Đừng để cây ảo của bạn khô héo. Mở PlantApp và tưới cây ngay để nhận phần thưởng hôm nay!",
  },
];

const EVENING_MESSAGES = [
  {
    title: "🌙 Chiều muộn rồi, tưới cây thư giãn thôi!",
    body: "Sau một ngày dài, hãy dành chút thời gian chăm sóc cây xanh và nhận điểm kinh nghiệm nhé.",
  },
  {
    title: "🌿 Buổi chiều là thời điểm tuyệt vời để tưới cây!",
    body: "Cây của bạn sẽ hấp thụ tốt nhất vào lúc này. Vào PlantApp tưới cây ngay để nhận thưởng!",
  },
  {
    title: "🍃 Cây đang mong bạn ghé thăm chiều nay!",
    body: "Đừng quên tưới nước để cây mau lên giai đoạn mới và nhận voucher giá trị từ PlantApp.",
  },
];

export async function scheduleDailyWaterReminder(
  remindMorning: boolean = true,
  remindEvening: boolean = true
): Promise<string[]> {
  const ids: string[] = [];
  try {
    await cancelDailyWaterReminder();

    const morningMsg = MORNING_MESSAGES[Math.floor(Math.random() * MORNING_MESSAGES.length)];
    const eveningMsg = EVENING_MESSAGES[Math.floor(Math.random() * EVENING_MESSAGES.length)];

    if (remindMorning) {
      const morningId = await Notifications.scheduleNotificationAsync({
        content: {
          title: morningMsg.title,
          subtitle: "PlantApp — Nhắc tưới cây",          // iOS subtitle
          body: morningMsg.body,
          sound: true,
          badge: 1,
          data: { type: "daily_water", slot: "morning" },
          ...(Platform.OS === "android" && {
            channelId: PLANT_CHANNEL_ID,
            color: "#2E7D32",
            priority: "high",
            vibrate: [0, 250, 250, 250],
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 8,
          minute: 0,
        },
      });
      ids.push(morningId);
    }

    if (remindEvening) {
      const eveningId = await Notifications.scheduleNotificationAsync({
        content: {
          title: eveningMsg.title,
          subtitle: "PlantApp — Nhắc tưới cây",          // iOS subtitle
          body: eveningMsg.body,
          sound: true,
          badge: 1,
          data: { type: "daily_water", slot: "evening" },
          ...(Platform.OS === "android" && {
            channelId: PLANT_CHANNEL_ID,
            color: "#1B5E20",
            priority: "high",
            vibrate: [0, 250, 250, 250],
          }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 18,
          minute: 0,
        },
      });
      ids.push(eveningId);
    }

    return ids;
  } catch (e) {
    console.warn("scheduleDailyWaterReminder error:", e);
    return ids;
  }
}

// ─── Hủy nhắc tưới cây ───────────────────────────────────────────────────────
export async function cancelDailyWaterReminder(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.type === "daily_water") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (e) {
    console.warn("cancelDailyWaterReminder error:", e);
  }
}

// ─── Gửi thông báo thử tức thì (nội bộ dev) ──────────────────────────────────
export async function sendInstantTestNotification(treeName?: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💧 Đã đến giờ tưới cây rồi!",
        subtitle: "PlantApp — Thử nghiệm",
        body: treeName
          ? `Cây "${treeName}" đang chờ một ngụm nước. Vào PlantApp chăm sóc ngay nhé! 🌿`
          : "Cây ảo của bạn đang khát nước. Vào PlantApp chăm sóc ngay nhé! 🌿",
        sound: true,
        badge: 1,
        data: { type: "test_water_reminder" },
        ...(Platform.OS === "android" && {
          channelId: PLANT_CHANNEL_ID,
          color: "#2E7D32",
          priority: "high",
        }),
      },
      trigger: null,
    });
  } catch (e) {
    console.warn("sendInstantTestNotification error:", e);
  }
}

// ─── Hủy tất cả thông báo cây ────────────────────────────────────────────────
export async function cancelAllPlantNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.dismissAllNotificationsAsync();
  } catch (e) {
    console.warn("cancelAllPlantNotifications error:", e);
  }
}
