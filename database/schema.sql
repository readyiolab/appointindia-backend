-- AppointIndia job portal schema (matches Backend repositories)

CREATE DATABASE IF NOT EXISTS job_portal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE job_portal;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('candidate', 'recruiter', 'company_admin', 'admin') NOT NULL,
  status ENUM('pending', 'active', 'suspended', 'locked') DEFAULT 'pending',
  email_verified TINYINT(1) DEFAULT 0,
  failed_login_attempts INT DEFAULT 0,
  lock_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  deleted_by CHAR(36) NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_role_status (role, status)
);

CREATE TABLE IF NOT EXISTS companies (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  industry VARCHAR(255),
  size ENUM('1-10', '11-50', '51-200', '201-500', '500+') NOT NULL DEFAULT '1-10',
  location VARCHAR(255),
  description TEXT,
  logo_url VARCHAR(500),
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36)
);

CREATE TABLE IF NOT EXISTS recruiters (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  company_id CHAR(36) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  designation VARCHAR(255),
  phone VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  INDEX idx_recruiters_user (user_id)
);

CREATE TABLE IF NOT EXISTS candidates (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  headline VARCHAR(255),
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') NULL,
  date_of_birth DATE NULL,
  current_location VARCHAR(100),
  preferred_location VARCHAR(100),
  total_experience_years INT DEFAULT 0,
  current_salary DECIMAL(12, 2) NULL,
  expected_salary DECIMAL(12, 2) NULL,
  summary TEXT,
  profile_completion_pct INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_candidates_user (user_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  recruiter_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT NOT NULL,
  job_type ENUM('full_time', 'part_time', 'contract', 'internship', 'freelance') NOT NULL,
  work_mode ENUM('remote', 'hybrid', 'onsite') NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  min_salary DECIMAL(12, 2),
  max_salary DECIMAL(12, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  min_experience_years INT DEFAULT 0,
  max_experience_years INT DEFAULT 15,
  posted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  status ENUM('draft', 'published', 'closed', 'paused') DEFAULT 'draft',
  application_count INT DEFAULT 0,
  is_featured TINYINT(1) DEFAULT 0,
  search_vector TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
  INDEX idx_jobs_status_posted (status, posted_at, expires_at)
);

CREATE TABLE IF NOT EXISTS resumes (
  id CHAR(36) PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  file_name VARCHAR(255),
  s3_key VARCHAR(500),
  file_type VARCHAR(100),
  file_size BIGINT,
  checksum VARCHAR(128),
  virus_scan_status ENUM('pending', 'clean', 'infected', 'failed') DEFAULT 'pending',
  is_primary TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE TABLE IF NOT EXISTS job_applications (
  id CHAR(36) PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  resume_id CHAR(36) NULL,
  status ENUM('applied', 'screening', 'shortlisted', 'interview_scheduled', 'rejected', 'hired') DEFAULT 'applied',
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  recruiter_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (resume_id) REFERENCES resumes(id),
  UNIQUE KEY uq_job_candidate (job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS saved_jobs (
  id CHAR(36) PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  job_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (job_id) REFERENCES jobs(id),
  UNIQUE KEY uq_saved_job (candidate_id, job_id)
);

CREATE TABLE IF NOT EXISTS interviews (
  id CHAR(36) PRIMARY KEY,
  application_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  recruiter_id CHAR(36) NOT NULL,
  scheduled_at DATETIME NOT NULL,
  mode VARCHAR(50),
  location VARCHAR(255),
  status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  FOREIGN KEY (application_id) REFERENCES job_applications(id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  FOREIGN KEY (recruiter_id) REFERENCES recruiters(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notifications_user (user_id, is_read, created_at)
);

CREATE TABLE IF NOT EXISTS plans (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) DEFAULT 0,
  duration_days INT DEFAULT 30,
  features JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id CHAR(36) PRIMARY KEY,
  recruiter_id CHAR(36) NOT NULL,
  plan_id CHAR(36) NOT NULL,
  status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
  started_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by CHAR(36),
  updated_by CHAR(36),
  FOREIGN KEY (recruiter_id) REFERENCES recruiters(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  replaced_by CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_tokens_user (user_id)
);
