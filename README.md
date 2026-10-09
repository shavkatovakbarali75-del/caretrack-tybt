# TYBT - Tibbiy Yozuvlarni Boshqarish Tizimi
## CareTrack Clinic

Full stack web ilova: HTML/CSS/JS + Node.js + Express + MySQL

## Ishga tushirish

### 1. MySQL bazasini yaratish
```bash
mysql -u root -p < database.sql
```

### 2. .env faylni sozlash
`.env` faylida MySQL parolingizni kiriting:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sizning_parolingiz
DB_NAME=tybt_db
JWT_SECRET=caretrack_tybt_secret_key_2024
PORT=3000
```

### 3. Serverni ishga tushirish
```bash
cd backend
npm install
npm start
```

Brauzerda oching: http://localhost:3000

### 4. Kirish ma'lumotlari
| Foydalanuvchi | Parol | Rol |
|---|---|---|
| admin | admin123 | Administrator |
| doctor1 | admin123 | Klinitsist |

## Texnologiyalar
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Auth:** JWT (JSON Web Token), bcrypt

## Funksiyalar
- ✅ Shifokor CRUD (yaratish, ko'rish, yangilash, o'chirish)
- ✅ Bemor CRUD (shifokorga biriktirilgan)
- ✅ Kasallik/Tashxis CRUD (bemorga bog'liq, ICD kodi)
- ✅ Bemor to'liq profili (shifokor + kasallik tarixi)
- ✅ Qidirish va filtrlash
- ✅ Rol asosidagi kirish nazorati (Admin / Klinitsist)
- ✅ JWT autentifikatsiya

## Ma'lumotlar modeli
- Shifokor → ko'p Bemorlar (1:N)
- Bemor → bitta Shifokor (N:1)
- Bemor → ko'p Kasalliklar (1:N)
- Kasallik → bitta Bemor (N:1)
