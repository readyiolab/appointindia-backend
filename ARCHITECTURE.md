# Production-Grade Job Portal Backend Architecture

## 1. Executive Summary

This document defines a production-grade, scalable, and enterprise-ready backend for a job portal platform similar to Naukri / LinkedIn Jobs / Indeed. The system is designed for:

- **Candidates**, **Recruiters**, **Companies**, and **Admins**
- **High read throughput** for job search and profile browsing
- **Write-heavy** workflows such as applications, resume uploads, notifications, and interviews
- **Secure, auditable, and compliant** backend operations
- **Horizontal scalability** with stateless API services
- **Queue-ready** and **event-driven** architecture for background processing

### Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL 8.x
- **Cache:** Redis
- **Storage:** AWS S3
- **Auth:** JWT access + refresh tokens with rotation
- **Validation:** Zod (recommended) or Joi
- **Logging:** Winston
- **API Documentation:** Swagger/OpenAPI
- **Process Manager:** PM2
- **Containerization:** Docker
- **Reverse Proxy:** Nginx
- **Deployment:** AWS EC2
- **CI/CD:** GitHub Actions / GitLab CI

---

## 2. Target Platform Capabilities

### Core Capabilities

- Candidate registration, onboarding, profile management, and resume upload
- Recruiter and company management
- Job posting, publishing, editing, and closing
- Advanced job search, filtering, sorting, and ranking
- Job application, shortlisting, and interview scheduling
- Saved jobs and job alerts
- Notifications via email / push / in-app
- Admin controls for moderation, analytics, billing, and user governance
- Subscription and payment readiness
- Audit logs and compliance tracking
- Metrics and analytics for recruitment performance

### Non-Functional Requirements

- **Scalability:** horizontal scaling across multiple EC2 instances
- **Availability:** multi-AZ MySQL and Redis replication in production
- **Performance:** cache-first read paths and indexed search queries
- **Security:** RBAC, JWT, rate limiting, secure uploads, input validation
- **Observability:** structured logs, request tracing, health checks, metrics
- **Maintainability:** modular structure, clean architecture, repository pattern

---

## 3. High-Level Architecture

### 3.1 Logical Architecture

```text
Client Applications (Web / Mobile / Recruiter Portal / Admin Portal)
        |
        v
Nginx + SSL Termination
        |
        v
Load Balancer (AWS ALB / Nginx if single instance)
        |
        v
Node.js Express API Cluster (PM2 on EC2)
   |        |         |
   |        |         +--> Background Workers / Queue Consumer
   |        |
   |        +--> Redis Cache / PubSub / Rate Limiting
   |
   +--> MySQL Primary / Replica
   |
   +--> AWS S3 for resume and document storage
   |
   +--> SES / SNS / Push Notification Provider
```

### 3.2 Clean Architecture Layers

```text
Presentation Layer
- Controllers
- Routes
- Swagger docs
- Request/response DTOs

Application Layer
- Services
- Use cases
- Validation orchestration
- Transaction orchestration

Domain Layer
- Entities / business rules
- Permission rules
- Audit events

Infrastructure Layer
- Repository implementations
- MySQL pool
- Redis cache
- S3 client
- Queue publisher
- Logger
```

### 3.3 Vertical Slices by Modules

Each feature module should follow:

```text
modules/<module>/
  controllers/
  routes/
  services/
  repositories/
  validators/
  dto/
  constants/
  tests/
```

This keeps the system modular and allows future extraction into microservices.

---

## 4. Enterprise Folder Structure

```text
src/
  app.js
  server.js
  config/
    env.js
    mysql.js
    redis.js
    aws.js
    swagger.js
    logger.js
    cors.js
    rateLimit.js
    helmet.js
  common/
    constants/
    enums/
    errors/
    utils/
    response.js
    audit.js
    retry.js
    id.js
    pagination.js
  database/
    migrations/
    seeds/
    schema.sql
    mysqlPool.js
    transaction.js
  middleware/
    auth.js
    authorize.js
    validate.js
    errorHandler.js
    requestLogger.js
    rateLimiter.js
    upload.js
    tenant.js
  modules/
    auth/
    users/
    candidates/
    recruiters/
    companies/
    jobs/
    applications/
    resumes/
    notifications/
    admins/
    analytics/
    subscriptions/
    savedJobs/
    interviews/
  repositories/
    mysql/
    cache
  services/
    email.js
    notification.js
    upload.js
    search.js
    analytics.js
    payment.js
  jobs/
    queue.js
    workers/
    handlers/
    schedule.js
  routes/
    v1/
      auth.routes.js
      users.routes.js
      jobs.routes.js
      applications.routes.js
      resumes.routes.js
      notifications.routes.js
      admins.routes.js
      analytics.routes.js
      subscriptions.routes.js
      interviews.routes.js
  cache/
    keys.js
    strategies.js
  docs/
    swagger.yaml
  logs/
    app.log
  tests/
    unit/
    integration/
    contract/
  scripts/
    setup.sh
    seed.js
    backup.sh
  docker/
    Dockerfile
    docker-compose.yml
    nginx.conf
  .env.example
  package.json
  pm2.config.js
```

