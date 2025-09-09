# VitalGo - Entity Relationship Diagram

## 📋 Primary Keys Summary

| Table | Primary Key | Type |
|-------|-------------|------|
| **users** | `id` | varchar(36) |
| **patients** | `id` | varchar(36) |
| **paramedics** | `id` | varchar(36) |
| **allergies** | `id` | varchar(36) |
| **illnesses** | `id` | varchar(36) |
| **surgeries** | `id` | varchar(36) |
| **patient_qr_codes** | `id` | varchar(36) |
| **qr_access_logs** | `id` | varchar(36) |

---

## 🔗 Foreign Key Relationships

| Source Table | Source Column | Target Table | Target Column | Relationship |
|-------------|---------------|-------------|---------------|-------------|
| **patients** | `user_id` | **users** | `id` | 1:1 |
| **paramedics** | `user_id` | **users** | `id` | 1:1 |
| **paramedics** | `approved_by` | **users** | `id` | N:1 |
| **allergies** | `patient_id` | **patients** | `id` | N:1 |
| **illnesses** | `patient_id` | **patients** | `id` | N:1 |
| **surgeries** | `patient_id` | **patients** | `id` | N:1 |
| **patient_qr_codes** | `patient_id` | **patients** | `id` | 1:1 |
| **qr_access_logs** | `qr_code_id` | **patient_qr_codes** | `id` | N:1 |
| **qr_access_logs** | `accessed_by_user_id` | **users** | `id` | N:1 |

---

## 🏗️ Entity Relationship Diagram

```
                                    ┌─────────────────────────────────────┐
                                    │              USERS                  │
                                    │ ─────────────────────────────────── │
                                    │ 🔑 id (PK)                         │
                                    │    email (UNIQUE)                   │
                                    │    password_hash                    │
                                    │    first_name                       │
                                    │    last_name                        │
                                    │    phone                            │
                                    │    role ('patient'|'paramedic')    │
                                    │    is_active                        │
                                    │    created_at                       │
                                    │    updated_at                       │
                                    │    deleted_at                       │
                                    └─────────────┬───────────────────────┘
                                                  │
                        ┌─────────────────────────┼─────────────────────────┐
                        │                         │                         │
                        ▼                         ▼                         ▼
        ┌──────────────────────────┐  ┌──────────────────────────┐  ┌────────────────┐
        │        PATIENTS          │  │       PARAMEDICS         │  │ (approved_by)  │
        │ ──────────────────────── │  │ ──────────────────────── │  │                │
        │ 🔑 id (PK)              │  │ 🔑 id (PK)              │  │                │
        │ 🔗 user_id (FK→users)   │  │ 🔗 user_id (FK→users)   │  │                │
        │    document_type         │  │    medical_license       │  │                │
        │    document_number       │  │    specialty             │  │                │
        │    birth_date            │  │    institution           │  │                │
        │    gender                │  │    years_experience      │  │                │
        │    blood_type            │  │    license_expiry_date   │  │                │
        │    eps                   │  │    status                │  │                │
        │    emergency_contact_*   │  │ 🔗 approved_by (FK→users)│◄─┘                │
        │    address               │  │    approved_at           │                   │
        │    city                  │  │    rejection_reason      │                   │
        │    created_at            │  │    created_at            │                   │
        │    updated_at            │  │    updated_at            │                   │
        │    deleted_at            │  │    deleted_at            │                   │
        └──────────┬───────────────┘  └──────────────────────────┘                   │
                   │                                                                   │
                   │                                                                   │
        ┌──────────┼──────────────────────────────────────────────┐                   │
        │          ▼                    ▼                    ▼     │                   │
        │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │                   │
        │  │  ALLERGIES   │  │  ILLNESSES   │  │  SURGERIES   │   │                   │
        │  │ ──────────── │  │ ──────────── │  │ ──────────── │   │                   │
        │  │ 🔑 id (PK)   │  │ 🔑 id (PK)   │  │ 🔑 id (PK)   │   │                   │
        │  │ 🔗 patient_id│  │ 🔗 patient_id│  │ 🔗 patient_id│   │                   │
        │  │    allergen  │  │    name      │  │    name      │   │                   │
        │  │    severity  │  │    cie10_code│  │    surgery_* │   │                   │
        │  │    symptoms  │  │    status    │  │    surgeon   │   │                   │
        │  │    treatment │  │    diagnosed_*│  │    hospital  │   │                   │
        │  │    diagnosed_*│  │    resolved_*│  │    description│   │                   │
        │  │    last_*_date│  │    symptoms  │  │    diagnosis │   │                   │
        │  │    notes     │  │    treatment │  │    complications│   │                   │
        │  │    is_active │  │    prescribed_by│ │    recovery_* │   │                   │
        │  │    created_at│  │    notes     │  │    anesthesia_*│   │                   │
        │  │    updated_at│  │    is_chronic│  │    duration_* │   │                   │
        │  │    deleted_at│  │    created_at│  │    follow_up_*│   │                   │
        │  └──────────────┘  │    updated_at│  │    notes     │   │                   │
        │                    │    deleted_at│  │    created_at│   │                   │
        │                    └──────────────┘  │    updated_at│   │                   │
        │                                      │    deleted_at│   │                   │
        │                                      └──────────────┘   │                   │
        │                                                           │                   │
        │                            ▼                             │                   │
        │                  ┌──────────────────┐                    │                   │
        │                  │ PATIENT_QR_CODES │                    │                   │
        │                  │ ──────────────── │                    │                   │
        │                  │ 🔑 id (PK)       │                    │                   │
        │                  │ 🔗 patient_id    │◄───────────────────┘                   │
        │                  │    qr_token      │                                        │
        │                  │    is_active     │                                        │
        │                  │    expires_at    │                                        │
        │                  │    last_accessed_*│                                       │
        │                  │    access_count  │                                        │
        │                  │    created_at    │                                        │
        │                  │    updated_at    │                                        │
        │                  └──────────┬───────┘                                        │
        │                             │                                                │
        │                             ▼                                                │
        │                    ┌─────────────────────┐                                   │
        │                    │   QR_ACCESS_LOGS    │                                   │
        │                    │ ─────────────────── │                                   │
        │                    │ 🔑 id (PK)          │                                   │
        │                    │ 🔗 qr_code_id       │                                   │
        │                    │ 🔗 accessed_by_user_│◄──────────────────────────────────┘
        │                    │    access_type      │
        │                    │    ip_address       │
        │                    │    user_agent       │
        │                    │    success          │
        │                    │    error_message    │
        │                    │    created_at       │
        │                    └─────────────────────┘
        └──────────────────────────────────────────────────────────────────────────────────┘
```

