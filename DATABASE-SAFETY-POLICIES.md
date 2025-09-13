# VitalGo Database Safety Policies

## 🚨 CRITICAL RULE: NEVER RISK AWS PRODUCTION DATA

This document establishes **IRONCLAD** policies to ensure AWS production data is **NEVER EVER** compromised during development or deployment.

## 🛡️ Core Safety Principles

### 1. **Unidirectional Data Flow**
```
AWS Production Database → Local Development Database ✅
Local Development Database → AWS Production Database ❌ FORBIDDEN
```

### 2. **Environment Isolation**
- **AWS Environment**: Production data, real users, live system
- **Local Environment**: Development data, testing, bug fixes
- **NEVER MIX THESE ENVIRONMENTS**

## 📋 Safe Development Workflow

### Step 1: Sync AWS Data to Local (Safe)
```bash
./sync-aws-to-local.sh
```
**What it does:**
- Downloads AWS database dump
- Backs up current local data
- Replaces local data with AWS data
- **AWS remains untouched**

### Step 2: Develop and Test Locally
- Make code changes locally
- Test with real AWS data in local environment
- Fix bugs, add features
- **AWS production unaffected**

### Step 3: Deploy Safely to AWS
```bash
./update-vitalgo-safe.sh
```
**What it does:**
- Builds new Docker images
- Pushes to Docker Hub
- Updates ONLY Frontend, Backend, Redis on AWS
- **PRESERVES AWS database completely**

## 🚫 Forbidden Operations

### NEVER use these commands on AWS:
```bash
# ❌ DANGEROUS - Can wipe AWS database
docker-compose down --volumes

# ❌ DANGEROUS - Can reset database
docker-compose up --force-recreate

# ❌ DANGEROUS - Contains init scripts
docker-compose -f docker-compose.prod.yml up

# ❌ DANGEROUS - Generic deployment
./update-vitalgo.sh
./quick-deploy.sh
```

### ✅ ONLY use these SAFE commands for AWS:
```bash
# ✅ SAFE - Preserves database
./update-vitalgo-safe.sh

# ✅ SAFE - Only syncs TO local
./sync-aws-to-local.sh

# ✅ SAFE - Uses database-safe configuration
docker-compose -f docker-compose.aws-safe.yml up -d
```

## 📁 File Safety Matrix

| File | Local Use | AWS Use | Notes |
|------|-----------|---------|-------|
| `docker-compose.prod.yml` | ✅ Safe | ❌ **DANGEROUS** | Contains init.sql mount |
| `docker-compose.aws-safe.yml` | ✅ Safe | ✅ **SAFE** | No init scripts, preserves volumes |
| `init.sql` | ✅ Safe | ❌ **FORBIDDEN** | Can wipe AWS database |
| `update-vitalgo.sh` | ✅ Safe | ❌ **DANGEROUS** | Not database-aware |
| `update-vitalgo-safe.sh` | ✅ Safe | ✅ **SAFE** | Database-preserving |
| `sync-aws-to-local.sh` | ✅ Safe | N/A | One-way sync only |

## 🔧 Configuration Differences

### Local Development (docker-compose.prod.yml)
```yaml
postgres:
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql  # OK for local
```

### AWS Production (docker-compose.aws-safe.yml)
```yaml
postgres:
  volumes:
    - postgres_data:/var/lib/postgresql/data  # ONLY persistent data
    # NO init.sql mount - prevents data loss
  environment:
    DISABLE_AUTO_MIGRATION: "true"  # Prevents schema changes
```

## 🚨 Emergency Procedures

### If AWS Database is Accidentally Affected:
1. **STOP ALL DEPLOYMENT SCRIPTS IMMEDIATELY**
2. Check AWS database status:
   ```bash
   ssh -i ~/.ssh/vitalgo-key.pem ec2-user@35.169.20.114
   sudo docker exec vitalgo-postgres-1 psql -U backend_user -d backend_db -c "SELECT COUNT(*) FROM users;"
   ```
3. If data is missing, restore from automatic backup:
   ```bash
   # Find latest backup
   ls -la /home/ec2-user/vitalgo/backup_*.sql
   # Restore latest backup
   sudo docker exec -i vitalgo-postgres-1 psql -U backend_user -d backend_db < backup_YYYYMMDD_HHMMSS.sql
   ```

### If Local Environment is Corrupted:
1. **AWS IS SAFE** - This doesn't affect production
2. Re-sync from AWS:
   ```bash
   ./sync-aws-to-local.sh
   ```

## ✅ Pre-Deployment Checklist

Before ANY AWS deployment, verify:

- [ ] Using `./update-vitalgo-safe.sh` (not other scripts)
- [ ] Using `docker-compose.aws-safe.yml` configuration
- [ ] No `init.sql` files being mounted to AWS containers
- [ ] Database backup exists on AWS
- [ ] Understanding that ONLY Frontend/Backend/Redis will be updated
- [ ] AWS database will remain completely untouched

## 🎯 Quick Reference

### Daily Development Workflow:
1. `./sync-aws-to-local.sh` - Get latest AWS data
2. Make changes locally
3. Test with real data in local environment
4. `./update-vitalgo-safe.sh` - Deploy safely to AWS

### Key Files:
- `docker-compose.aws-safe.yml` - Safe AWS configuration
- `update-vitalgo-safe.sh` - Safe deployment script  
- `sync-aws-to-local.sh` - One-way data sync
- `DATABASE-SAFETY-POLICIES.md` - This document

## 📞 Support

If you have ANY doubts about database safety:
1. **STOP** what you're doing
2. **NEVER** risk AWS data
3. **ASK** for confirmation before proceeding

**Remember: Code can be rewritten, but production data is irreplaceable.**