-- Create database for akademik system
CREATE DATABASE akademik_db;
CREATE USER akademik_user WITH ENCRYPTED PASSWORD 'akademik_pass';
GRANT ALL PRIVILEGES ON DATABASE akademik_db TO akademik_user;

-- Connect to the database
\c akademik_db;

-- Create basic tables structure
CREATE SCHEMA IF NOT EXISTS public;

-- Users table (synced from Zitadel)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    zitadel_user_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles relationship
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('dosen', 'Dosen/Lecturer role'),
('mahasiswa', 'Student role'),
('admin_akademik', 'Academic administrator'),
('kaprodi', 'Program head');

-- Mata kuliah table
CREATE TABLE mata_kuliah (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(255) NOT NULL,
    sks INTEGER NOT NULL,
    semester INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kelas table
CREATE TABLE kelas (
    id SERIAL PRIMARY KEY,
    mata_kuliah_id INTEGER REFERENCES mata_kuliah(id),
    dosen_id UUID REFERENCES users(id),
    nama_kelas VARCHAR(50) NOT NULL,
    tahun_akademik VARCHAR(20) NOT NULL,
    semester VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mahasiswa kelas relationship
CREATE TABLE mahasiswa_kelas (
    id SERIAL PRIMARY KEY,
    mahasiswa_id UUID REFERENCES users(id),
    kelas_id INTEGER REFERENCES kelas(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(mahasiswa_id, kelas_id)
);

-- Kehadiran table
CREATE TABLE kehadiran (
    id SERIAL PRIMARY KEY,
    mahasiswa_id UUID REFERENCES users(id),
    kelas_id INTEGER REFERENCES kelas(id),
    pertemuan INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('hadir', 'tidak_hadir', 'izin', 'sakit')),
    tanggal DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nilai table
CREATE TABLE nilai (
    id SERIAL PRIMARY KEY,
    mahasiswa_id UUID REFERENCES users(id),
    kelas_id INTEGER REFERENCES kelas(id),
    jenis_nilai VARCHAR(50) NOT NULL,
    nilai DECIMAL(5,2),
    bobot DECIMAL(3,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_zitadel_user_id ON users(zitadel_user_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_kehadiran_mahasiswa_kelas ON kehadiran(mahasiswa_id, kelas_id);
CREATE INDEX idx_nilai_mahasiswa_kelas ON nilai(mahasiswa_id, kelas_id);
