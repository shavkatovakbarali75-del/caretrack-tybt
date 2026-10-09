-- TYBT Database Schema
-- CareTrack Clinic - Tibbiy Yozuvlarni Boshqarish Tizimi

CREATE DATABASE IF NOT EXISTS tybt_db;
USE tybt_db;

-- Foydalanuvchilar jadvali (auth uchun)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'clinician', 'receptionist') NOT NULL DEFAULT 'clinician',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifokorlar jadvali
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bemorlar jadvali
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    birth_date DATE NOT NULL,
    gender ENUM('erkak', 'ayol') NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    doctor_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT
);

-- Kasalliklar/Tashxis jadvali
CREATE TABLE diseases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    icd_code VARCHAR(10) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    severity ENUM('yengil', 'o\'rtacha', 'og\'ir', 'juda og\'ir') NOT NULL,
    patient_id INT NOT NULL,
    diagnosed_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Faoliyat jurnali
CREATE TABLE activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target VARCHAR(100) NOT NULL,
    details VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default foydalanuvchilar (parol: admin123)
INSERT INTO users (username, password, full_name, role) VALUES
('admin', '$2a$10$LV/uofKHUd5FWjNj9gpfOOwNSNgiHnY9HZfToP.jXWgA//lA1f9eG', 'Administrator', 'admin'),
('doctor1', '$2a$10$LV/uofKHUd5FWjNj9gpfOOwNSNgiHnY9HZfToP.jXWgA//lA1f9eG', 'Dr. Aliyev', 'clinician');

-- Namuna shifokorlar
INSERT INTO doctors (full_name, specialization, department, phone, email) VALUES
('Dr. Karimov Jasur', 'Kardiologiya', 'Yurak bo\'limi', '+998901234567', 'karimov@caretrack.uz'),
('Dr. Rahimova Nilufar', 'Nevrologiya', 'Nerv bo\'limi', '+998901234568', 'rahimova@caretrack.uz'),
('Dr. Toshmatov Sardor', 'Dermatologiya', 'Teri bo\'limi', '+998901234569', 'toshmatov@caretrack.uz');

-- Namuna bemorlar
INSERT INTO patients (full_name, birth_date, gender, phone, address, doctor_id) VALUES
('Aliyev Bobur', '1990-05-15', 'erkak', '+998901111111', 'Toshkent, Chilonzor', 1),
('Karimova Madina', '1985-08-22', 'ayol', '+998902222222', 'Toshkent, Yunusobod', 2),
('Hasanov Timur', '1978-12-03', 'erkak', '+998903333333', 'Samarqand, Registon', 1);

-- Namuna kasalliklar
INSERT INTO diseases (icd_code, name, description, severity, patient_id, diagnosed_date) VALUES
('I25.1', 'Yurak ishemik kasalligi', 'Surunkali ishemik yurak kasalligi', 'o\'rtacha', 1, '2024-01-15'),
('G43.9', 'Migren', 'Takrorlanuvchi bosh og\'rig\'i', 'yengil', 2, '2024-02-20'),
('I10', 'Gipertoniya', 'Birlamchi arterial gipertoniya', 'og\'ir', 3, '2024-03-10');