---

## 5. API Standards

### 5.1 Versioning

- Base path: `/api/v1`
- Future versions: `/api/v2`

### 5.2 Standard Response Format

```json
{
  "success": true,
  "message": "Job fetched successfully",
  "data": {},
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-05-25T12:00:00Z"
  },
  "errors": []
}
```

### 5.3 HTTP Status Guidelines

- `200` success
- `201` created
- `204` no content
- `400` validation / bad request
- `401` unauthenticated
- `403` forbidden
- `404` not found
- `409` conflict
- `429` rate limited
- `500` internal server error

### 5.4 Standard Error Format

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "reason": "Invalid email format"
    }
  ],
  "requestId": "uuid"
}
```

---

## 6. Authentication and Security Architecture

### 6.1 Authentication Flow

1. User signs in with email/password.
2. Backend validates credentials and issues:
   - `accessToken` (short-lived, e.g., 15m)
   - `refreshToken` (long-lived, e.g., 30d)
3. Refresh token is rotated on each use.
4. JWT contains userId, role, tenant, and permissions.
5. Redis stores refresh token metadata for revocation and rotation.

### 6.2 Security Controls

- **Password hashing:** bcrypt / argon2
- **JWT signing:** RS256 or HS256 (RS256 preferred)
- **Refresh token rotation:** revoke old token, store new token hash
- **Role-based access control:** admin, recruiter, company_admin, candidate
- **Rate limiting:** per-IP and per-user with Redis-backed limiter
- **Helmet:** secure headers
- **CORS:** restricted origins
- **SQL injection prevention:** parameterized queries only
- **XSS prevention:** sanitize input; escape response output where required
- **CSRF protection:** enforce same-site cookie strategy if cookies are used
- **Brute-force protection:** lock account after failed attempts
- **File security:** MIME validation, file size limit, antivirus / malware scan integration
- **Secrets management:** AWS Secrets Manager or environment variables

### 6.3 RBAC Model

```text
admin
  - full platform control
company_admin
  - manage company and recruiters
recruiter
  - create/manage jobs and candidates
candidate
  - apply, save jobs, manage profile
