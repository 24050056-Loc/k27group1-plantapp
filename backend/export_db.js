const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function exportDatabase() {
    const config = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    };
    
    console.log(`Dang ket noi den database "${config.database}" tai ${config.host}:${config.port}...`);
    let connection;
    try {
        connection = await mysql.createConnection(config);
    } catch (connError) {
        console.error("❌ Khong the ket noi den co so du lieu. Hay kiem tra MySQL dang chay va dung thong tin dang nhap trong file .env!");
        console.error(connError.message);
        process.exit(1);
    }
    
    let sqlDump = `-- Database Export\n`;
    sqlDump += `-- Host: ${config.host}\n`;
    sqlDump += `-- Database: ${config.database}\n`;
    sqlDump += `-- Exported on: ${new Date().toLocaleString()}\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    try {
        // 1. Lay danh sach tat ca cac bang
        const [tables] = await connection.query('SHOW TABLES');
        const dbNameKey = `Tables_in_${config.database}`;
        
        for (const tableRow of tables) {
            const tableName = tableRow[dbNameKey] || Object.values(tableRow)[0];
            console.log(`- Dang xuat bang: ${tableName}`);
            
            sqlDump += `-- ------------------------------------------------------\n`;
            sqlDump += `-- Table structure for table \`${tableName}\`\n`;
            sqlDump += `-- ------------------------------------------------------\n`;
            sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
            
            // 2. Lay cau truc CREATE TABLE cua bang
            const [createTableResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createTableSql = createTableResult[0]['Create Table'];
            sqlDump += `${createTableSql};\n\n`;
            
            // 3. Lay du lieu trong bang
            sqlDump += `-- Dumping data for table \`${tableName}\`\n`;
            const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
            
            if (rows.length > 0) {
                const columns = Object.keys(rows[0]).map(col => `\`${col}\``).join(', ');
                sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n`;
                
                const valueRows = rows.map(row => {
                    const values = Object.values(row).map(val => {
                        if (val === null) return 'NULL';
                        if (typeof val === 'number') return val;
                        if (typeof val === 'boolean') return val ? 1 : 0;
                        if (val instanceof Date) {
                            return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                        }
                        if (typeof val === 'string') {
                            const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                            return `'${escaped}'`;
                        }
                        if (Buffer.isBuffer(val)) {
                            return `X'${val.toString('hex')}'`;
                        }
                        return `'${val.toString().replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
                    });
                    return `(${values.join(', ')})`;
                });
                
                sqlDump += valueRows.join(',\n') + ';\n\n';
            } else {
                sqlDump += `-- No data found in \`${tableName}\`\n\n`;
            }
        }
        
        sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
        
        const outputPath = path.join(__dirname, 'exported_database.sql');
        fs.writeFileSync(outputPath, sqlDump, 'utf8');
        console.log(`\n✅ Xuat database thanh cong! File luu tai: ${outputPath}`);
    } catch (error) {
        console.error('❌ Da xay ra loi khi xuat database:', error);
    } finally {
        await connection.end();
    }
}

exportDatabase();
