const pool = require('../src/db.js');

const COMBOS = [
  {
    key: "sk1",
    name: "Starter Kit Nhiệt Đới",
    description: "Cây giống Xoài Cát + Đất trồng cao cấp + Chậu sứ cao cấp",
    originalPrice: 450000,
    salePrice: 349000,
    discount: 22,
    emoji: "🌴",
    tag: "Bán chạy",
    tagColor: "#F4A261",
    gradientFrom: "#1B4332",
    gradientTo: "#2D6A4F",
    bgImage: "https://images.unsplash.com/photo-1587830736921-5b4a0cae0266?w=800&fit=crop",
    items: ["🌿 Cây giống Xoài Cát", "🌱 Đất trồng 5L", "🪴 Chậu sứ Ø20cm"],
  },
  {
    key: "sk2",
    name: "Starter Kit Mini Cactus",
    description: "3 cây Xương rồng + Đất cát + Bộ chậu mini siêu cute",
    originalPrice: 280000,
    salePrice: 199000,
    discount: 29,
    emoji: "🌵",
    tag: "Mới nhất",
    tagColor: "#2E7D32",
    gradientFrom: "#7B4E2E",
    gradientTo: "#C27A4A",
    bgImage: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&fit=crop",
    items: ["🌵 3 cây Xương rồng", "🌱 Đất cát 2L", "🪴 Bộ chậu 3 cái"],
  },
  {
    key: "sk3",
    name: "Starter Kit Thảo Mộc",
    description: "Bộ 5 cây thảo mộc + Đất hữu cơ + Chậu tái chế xanh",
    originalPrice: 390000,
    salePrice: 289000,
    discount: 26,
    emoji: "🌿",
    tag: "Tiết kiệm",
    tagColor: "#558B2F",
    gradientFrom: "#1A3A2A",
    gradientTo: "#386641",
    bgImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&fit=crop",
    items: ["🌿 5 cây thảo mộc", "🌱 Đất hữu cơ 3L", "🪴 Chậu tái chế xanh"],
  },
  {
    key: "sk4",
    name: "Starter Kit Hoa Phòng Khách",
    description: "Hoa Hướng Dương + Đất giàu dinh dưỡng + Chậu gốm trang trí",
    originalPrice: 520000,
    salePrice: 399000,
    discount: 23,
    emoji: "🌻",
    tag: "Hot Deal",
    tagColor: "#E53935",
    gradientFrom: "#4A2600",
    gradientTo: "#9C5A00",
    bgImage: "https://images.unsplash.com/photo-1490750967868-88df5691cc4a?w=800&fit=crop",
    items: ["🌻 Hoa Hướng Dương", "🌱 Đất hữu cơ cao cấp", "🪴 Chậu gốm trang trí"],
  },
];

async function run() {
  console.log("--- BẮT ĐẦU CẬP NHẬT DATABASE CHO COMBO ---");

  // 1. Thêm các cột cho bảng products nếu chưa có
  const [columns] = await pool.query("SHOW COLUMNS FROM products");
  const columnNames = columns.map((c) => c.Field);

  if (!columnNames.includes("is_combo")) {
    console.log("Thêm cột is_combo...");
    await pool.query("ALTER TABLE products ADD COLUMN is_combo TINYINT(1) DEFAULT 0");
  }
  if (!columnNames.includes("original_price")) {
    console.log("Thêm cột original_price...");
    await pool.query("ALTER TABLE products ADD COLUMN original_price DECIMAL(10,2) DEFAULT NULL");
  }
  if (!columnNames.includes("discount_percent")) {
    console.log("Thêm cột discount_percent...");
    await pool.query("ALTER TABLE products ADD COLUMN discount_percent INT DEFAULT 0");
  }
  if (!columnNames.includes("combo_items")) {
    console.log("Thêm cột combo_items...");
    await pool.query("ALTER TABLE products ADD COLUMN combo_items JSON DEFAULT NULL");
  }

  // 2. Đảm bảo có danh mục 'Combo Starter Kit'
  const [catRows] = await pool.query(
    "SELECT id FROM categories WHERE ten_danh_muc LIKE '%Combo%' LIMIT 1"
  );
  let categoryId;
  if (catRows.length > 0) {
    categoryId = catRows[0].id;
    console.log(`Đã tìm thấy danh mục Combo với ID: ${categoryId}`);
  } else {
    console.log("Tạo danh mục Combo Starter Kit...");
    const [res] = await pool.query(
      "INSERT INTO categories (ten_danh_muc, mo_ta) VALUES (?, ?)",
      ["Combo Starter Kit", "Các gói combo cây trồng tiết kiệm trọn bộ bao gồm cây giống, đất trồng và chậu cảnh"]
    );
    categoryId = res.insertId;
    console.log(`Đã tạo danh mục Combo với ID: ${categoryId}`);
  }

  // 3. Chèn / cập nhật các combo vào bảng products
  const comboResults = [];
  for (const combo of COMBOS) {
    const [existing] = await pool.query(
      "SELECT id FROM products WHERE ten_san_pham = ? LIMIT 1",
      [combo.name]
    );

    const dacTinhObj = {
      is_combo: true,
      key: combo.key,
      emoji: combo.emoji,
      tag: combo.tag,
      tagColor: combo.tagColor,
      gradientFrom: combo.gradientFrom,
      gradientTo: combo.gradientTo,
      items: combo.items,
      originalPrice: combo.originalPrice,
      salePrice: combo.salePrice,
      discount: combo.discount
    };

    let productId;
    if (existing.length > 0) {
      productId = existing[0].id;
      console.log(`Cập nhật combo "${combo.name}" (ID: ${productId})...`);
      await pool.query(
        `UPDATE products SET 
          category_id = ?,
          mo_ta = ?,
          gia_tien = ?,
          so_luong_kho = 100,
          hinh_anh_url = ?,
          dang_kinh_doanh = 1,
          dac_tinh = ?,
          is_combo = 1,
          original_price = ?,
          discount_percent = ?,
          combo_items = ?
        WHERE id = ?`,
        [
          categoryId,
          combo.description,
          combo.salePrice,
          combo.bgImage,
          JSON.stringify(dacTinhObj),
          combo.originalPrice,
          combo.discount,
          JSON.stringify(combo.items),
          productId
        ]
      );
    } else {
      console.log(`Thêm mới combo "${combo.name}"...`);
      const [insertRes] = await pool.query(
        `INSERT INTO products 
          (category_id, ten_san_pham, ten_khoa_hoc, mo_ta, gia_tien, so_luong_kho, hinh_anh_url, dang_kinh_doanh, dac_tinh, is_combo, original_price, discount_percent, combo_items) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          categoryId,
          combo.name,
          "Plant Combo Kit",
          combo.description,
          combo.salePrice,
          100,
          combo.bgImage,
          1,
          JSON.stringify(dacTinhObj),
          1,
          combo.originalPrice,
          combo.discount,
          JSON.stringify(combo.items)
        ]
      );
      productId = insertRes.insertId;
      console.log(`Đã thêm combo "${combo.name}" với ID: ${productId}`);
    }

    comboResults.push({
      key: combo.key,
      name: combo.name,
      product_id: productId,
      price: combo.salePrice
    });
  }

  console.log("\n--- KẾT QUẢ ĐỒNG BỘ COMBO VÀO DATABASE ---");
  console.table(comboResults);

  process.exit(0);
}

run().catch((err) => {
  console.error("Lỗi khi chạy migration combo:", err);
  process.exit(1);
});
