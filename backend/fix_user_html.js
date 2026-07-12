const fs = require('fs');
const path = 'D:/VS Code/PlantShop/PlantShop (1)/frontend (1)/scr/pages/user.html';

let content = fs.readFileSync(path, 'utf8');

const oldBlock = `        const updateData = {
            name: document.getElementById('prof-fullname').value,
            email: document.getElementById('prof-email').value, // Gi\u1eef nguy\u00ean email
            role: user.vai_tro, // Gi\u1eef nguy\u00ean vai tr\u00f2
            status: 'active'
        };

        // Th\u00eam c\u00e1c tr\u01b0\u1eddng m\u1edf r\u1ed9ng n\u1ebfu backend y\u00eau c\u1ea7u c\u1ee5 th\u1ec3 (ho\u1eb7c b\u1ea1n s\u1eeda l\u1ea1i API PUT \u1edf backend \u0111\u1ec3 nh\u1eadn so_dien_thoai/dia_chi)
        // L\u01b0u \u00fd: Route PUT /:id c\u1ee7a b\u1ea1n \u0111ang nh\u1eadn {name, email, role, status}`;

const newBlock = `        const updateData = {
            name: document.getElementById('prof-fullname').value,
            phone: document.getElementById('prof-phone').value,
            address: document.getElementById('prof-address').value
        };`;

if (content.includes(oldBlock)) {
    content = content.replace(oldBlock, newBlock);
    fs.writeFileSync(path, content, 'utf8');
    console.log('SUCCESS: replaced updateData block');
} else {
    // Try without the comment lines
    const oldBlock2 = `        const updateData = {
            name: document.getElementById('prof-fullname').value,
            email: document.getElementById('prof-email').value, // Gi\u1eef nguy\u00ean email
            role: user.vai_tro, // Gi\u1eef nguy\u00ean vai tr\u00f2
            status: 'active'
        };`;
    if (content.includes(oldBlock2)) {
        content = content.replace(oldBlock2, newBlock);
        fs.writeFileSync(path, content, 'utf8');
        console.log('SUCCESS: replaced updateData block (without comments)');
    } else {
        console.log('NOT FOUND - trying regex...');
        // fallback: use regex
        const regex = /const updateData = \{[\s\S]*?status: 'active'\s*\};[\s\S]*?\/\/ L.u .: Route PUT/;
        if (regex.test(content)) {
            content = content.replace(regex, newBlock + '\n\n        // Route PUT');
            fs.writeFileSync(path, content, 'utf8');
            console.log('SUCCESS via regex');
        } else {
            console.log('REGEX also failed');
        }
    }
}