```

### 6.4 OTP / Verification Flow

- Sign up sends OTP email
- OTP stored in Redis with TTL
- Verify OTP before account activation
- Password reset uses OTP and token rotation

---

## 7. Database Architecture (MySQL)

### 7.1 Core Design Principles

- Normalize core entities
- Use **UUID** as primary identifier for distributed safety
- Add `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`
- Use `soft delete` to preserve historical records
- Use **foreign keys** for integrity
- Add **composite indexes** for search and filtering
- Use replication in production for read scaling

### 7.2 UUID Strategy

Use `CHAR(36)` or `BINARY(16)`.

**Recommended:** `BINARY(16)` for performance, and store converted UUID externally.

### 7.3 Soft Delete Strategy

All major tables should have:

- `deleted_at DATETIME NULL`
- `deleted_by VARCHAR(36) NULL`
- `is_active TINYINT(1) DEFAULT 1`

Use queries like:

```sql
SELECT ... FROM jobs WHERE deleted_at IS NULL AND is_active = 1;
```

### 7.4 Audit Columns

Every business table should include:

- `created_at`
- `updated_at`
- `created_by`
- `updated_by`
- `deleted_at`
- `deleted_by`

### 7.5 ER Diagram Explanation

#### Entities

- `users` : root identity table
- `companies` : employer company data
- `recruiters` : recruiter profiles tied to company
- `candidates` : candidate profile master
- `jobs` : published job openings
- `job_applications` : candidate applications
- `resumes` : uploaded resumes
- `saved_jobs` : saved job records
- `interviews` : interview schedules
- `notifications` : user notifications
- `subscriptions` : billing plan records
- `audit_logs` : immutable audit trail

#### Relationships

- `users` 1:N `candidates`, `recruiters`, `companies`, `notifications`, `audit_logs`
- `companies` 1:N `recruiters`, `jobs`
- `recruiters` 1:N `jobs`
- `candidates` 1:N `job_applications`, `saved_jobs`, `resumes`
- `jobs` 1:N `job_applications`
- `job_applications` 1:N `interviews`

### 7.6 Complete Table List

```sql
users
user_roles
user_sessions
refresh_tokens
companies
recruiters
candidates
candidate_educations
candidate_work_experiences
candidate_skills
resumes
jobs
job_locations
job_requirements
job_applications
saved_jobs
interviews
notifications
subscriptions
plans
payment_transactions
companies_verification
admin_actions
audit_logs
job_alerts
email_outbox
search_logs
```

### 7.7 Core Table Design (Representative SQL)

#### users

```sql
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('candidate','recruiter','company_admin','admin') NOT NULL,
  status ENUM('pending','active','suspended','locked') DEFAULT 'pending',
  email_verified TINYINT(1) DEFAULT 0,
  failed_login_attempts INT DEFAULT 0,
  lock_until DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36) NULL,
  updated_by CHAR(36) NULL,
  deleted_by CHAR(36) NULL
);
```

#### candidates

```sql
CREATE TABLE candidates (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  headline VARCHAR(255),
  gender ENUM('male','female','other','prefer_not_to_say') NULL,
  date_of_birth DATE NULL,
  current_location VARCHAR(100),
  preferred_location VARCHAR(100),
  total_experience_years INT DEFAULT 0,
  current_salary DECIMAL(12,2) NULL,
  expected_salary DECIMAL(12,2) NULL,
  summary TEXT,
  profile_completion_pct INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### companies

```sql
CREATE TABLE companies (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  industry VARCHAR(255),
  size ENUM('1-10','11-50','51-200','201-500','500+') NOT NULL,
  location VARCHAR(255),
  description TEXT,
  logo_url VARCHAR(500),
  verification_status ENUM('pending','verified','rejected') DEFAULT 'pending',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36)
);
```

#### jobs

```sql
CREATE TABLE jobs (
  id CHAR(36) PRIMARY KEY,
  company_id CHAR(36) NOT NULL,
  recruiter_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT NOT NULL,
  job_type ENUM('full_time','part_time','contract','internship','freelance') NOT NULL,
  work_mode ENUM('remote','hybrid','onsite') NOT NULL,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  min_salary DECIMAL(12,2),
  max_salary DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'INR',
  min_experience_years INT DEFAULT 0,
  max_experience_years INT DEFAULT 15,
  posted_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  status ENUM('draft','published','closed','paused') DEFAULT 'draft',
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
  FOREIGN KEY (recruiter_id) REFERENCES recruiters(id)
);
```

#### job_applications

```sql
CREATE TABLE job_applications (
  id CHAR(36) PRIMARY KEY,
  job_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  resume_id CHAR(36) NULL,
  status ENUM('applied','screening','shortlisted','interview_scheduled','rejected','hired') DEFAULT 'applied',
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
```

#### resumes

```sql
CREATE TABLE resumes (
  id CHAR(36) PRIMARY KEY,
  candidate_id CHAR(36) NOT NULL,
  file_name VARCHAR(255),
  s3_key VARCHAR(500),
  file_type VARCHAR(100),
  file_size BIGINT,
  checksum VARCHAR(128),
  virus_scan_status ENUM('pending','clean','infected','failed') DEFAULT 'pending',
  is_primary TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  created_by CHAR(36),
  updated_by CHAR(36),
  deleted_by CHAR(36),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
```

### 7.8 Indexing Strategy

#### Recommended Indexes

```sql
CREATE INDEX idx_jobs_status_posted ON jobs(status, posted_at, expires_at);
CREATE INDEX idx_jobs_location_workmode ON jobs(location, work_mode, job_type);
CREATE INDEX idx_jobs_salary ON jobs(min_salary, max_salary);
CREATE INDEX idx_jobs_company ON jobs(company_id, status);
CREATE INDEX idx_jobs_recruiter ON jobs(recruiter_id, status);
CREATE INDEX idx_applications_candidate ON job_applications(candidate_id, status, applied_at);
CREATE INDEX idx_applications_job ON job_applications(job_id, status);
CREATE INDEX idx_saved_jobs_candidate ON saved_jobs(candidate_id, created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_interviews_status_date ON interviews(status, scheduled_at);
CREATE INDEX idx_candidates_location ON candidates(current_location, total_experience_years);
CREATE FULLTEXT INDEX ftx_jobs_search ON jobs(title, description, location, search_vector);
```

### 7.9 SQL Optimization

- Use `EXPLAIN` for high-traffic queries
- Avoid `SELECT *`
- Use covering indexes for `jobs` and `notifications`
- Use `JOIN` only on indexed columns
- Use composite indexes for filtering on location + job_type + work_mode
- Use `cursor pagination` for infinite feeds
- Use `partitioning` by `created_at` for large analytics and logs tables

### 7.10 Future Partitioning Strategy

- `job_applications` partition by month on `applied_at`
- `notifications` partition by month on `created_at`
- `audit_logs` partition by month on `created_at`

---

## 8. Module-by-Module Architecture

Each module below includes purpose, folder structure, DB tables, relationships, schema snippets, indexes, APIs, validation, service and repository logic, security concerns, Redis strategy, pagination, retry, audit logging, error handling, authorization, transaction handling, and scalability concerns.

### 8.1 Authentication Module

#### Purpose
- Sign up, sign in, refresh tokens, logout, OTP verification, password reset

#### Folder Structure

```text
src/modules/auth/
  controllers/auth.controller.js
  routes/auth.routes.js
  services/auth.service.js
  repositories/auth.repository.js
  validators/auth.validator.js
  dto/auth.dto.js
```

#### Database Tables

- `users`
- `refresh_tokens`
- `user_sessions`
- `otp_verifications`

#### Relationships

- `users` 1:N `refresh_tokens`

#### MySQL Schema

```sql
CREATE TABLE refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  replaced_by CHAR(36) NULL,
  device_info VARCHAR(255),
  ip_address VARCHAR(45),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Required Indexes

- `idx_refresh_tokens_user` on `(user_id, expires_at)`
- `idx_refresh_tokens_token_hash` unique

#### APIs

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-email`

#### Request / Response

```json
{
  "email": "candidate@example.com",
  "password": "StrongPass123!"
}
```

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt",
    "refreshToken": "jwt",
    "user": {
      "id": "uuid",
      "role": "candidate"
    }
  }
}
```

#### Validation Schema

- email required / valid
- password min 8 / strong
- OTP 6 digits

#### Service Layer Logic

- Validate credentials
- Hash password with bcrypt
- Generate token pair
- Rotate refresh token
- Revoke stale tokens

#### Repository Layer Logic

- `findByEmail`
- `createUser`
- `createRefreshToken`
- `revokeRefreshToken`

#### Security Concerns

- Token theft
- lockout abuse
- replay attacks

#### Redis Caching Strategy

- Cache login session metadata
- Store OTP in Redis TTL 5 min
- Rate limit login attempts

#### Pagination Strategy

- Not applicable

#### Retry Mechanism

- Retry email sending and OTP generation on transient failures

#### Audit Logging

- login success/failure
- password reset
- OTP verification

#### Error Handling

- Invalid credentials
- locked account
- expired token

#### Role Authorization

- Public routes only for auth endpoints

#### Transaction Handling

- user creation + refresh token insert in single transaction

#### Scalability Concerns

- Token verification must be stateless
- Redis must be clustered in production

### 8.2 User Module

#### Purpose
- Manage user profile metadata and account settings

#### Folder Structure

```text
src/modules/users/
  controllers/user.controller.js
  routes/user.routes.js
  services/user.service.js
  repositories/user.repository.js
  validators/user.validator.js
