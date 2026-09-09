const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { authenticate } = require('@google-cloud/local-auth');

// Đường dẫn tới file client secret
const CLIENT_SECRET_PATH = path.join(
  __dirname,
  ''
);
// Đường dẫn lưu token sau khi đăng nhập thành công lần đầu
const TOKEN_PATH = path.join(__dirname, 'token.json');

// Quyền truy cập: Đọc, ghi và quản lý toàn bộ file trên Google Drive
const SCOPES = ['https://www.googleapis.com/auth/drive'];

/**
 * Khởi tạo OAuth2 client & xác thực người dùng
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CLIENT_SECRET_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = fs.readFileSync(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = fs.readFileSync(CLIENT_SECRET_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  fs.writeFileSync(TOKEN_PATH, payload);
}

// =========================================================================
// CÁC HÀM XỬ LÝ GOOGLE DRIVE API
// =========================================================================

/**
 * 1. LẤY DANH SÁCH FILE TRONG THƯ MỤC CHỈ ĐỊNH
 * @param {google.auth.OAuth2} auth 
 * @param {string} folderId ID của thư mục trên Google Drive
 */
async function listFilesInFolder(auth, folderId) {
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, modifiedTime, size)',
  });

  const files = res.data.files;
  console.log(`\n📁 Danh sách file trong Folder (${folderId}):`);
  if (files.length === 0) {
    console.log('Không có file nào trong thư mục.');
  } else {
    files.forEach((file) => {
      console.log(`- [${file.name}] (ID: ${file.id}) | Type: ${file.mimeType}`);
    });
  }
  return files;
}

/**
 * 2. ĐỌC NỘI DUNG MỘT FILE TEXT (JSON, TXT, CSV...)
 * @param {google.auth.OAuth2} auth 
 * @param {string} fileId ID của file cần đọc
 */
async function readFileContent(auth, fileId) {
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.get({
    fileId: fileId,
    alt: 'media',
  });

  console.log(`\n📄 Nội dung file (${fileId}):`);
  console.log(res.data);
  return res.data;
}

/**
 * 3. CHỈNH SỬA / CẬP NHẬT NỘI DUNG FILE TEXT
 * @param {google.auth.OAuth2} auth 
 * @param {string} fileId ID file cần cập nhật
 * @param {string} newContent Nội dung mới
 */
async function updateFileContent(auth, fileId, newContent) {
  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.update({
    fileId: fileId,
    media: {
      mimeType: 'text/plain',
      body: newContent,
    },
  });

  console.log(`\n✅ Đã cập nhật file thành công! ID: ${res.data.id}`);
  return res.data;
}

/**
 * 4. TẠO FILE MỚI TRONG THƯ MỤC CHỈ ĐỊNH (File Text)
 * @param {google.auth.OAuth2} auth 
 * @param {string} folderId ID thư mục chứa file
 * @param {string} fileName Tên file mới
 * @param {string} content Nội dung file
 */
async function createFileInFolder(auth, folderId, fileName, content) {
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType: 'text/plain',
    body: content,
  };

  const res = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, name',
  });

  console.log(`\n✨ Đã tạo file text mới: ${res.data.name} (ID: ${res.data.id})`);
  return res.data;
}

/**
 * 5. UPLOAD FILE THẬT TỪ MÁY TÍNH LÊN DRIVE (Ảnh, PDF, v.v...)
 * @param {google.auth.OAuth2} auth 
 * @param {string} folderId ID thư mục chứa file
 * @param {string} filePath Đường dẫn tới file trên máy tính của bạn
 */
async function uploadRealFileToFolder(auth, folderId, filePath) {
  const drive = google.drive({ version: 'v3', auth });

  // Lấy tên file từ đường dẫn
  const fileName = path.basename(filePath);

  const fileMetadata = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    body: fs.createReadStream(filePath),
  };

  try {
    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, webViewLink, webContentLink',
    });

    // Cấp quyền public cho file
    await drive.permissions.create({
      fileId: res.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log(`\n🚀 Đã upload file thành công: ${res.data.name} (ID: ${res.data.id})`);
    return res.data;
  } catch (error) {
    console.error('Lỗi khi upload file:', error.message);
    throw error;
  }
}

/**
 * Helper tiện ích: Tự động xác thực và upload file lên Google Drive
 * @param {string} filePath - Đường dẫn file tạm
 * @param {string} [folderId] - ID thư mục Google Drive (mặc định lấy từ cấu hình)
 */
async function uploadFileToDrive(filePath, folderId = '1LwmqPAk9GSPc11C54KBGjuqGV2r7amXe') {
  const auth = await authorize();
  return await uploadRealFileToFolder(auth, folderId, filePath);
}

// =========================================================================
// THỰC THI CHƯƠNG TRÌNH MẪU (Khi chạy trực tiếp node ggdrive.js)
// =========================================================================
async function main() {
  const auth = await authorize();
  const FOLDER_ID = '1LwmqPAk9GSPc11C54KBGjuqGV2r7amXe';
  const filePath = path.join(__dirname, 'src', 'routes', 'auth.js');
  await uploadRealFileToFolder(auth, FOLDER_ID, filePath);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  authorize,
  listFilesInFolder,
  readFileContent,
  updateFileContent,
  createFileInFolder,
  uploadRealFileToFolder,
  uploadFileToDrive,
};