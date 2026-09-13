/**
 * SCRIPT ỦY QUYỀN GOOGLE DRIVE ĐỘC LẬP
 * Chạy lệnh: node setup_drive_token.js
 * 
 * Script này sẽ mở trình duyệt để bạn đăng nhập tài khoản Google và cấp quyền truy cập Google Drive.
 * Sau khi đăng nhập thành công, file 'token.json' sẽ được tạo tự động trong backend.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { google } = require('googleapis');

const CLIENT_SECRET_PATH = path.join(__dirname, 'client.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/drive'];

async function runAuth() {
  if (!fs.existsSync(CLIENT_SECRET_PATH)) {
    console.error("❌ Không tìm thấy file client.json trong thư mục backend!");
    process.exit(1);
  }

  const content = fs.readFileSync(CLIENT_SECRET_PATH);
  const keys = JSON.parse(content);
  const key = keys.web || keys.installed;

  if (!key) {
    console.error("❌ File client.json không hợp lệ (thiếu mục 'web' hoặc 'installed')!");
    process.exit(1);
  }

  // Sử dụng redirect URI cấu hình trong client.json hoặc cổng 8080 nếu chạy độc lập
  const redirectUri = (key.redirect_uris && key.redirect_uris[0]) || 'http://localhost:8080/oauth2callback';
  const urlObj = new URL(redirectUri);
  const port = Number(urlObj.port) || 8080;

  const oauth2Client = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    redirectUri
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\n======================================================');
  console.log('🔗 HƯỚNG DẪN ỦY QUYỀN GOOGLE DRIVE:');
  console.log('1. Hãy mở đường link sau trong trình duyệt:');
  console.log('\n' + authUrl + '\n');
  console.log('2. Đăng nhập tài khoản Google và bấm "Cho phép" (Allow).');
  console.log(`3. Đang lắng nghe phản hồi tại cổng ${port}...`);
  console.log('======================================================\n');

  // Khởi tạo temporary HTTP server để bắt mã code trả về
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith(urlObj.pathname)) {
        const queryParams = new URL(req.url, `http://localhost:${port}`).searchParams;
        const code = queryParams.get('code');

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>✅ Xác thực thành công!</h1><p>File token.json đã được tạo. Bạn có thể đóng tab này lại và khởi động server bình thường.</p>');

          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          const payload = JSON.stringify({
            type: 'authorized_user',
            client_id: key.client_id,
            client_secret: key.client_secret,
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token,
          }, null, 2);

          fs.writeFileSync(TOKEN_PATH, payload);
          console.log('\n🎉 ĐÃ TẠO FILE token.json THÀNH CÔNG!');
          console.log('Giờ đây backend của bạn đã có thể tải ảnh trực tiếp lên Google Drive vĩnh viễn!\n');

          server.close();
          process.exit(0);
        }
      }
    } catch (e) {
      console.error('❌ Lỗi xác thực token:', e.message);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Lỗi xác thực: ' + e.message);
      server.close();
      process.exit(1);
    }
  });

  server.listen(port, () => {
    // Tự động mở trình duyệt nếu có thể
    const { exec } = require('child_process');
    const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
    exec(`${startCmd} "${authUrl}"`).unref();
  });
}

runAuth();