```

#### Database Tables

- `users`
- `user_roles`
- `user_sessions`

#### APIs

- `GET /api/v1/users/me`
- `PUT /api/v1/users/me`
- `PATCH /api/v1/users/change-password`
- `GET /api/v1/users/:id`

#### Redis Strategy

- Cache user profile by `userId`

#### Authorization

- Candidate can modify self
- Admin can access all

### 8.3 Candidate Profile Module

#### Purpose
- Candidate profile, education, work experience, skills, preferences

#### Folder Structure

```text
src/modules/candidates/
  controllers/candidate.controller.js
  routes/candidate.routes.js
  services/candidate.service.js
  repositories/candidate.repository.js
  validators/candidate.validator.js
```

#### Tables

- `candidates`
- `candidate_educations`
- `candidate_work_experiences`
- `candidate_skills`

#### APIs

- `GET /api/v1/candidates/me`
- `PUT /api/v1/candidates/me`
- `POST /api/v1/candidates/skills`
- `GET /api/v1/candidates/search`

#### Redis Cache

- Cache candidate profile and summary

#### Pagination

- Use offset for admin lists, cursor for profile feeds if needed

#### Scalability

- Denormalize selected profile fields into candidate table for faster reads

### 8.4 Recruiter Module

#### Purpose
- Recruiter registration, organization association, candidate management

#### Tables

- `recruiters`
- `companies`

#### APIs

- `POST /api/v1/recruiters/onboarding`
- `GET /api/v1/recruiters/dashboard`
- `GET /api/v1/recruiters/applications`

#### Authorization

- Recruiter can manage own jobs and applications

### 8.5 Company Module

#### Purpose
- Manage company profile, employer branding, verification

#### Tables

- `companies`
- `company_branches`
- `company_verification`

#### APIs

- `POST /api/v1/companies`
- `GET /api/v1/companies/:id`
- `PATCH /api/v1/companies/:id`

#### Redis

- Cache company public profile

### 8.6 Job Posting Module

#### Purpose
- Recruiter creates, updates, publishes, closes jobs

#### Tables

- `jobs`
- `job_locations`
- `job_requirements`

#### APIs

- `POST /api/v1/jobs`
- `GET /api/v1/jobs/:id`
- `PATCH /api/v1/jobs/:id`
- `DELETE /api/v1/jobs/:id`

#### Validation

- title required
- posted_at and expires_at valid
- salary range valid

#### Service Logic

- Validate recruiter owns company
- Create job with requirements
- Update search_vector / indexing metadata

#### Redis Strategy

- Cache job detail pages by ID
- Invalidate cache when job updated

#### Transaction Handling

- Create job + requirements in transaction

#### Scalability

- Use async job indexing for full-text metadata

### 8.7 Job Search Module

#### Purpose
- Search and rank jobs for candidates

#### Tables

- `jobs`
- `job_requirements`

#### APIs

- `GET /api/v1/jobs/search`
- `GET /api/v1/jobs/recommended`

#### Query Example

```sql
SELECT id, title, company_id, location, job_type, work_mode, min_salary, max_salary, posted_at
FROM jobs
WHERE deleted_at IS NULL
  AND status = 'published'
  AND expires_at > NOW()
  AND (title LIKE ? OR description LIKE ?)
  AND location = ?
  AND work_mode = ?
