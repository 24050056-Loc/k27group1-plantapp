// Auto-generated mapping of product image filenames to local assets
// Import images with static requires so React Native bundler can include them

const productImages: { [key: string]: any } = {
  "BuoiDaXanh.jpg": require('../../assets/products/BuoiDaXanh.jpg'),
  "cactus.jpg": require('../../assets/products/cactus.jpg'),
  "CamSanh.jpg": require('../../assets/products/CamSanh.jpg'),
  "CayCaNaThai.jpg": require('../../assets/products/CayCaNaThai.jpg'),
  "CayChanhGiay.jpg": require('../../assets/products/CayChanhGiay.jpg'),
  "CayDauXanh.jpg": require('../../assets/products/CayDauXanh.jpg'),
  "CayHongQuan.jpg": require('../../assets/products/CayHongQuan.jpg'),
  "CayMangCut.jpg": require('../../assets/products/CayMangCut.jpg'),
  "CaySoRi.jpg": require('../../assets/products/CaySoRi.jpg'),
  "cay_bang_dai_loan.jpg": require('../../assets/products/cay_bang_dai_loan.jpg'),
  "Cay_Ca_Chua.jpg": require('../../assets/products/Cay_Ca_Chua.jpg'),
  "Chanh_Day.jpg": require('../../assets/products/Chanh_Day.jpg'),
  "ChomChomThai.jpg": require('../../assets/products/ChomChomThai.jpg'),
  "DuaXiemLun.jpg": require('../../assets/products/DuaXiemLun.jpg'),
  "Huong-Duong.jpg": require('../../assets/products/Huong-Duong.jpg'),
  "MangCauXiem.jpg": require('../../assets/products/MangCauXiem.jpg'),
  "MitThai.jpg": require('../../assets/products/MitThai.jpg'),
  "NhanIdo.jpg": require('../../assets/products/NhanIdo.jpg'),
  "Ot_Chi_Thien.jpg": require('../../assets/products/Ot_Chi_Thien.jpg'),
  "SauRiengRi6.jpg": require('../../assets/products/SauRiengRi6.jpg'),
  "SnakePlant.jpg": require('../../assets/products/SnakePlant.jpg'),
  "Succulent.jpg": require('../../assets/products/Succulent.jpg'),
  "VuSuaLoRen.jpg": require('../../assets/products/VuSuaLoRen.jpg'),
  "XoaiCat.jpg": require('../../assets/products/XoaiCat.jpg')
};

const DEFAULT_REMOTE = 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=300&fit=crop';

export function resolveProductImage(urlPath?: string | null) {
  if (!urlPath) return { uri: DEFAULT_REMOTE };
  if (typeof urlPath !== 'string') return { uri: DEFAULT_REMOTE };
  if (urlPath.startsWith('http')) return { uri: urlPath };

  // Extract filename and try to match (case-insensitive)
  const parts = urlPath.split('/');
  const name = parts[parts.length - 1];
  const key = Object.keys(productImages).find(k => k.toLowerCase() === name.toLowerCase());
  if (key) return productImages[key];

  // Fallback to remote default
  return { uri: DEFAULT_REMOTE };
}

export default productImages;