## 🔍 Key Relationships Explanation

### **Central User Management**
- **USERS** table is the central entity containing authentication and basic user info
- `role` field determines if user is 'patient' or 'paramedic'
- All other entities link back to users through various relationships

### **Patient Medical Records**
- **PATIENTS** extends users with medical/demographic info (1:1 relationship)
- **ALLERGIES**, **ILLNESSES**, **SURGERIES** contain detailed medical history (1:N relationships)
- Each patient can have multiple medical records of each type

### **Emergency QR System**
- **PATIENT_QR_CODES** provides unique QR tokens for each patient (1:1 relationship)
- **QR_ACCESS_LOGS** tracks who accessed patient data and when (N:1 relationship)
- Links back to users table to identify the accessing paramedic

### **Paramedic Management**
- **PARAMEDICS** extends users with professional credentials (1:1 relationship)
- `approved_by` creates self-referential relationship within users table
- Status tracking for approval workflow

### **Data Integrity Features**
- All PKs are UUID strings (36 chars) for security and uniqueness
- Soft delete pattern with `deleted_at` timestamps
- Audit trails with `created_at`/`updated_at` on all entities
- Foreign key constraints ensure referential integrity
- Check constraints validate enum values (severity, status, etc.)

### **Security & Compliance**
- Sensitive medical data properly normalized and linked
- Access logging for HIPAA/medical compliance requirements
- User role segregation for authorization control
- Unique constraints on critical fields (emails, licenses, documents)

---

## 📊 Database Statistics
- **9 core tables** (excluding alembic_version)
- **9 foreign key relationships** maintaining data integrity
- **36-character UUID** primary keys for security
- **Comprehensive audit trails** on all entities
- **Medical data normalization** following healthcare standards