ORDER BY is_featured DESC, posted_at DESC
LIMIT ? OFFSET ?;
```

#### Search Optimization

- Use `FULLTEXT` for title + description search
- Use `search_vector` for ranking
- Use `cursor pagination` for large result sets
- Future migration to Elasticsearch

#### Ranking Strategy

- featured jobs first
- recency
- salary match
- location match
- skill match
- recruiter rating

#### Redis Strategy

- Cache top search results by normalized query key

### 8.8 Job Application Module

#### Purpose
- Apply to jobs, track application status, shortlist, reject, schedule interview

#### Tables

- `job_applications`
- `interviews`

#### APIs

- `POST /api/v1/applications`
- `GET /api/v1/applications/me`
- `PATCH /api/v1/applications/:id/status`

#### Validation

- candidate, job, resume required

#### Service Logic

- Validate candidate not duplicated
- Create application in transaction
- Publish event for notification

#### Redis Strategy

- Cache application count per job

#### Retry

- Resume status update and notification delivery retry

### 8.9 Resume Upload Module

#### Purpose
- Upload and manage resumes securely

#### Tables

- `resumes`

#### APIs

- `POST /api/v1/resumes/upload`
- `GET /api/v1/resumes`
- `DELETE /api/v1/resumes/:id`

#### AWS S3 Flow

1. Request signed URL from backend
2. Frontend uploads directly to S3
3. Backend receives callback with metadata
4. Backend validates MIME type, size, checksum
5. Resume record created in MySQL
6. Virus scan job triggered

#### Validation

- File type: PDF, DOCX
- Max size: 10 MB
- Virus scan status must be `clean`

#### Security

- Signed URL expiry 5 min
- Bucket private
- No public ACL

#### Redis

- Cache resume metadata and status

### 8.10 Notifications Module

#### Purpose
- In-app, email, and push notifications

#### Tables

- `notifications`
- `email_outbox`

#### APIs

- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`

#### Retry

- Email delivery via worker with retry and DLQ

#### Redis

- Pub/Sub for real-time notification fanout

### 8.11 Admin Module

#### Purpose
- Platform moderation, user management, analytics insights

#### Tables

- `admin_actions`
- `audit_logs`

#### APIs

