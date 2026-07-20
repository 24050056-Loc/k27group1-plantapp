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

// Mapping tường minh: từ khóa → tên file ảnh
const keywordToImage: { [key: string]: string } = {
  "bàng đài loan": "cay_bang_dai_loan.jpg",
  "bàng dài loan": "cay_bang_dai_loan.jpg",
  "bang dai loan": "cay_bang_dai_loan.jpg",
  "lưỡi hổ": "SnakePlant.jpg",
  "sen đá": "Succulent.jpg",
  "dâu xanh": "CayDauXanh.jpg",
  "dâu da": "CayDauXanh.jpg",
  "xương rồng": "cactus.jpg",
};

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

// Helper để tìm hình ảnh dựa vào tên sản phẩm (dùng cho giỏ hàng)
export function resolveProductImageByName(productName?: string | null) {
  if (!productName || typeof productName !== 'string') return { uri: DEFAULT_REMOTE };

  const inputLower = productName.toLowerCase();

  // 1. Tìm trong keyword mapping với case-insensitive (giữ nguyên dấu)
  for (const [keyword, imageFile] of Object.entries(keywordToImage)) {
    if (inputLower.includes(keyword.toLowerCase())) {
      if (productImages[imageFile]) {
        return productImages[imageFile];
      }
    }
  }

  // 2. Normalize và tìm kiếm: loại bỏ dấu, khoảng trắng, ký tự đặc biệt
  const normalizedInput = productName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu tiếng Việt
    .replace(/\s+/g, '') // Loại bỏ khoảng trắng
    .replace(/[()]/g, '') // Loại bỏ ngoặc tròn
    .replace(/[^a-z0-9]/g, ''); // Loại bỏ ký tự đặc biệt khác

  // Cũng normalize các keyword để so sánh
  for (const [keyword, imageFile] of Object.entries(keywordToImage)) {
    const normalizedKeyword = keyword
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    
    if (normalizedInput.includes(normalizedKeyword)) {
      if (productImages[imageFile]) {
        return productImages[imageFile];
      }
    }
  }

  // 3. Tìm kiếm trong file images: loại bỏ extension và dấu
  for (const imageKey of Object.keys(productImages)) {
    const normalizedKey = imageKey
      .toLowerCase()
      .replace(/\.[^.]+$/, '') // Loại bỏ extension
      .replace(/[-_]/g, '') // Loại bỏ dấu gạch ngang và underscore
      .replace(/\s+/g, ''); // Loại bỏ khoảng trắng

    // So sánh chuỗi đã normalize
    if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
      return productImages[imageKey];
    }
  }

  // Fallback: trả về ảnh mặc định từ Unsplash
  return { uri: DEFAULT_REMOTE };
}

export default productImages;
