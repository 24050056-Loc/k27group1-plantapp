const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TABLE_META = [
  { table: 'users', num: 1, name: 'BẢNG NGƯỜI DÙNG (USERS)' },
  { table: 'categories', num: 2, name: 'BẢNG DANH MỤC SẢN PHẨM (CATEGORIES)' },
  { table: 'products', num: 3, name: 'BẢNG SẢN PHẨM (PRODUCTS)' },
  { table: 'coupons', num: 4, name: 'BẢNG MÃ GIẢM GIÁ (COUPONS)' },
  { table: 'promotional_events', num: 5, name: 'BẢNG SỰ KIỆN KHUYẾN MÃI (PROMOTIONAL_EVENTS)' },
  { table: 'user_coupons', num: 6, name: 'BẢNG MÃ GIẢM GIÁ CỦA NGƯỜI DÙNG (USER_COUPONS)' },
  { table: 'event_progress', num: 7, name: 'BẢNG TIẾN TRÌNH SỰ KIỆN (EVENT_PROGRESS)' },
  { table: 'orders', num: 8, name: 'BẢNG ĐƠN HÀNG (ORDERS)' },
  { table: 'order_items', num: 9, name: 'BẢNG CHI TIẾT ĐƠN HÀNG (ORDER_ITEMS)' },
  { table: 'order_status_history', num: 10, name: 'BẢNG LỊCH SỬ TRẠNG THÁI ĐƠN HÀNG (ORDER_STATUS_HISTORY)' },
  { table: 'cart', num: 11, name: 'BẢNG GIỎ HÀNG (CART)' },
  { table: 'wishlist', num: 12, name: 'BẢNG DANH SÁCH YÊU THÍCH (WISHLIST)' },
  { table: 'product_reviews', num: 13, name: 'BẢNG ĐÁNH GIÁ SẢN PHẨM (PRODUCT_REVIEWS)' },
  { table: 'plant_diagnoses', num: 14, name: 'BẢNG CHẨN ĐOÁN BỆNH CÂY (PLANT_DIAGNOSES)' },
  { table: 'care_reminders', num: 15, name: 'BẢNG NHẮC NHỞ CHĂM SÓC CÂY (CARE_REMINDERS)' },
  { table: 'user_garden', num: 16, name: 'BẢNG VƯỜN CỦA TÔI (USER_GARDEN)' },
  { table: 'users_points', num: 17, name: 'BẢNG ĐIỂM THƯỞNG TÍCH LŨY (USERS_POINTS)' },
  { table: 'virtual_plants', num: 18, name: 'BẢNG TRỒNG CÂY ẢO MINIGAME (VIRTUAL_PLANTS)' },
  { table: 'explore_posts', num: 19, name: 'BẢNG BÀI VIẾT KHÁM PHÁ (EXPLORE_POSTS)' },
  { table: 'explore_comments', num: 20, name: 'BẢNG BÌNH LUẬN BÀI VIẾT (EXPLORE_COMMENTS)' },
  { table: 'explore_likes', num: 21, name: 'BẢNG LƯỢT THÍCH BÀI VIẾT (EXPLORE_LIKES)' },
  { table: 'chat_history', num: 22, name: 'BẢNG LỊCH SỬ CHAT AI (CHAT_HISTORY)' },
  { table: 'blogs', num: 23, name: 'BẢNG BÀI VIẾT BLOG CẨM NANG (BLOGS)' },
];

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : 'NULL';
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  if (Buffer.isBuffer(val)) {
    return `X'${val.toString('hex')}'`;
  }
  if (typeof val === 'object') {
    // JSON or other object
    const str = JSON.stringify(val);
    const escaped = str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${escaped}'`;
  }
  // String or date string (since dateStrings: true)
  const str = String(val);
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `'${escaped}'`;
}

async function run() {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    dateStrings: true,
  };

  console.log(`Connecting to ${config.database}...`);
  const connection = await mysql.createConnection(config);

  const [dbTables] = await connection.query('SHOW TABLES');
  const allDbTableNames = dbTables.map((t) => Object.values(t)[0]);
  console.log(`Found ${allDbTableNames.length} tables in database.`);

  let sql = `-- =========================================================================\n`;
  sql += `-- KHỞI TẠO CƠ SỞ DỮ LIỆU CỦA PLANT SHOP (TỔNG HỢP TOÀN BỘ DỮ LIỆU THỰC TẾ)\n`;
  sql += `-- Ngày xuất: ${new Date().toLocaleString('vi-VN')}\n`;
  sql += `-- =========================================================================\n`;
  sql += `CREATE DATABASE IF NOT EXISTS \`${config.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
  sql += `USE \`${config.database}\`;\n\n`;

  sql += `-- Tắt tạm thời kiểm tra khóa ngoại và thiết lập charset utf8mb4\n`;
  sql += `SET NAMES utf8mb4;\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  sql += `-- Xóa tất cả các bảng cũ để làm mới cấu trúc\n`;
  for (const item of TABLE_META) {
    sql += `DROP TABLE IF EXISTS \`${item.table}\`;\n`;
  }
  // Any extra table in db not in TABLE_META
  for (const t of allDbTableNames) {
    if (!TABLE_META.find((m) => m.table === t)) {
      sql += `DROP TABLE IF EXISTS \`${t}\`;\n`;
    }
  }

  sql += `\n`;

  // Process all tables
  const tablesToExport = [...TABLE_META];
  for (const t of allDbTableNames) {
    if (!tablesToExport.find((m) => m.table === t)) {
      tablesToExport.push({ table: t, num: tablesToExport.length + 1, name: `BẢNG \`${t.toUpperCase()}\`` });
    }
  }

  for (const item of tablesToExport) {
    const tableName = item.table;
    console.log(`Exporting table: ${tableName}`);

    sql += `-- =========================================================================\n`;
    sql += `-- ${item.num}. ${item.name}\n`;
    sql += `-- =========================================================================\n`;

    // 1. CREATE TABLE statement
    const [ctRes] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    const createTableSql = ctRes[0]['Create Table'];
    sql += `${createTableSql};\n\n`;

    // 2. Data
    const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      sql += `-- Dữ liệu hiện có cho bảng \`${tableName}\` (${rows.length} bản ghi)\n`;
      const cols = Object.keys(rows[0]).map((c) => `\`${c}\``).join(', ');
      sql += `INSERT INTO \`${tableName}\` (${cols}) VALUES\n`;

      const rowStrings = rows.map((row) => {
        const vals = Object.values(row).map(escapeValue);
        return `(${vals.join(', ')})`;
      });

      sql += rowStrings.join(',\n') + ';\n\n\n';
    } else {
      sql += `-- (Chưa có dữ liệu cho bảng \`${tableName}\`)\n\n\n`;
    }
  }

  sql += `-- =========================================================================\n`;
  sql += `-- BẬT LẠI KIỂM TRA KHÓA NGOẠI VÀ HOÀN TẤT NẠP DỮ LIỆU\n`;
  sql += `-- =========================================================================\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 1;\n\n`;

  const targetFile = path.resolve(__dirname, '../../db.New.sql');
  fs.writeFileSync(targetFile, sql, 'utf8');
  console.log(`✅ Đã xuất toàn bộ dữ liệu thành công vào: ${targetFile}`);

  await connection.end();
}

run().catch((err) => {
  console.error('Lỗi khi chạy script:', err);
  process.exit(1);
});