- `GET /api/v1/admin/users`
- `PATCH /api/v1/admin/users/:id/status`
- `GET /api/v1/admin/analytics`

#### Security

- Admin only
- Approval workflow for company verification

### 8.12 Analytics Module

#### Purpose
- Metrics and dashboards for employers and admins

#### Tables

- `analytics_events`
- `search_logs`

#### APIs

- `GET /api/v1/analytics/jobs`
- `GET /api/v1/analytics/applications`

#### Redis

- Cache aggregate metrics for 1-5 minutes

### 8.13 Subscription / Payment Module

#### Purpose
- Recruiter plans and premium features

#### Tables

- `plans`
- `subscriptions`
- `payment_transactions`

#### APIs

- `GET /api/v1/subscriptions/plans`
- `POST /api/v1/subscriptions`
- `GET /api/v1/subscriptions/me`

#### Security

- Payment webhooks verified using signature validation

### 8.14 Saved Jobs Module

#### Purpose
- Save and track jobs for candidates

#### Tables

- `saved_jobs`

#### APIs

- `POST /api/v1/saved-jobs`
- `GET /api/v1/saved-jobs`
- `DELETE /api/v1/saved-jobs/:id`

#### Redis

- Cache saved job lists per user

### 8.15 Interview Scheduling Module

#### Purpose
- Schedule recruiter and candidate interviews

#### Tables

- `interviews`

#### APIs

- `POST /api/v1/interviews`
- `PATCH /api/v1/interviews/:id`
- `GET /api/v1/interviews`

#### Transaction Handling

- Application status update + interview creation in single transaction

---

## 9. Pagination Strategy

### 9.1 Offset Pagination

Use for admin dashboards and back-office reports where total counts are needed.

```sql
SELECT ...
FROM jobs
WHERE status = 'published'
ORDER BY posted_at DESC
LIMIT 20 OFFSET 40;
```

### 9.2 Cursor Pagination

Use for high-volume feeds and infinite scrolling.

```sql
SELECT ...
FROM jobs
WHERE status = 'published'
  AND posted_at < ?
ORDER BY posted_at DESC
LIMIT 20;
```

### 9.3 When to Use Which

- **Offset pagination:** admin analytics, reports
- **Cursor pagination:** job search results, notifications, saved jobs

### 9.4 Performance Optimization

- Avoid `OFFSET` on large tables beyond the first few pages
- Use indexed sort columns
- Cache first pages in Redis
- Use stable sort keys such as `posted_at`, `id`

---

## 10. Search Architecture

### 10.1 MySQL Fulltext Search

Use `FULLTEXT` on `jobs(title, description, location, search_vector)`.

```sql
SELECT id, title, company_id, location, min_salary, max_salary, posted_at
FROM jobs
WHERE MATCH(title, description, location, search_vector) AGAINST (? IN BOOLEAN MODE)
AND status = 'published'
AND expires_at > NOW();
```

### 10.2 Search Ranking Strategy

- `is_featured` boost
- `posted_at` recency
- salary closeness
- skill match count
- exact location match

### 10.3 Skills, Location, Salary, Experience, Remote, Company, Job Type

Filters should be applied via indexed conditions and only then combined with fulltext search.

### 10.4 Future Elasticsearch Migration

Use Elasticsearch when:

- search volume grows
- fuzzy and typo-tolerant search required
- advanced facets required
- multilingual search required

---

## 11. Redis Caching Strategy

### 11.1 What to Cache

- Job detail pages
- Company profile
- Candidate profile summary
- Search results
- Dashboard metrics
- OTPs
- Rate-limit counters

### 11.2 Cache Invalidation

- Invalidate on create/update/delete
- Use event-driven invalidation when possible
- Set TTLs based on data volatility

### 11.3 Cache Keys

```text
job:detail:{jobId}
company:detail:{companyId}
search:{hash(query)}
user:profile:{userId}
metrics:jobs:{date}
```

### 11.4 Redis Use Cases

- Session / token metadata
- Rate limiting
- Pub/Sub for notifications
- Queue broker for background jobs

---

## 12. Retry, Resilience, and Background Job Readiness

### 12.1 Retry Strategy

Use exponential backoff:

- attempt 1 immediate
- attempt 2 after 500 ms
- attempt 3 after 1500 ms
- attempt 4 after 5000 ms

### 12.2 Retryable Failures

- MySQL transient disconnects
- Redis timeouts
- S3 temporary failures
- Email provider throttling

### 12.3 Background Jobs

Queue-ready modules:

- Resume parsing
- Email delivery
- Notification fanout
- Search indexing
- Analytics aggregation
- PDF generation

### 12.4 Dead Letter Queue

Store failed jobs in a `jobs_dead_letter` table or dedicated Redis queue for manual reprocessing.

### 12.5 Idempotency

Use `idempotency_key` for payment, application, and notification events.

### 12.6 Graceful Failure Handling

- Return meaningful errors
- Avoid cascading failures
- Use circuit breakers in service integrations
- Fall back to cached data when primary services are unavailable

---

## 13. File Upload and S3 Architecture

### 13.1 Upload Flow

1. Client requests signed URL
2. Uploads directly to S3
3. Backend validates metadata and confirms upload
4. Database stores S3 key and metadata
5. Virus scan job runs asynchronously

### 13.2 Resume Upload Rules

- File types: PDF, DOCX
- Max file size: 10MB
- Content-type validation
- Filename sanitized
- Virus scan status tracked

### 13.3 Signed URL Strategy

- Expire in 5 minutes
- Use IAM role on EC2 for S3 access
- Restrict bucket to private access

### 13.4 CDN Strategy

- Use CloudFront in front of S3 for public assets
- Store company logos and images via CDN

### 13.5 Virus Scan Strategy

- Trigger ClamAV / external malware service
- Mark resume as `infected` if scan fails
- Block infected file from further processing

---

## 14. Logging, Monitoring, and Observability

### 14.1 Logging Strategy

Use Winston with structured JSON logs:

```json
{
  "level": "info",
  "service": "job-portal-api",
  "requestId": "uuid",
  "userId": "uuid",
  "route": "/api/v1/jobs/search",
  "message": "Job search request processed"
}
```

### 14.2 Request Tracing

- Generate `requestId` per request
- Propagate through logs and async jobs
- Include correlation ID in responses

### 14.3 Error Logging

- Log application exceptions
- Log DB query failure details
- Log external provider failures

### 14.4 Audit Logs

Capture:

- login/logout
- user role changes
- job publish/close
- application status changes
- resume upload and delete
- admin actions

### 14.5 Health Check APIs

- `GET /health` — liveness
- `GET /ready` — readiness includes DB, Redis, S3 checks

### 14.6 Metrics Collection

- API latency
- error rate
- cache hit ratio
- DB query time
- queue backlog
- active workers

---

## 15. Deployment Architecture

### 15.1 AWS EC2

Deploy on EC2 instances behind ALB.

### 15.2 Docker Strategy

- Build Node.js image
- Use multi-stage Docker build
- Run container with non-root user

### 15.3 PM2 Strategy

- Start 2-4 instances per EC2 depending on CPU
- Enable cluster mode
- Use PM2 reload for zero-downtime deployment

### 15.4 Nginx Strategy

- Terminate SSL
- Proxy to Node.js backends
- Enable compression
- Set rate limit headers

Example config:

```nginx
server {
  listen 80;
  server_name api.jobportal.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Request-Id $request_id;
  }
}
```

### 15.5 CI/CD Readiness

- lint -> test -> build -> docker build -> deploy
- environment-specific config using `.env` and AWS Secrets Manager

---

## 16. Docker and Environment Management

### 16.1 `.env` Strategy

Use `.env.example` and secret injection in production.

### 16.2 Recommended Environment Variables

```env
NODE_ENV=production
PORT=3000
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
REDIS_URL=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET=job-portal-resumes
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://app.jobportal.com
```

### 16.3 Secrets Management

- Store secrets in AWS Secrets Manager or SSM Parameter Store
- Never commit secrets to git

---

## 17. Rate Limiting and Abuse Protection

### 17.1 Rate Limit Rules

- Login: 5/min per IP
- OTP send: 3/10 min
- Search: 60/min per user
- Upload: 5/min per user

### 17.2 Distributed Rate Limiting

Use Redis-backed rate limit middleware with sliding window counters.

### 17.3 Brute Force / Account Lock

- Increment failed attempts on login
- Lock account after 5 failed attempts
- Auto-unlock after `lock_until`

---

## 18. Repository Pattern and Clean Architecture Implementation

### 18.1 Repository Pattern

Repository classes should abstract SQL operations and return domain-friendly data.

```text
services/job.service.js
repositories/job.repository.js
```

### 18.2 Example Flow

1. Controller receives request
2. Service validates and orchestrates business logic
3. Repository executes SQL
4. Cache wrapper handles read caching
5. Response standardized

### 18.3 Recommended Dependency Interface

- Services depend on repository interfaces
- Repositories depend on MySQL pool
- Cache layer wraps repository read path

---

## 19. Transaction Management

### 19.1 Critical Transactions

- Create job + requirements
- Submit application + notification event
- Interview schedule + status update
- Subscription purchase + payment record

### 19.2 Example Transaction

```sql
START TRANSACTION;

INSERT INTO jobs (...);
INSERT INTO job_requirements (...);

COMMIT;
```

### 19.3 Rollback Strategy

- If any insert fails, rollback and return error
- Use application-level retry for transient errors

---

## 20. SQL Examples for Optimized Queries

### 20.1 Job Search Query

```sql
SELECT j.id, j.title, c.name AS company_name, j.location, j.job_type, j.work_mode,
       j.min_salary, j.max_salary, j.posted_at
FROM jobs j
JOIN companies c ON c.id = j.company_id
WHERE j.deleted_at IS NULL
  AND j.status = 'published'
  AND j.expires_at > NOW()
  AND (MATCH(j.title, j.description, j.location, j.search_vector) AGAINST (? IN BOOLEAN MODE)
       OR j.location = ?)
ORDER BY j.is_featured DESC, j.posted_at DESC
LIMIT 20 OFFSET 0;
```

### 20.2 Candidate Applications Feed

```sql
SELECT a.id, a.status, a.applied_at, j.title, c.name AS company_name
FROM job_applications a
JOIN jobs j ON j.id = a.job_id
JOIN companies c ON c.id = j.company_id
WHERE a.candidate_id = ?
  AND a.deleted_at IS NULL
ORDER BY a.applied_at DESC
LIMIT 20;
```

### 20.3 Cursor Pagination Example

```sql
SELECT id, title, posted_at
FROM jobs
WHERE status = 'published'
  AND posted_at < ?
ORDER BY posted_at DESC, id DESC
LIMIT 20;
```

---

## 21. API Documentation Structure

### 21.1 Swagger/OpenAPI

Create a `swagger.yaml` file containing:

- tags for each module
- request/response models
- auth requirements
- error schemas

### 21.2 Documentation Workflow

- Auto-generate docs from route annotations
- Publish docs at `/api-docs`
- Include sample requests and response payloads

---

## 22. Production Hardening Checklist

- [ ] JWT access/refresh secured
- [ ] HTTPS enforced
- [ ] Helmet enabled
- [ ] CORS restricted
- [ ] Rate limiting enabled
- [ ] Input validation using Zod/Joi
- [ ] SQL injection avoidance
- [ ] Soft delete enabled
- [ ] Redis cache invalidation implemented
- [ ] S3 signed URL upload flow
- [ ] Structured logging configured
- [ ] Retry mechanism implemented
- [ ] Health checks available
- [ ] CI/CD pipeline configured
- [ ] PM2 process management configured
- [ ] Docker image built
- [ ] Nginx reverse proxy configured

---

## 23. Recommended Implementation Roadmap

### Phase 1: Foundation

- Set up Node.js + Express + MySQL + Redis
- Implement auth, user, company, job modules
- Add validation, response wrapper, logger

### Phase 2: Core Product

- Candidate profile, resume upload, applications, saved jobs
- Recruiter and admin dashboards
- Search and pagination

### Phase 3: Scale and Reliability

- Queue workers
- S3 integration
- Redis caching and rate limiting
- Monitoring and alerting
- Docker and PM2 deployment

### Phase 4: Enterprise Features

- Analytics
- Subscription and payment
- Interview scheduling
- Audit compliance
- Multi-region readiness

---

## 24. Final Engineering Notes

This backend architecture is designed to support a **large-scale, production-grade job portal** with enterprise engineering practices. It is intentionally structured so that the system can begin as a **single Node.js API service** and evolve into a **distributed, queue-backed, horizontally scalable platform** without major rework.

Key design decisions:

- **Clean architecture** for maintainability
- **Repository pattern** for database abstraction
- **Redis first** for cache and rate limiting
- **MySQL optimized** for structured relational data
- **AWS S3** for secure resume and asset storage
- **Event-driven / queue-ready** for future asynchronous processing
- **Swagger** for API governance
- **Audit logging** for compliance and debugging
- **Soft delete and indexing** for safe evolution

If you want, I can next provide:
1. a ready-to-use `package.json` and `src` scaffold
2. a full `docker-compose.yml`
3. a `swagger.yaml`
4. a `MySQL schema migration set`
5. a `PM2` and `Nginx` production config
