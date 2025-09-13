# VitalGo Infrastructure Protection Policies

## 🚨 CRITICAL RULE: NEVER RECREATE EXISTING INFRASTRUCTURE

This document establishes **ABSOLUTE** policies to prevent accidental infrastructure recreation and ensure all changes are made **IN-PLACE** on existing AWS resources.

## 🛡️ Core Protection Principles

### 1. **Infrastructure Creation vs. Modification**
```
Initial Project Setup: Create infrastructure from scratch ✅
Ongoing Development: ONLY modify existing infrastructure ✅
Accidental Recreation: FORBIDDEN ❌
```

### 2. **Always Map Before Changing**
Before ANY AWS operation:
1. Run `./aws-infrastructure-map.sh` to discover existing resources
2. Identify what exists vs. what needs to be created
3. Choose appropriate strategy based on findings

## 📋 Infrastructure Discovery Workflow

### Step 1: Map Current Infrastructure
```bash
./aws-infrastructure-map.sh
```
**This tool discovers:**
- EC2 instances (running/stopped)
- RDS databases 
- S3 buckets
- CloudFormation stacks
- Security groups
- Key pairs
- Load balancers

### Step 2: Analyze Results
The tool will tell you:
- ✅ **EXISTING INFRASTRUCTURE DETECTED** → Use in-place changes only
- ⚠️ **NO EXISTING INFRASTRUCTURE FOUND** → Safe to create new infrastructure

### Step 3: Choose Correct Strategy
Based on discovery results:

**If Infrastructure EXISTS:**
```bash
# ✅ CORRECT - In-place changes only
./aws-change-inplace.sh update
./update-vitalgo-safe.sh

# ❌ FORBIDDEN - Would recreate infrastructure  
./deploy-auto.sh
./quick-deploy.sh
aws cloudformation deploy
```

**If NO Infrastructure:**
```bash
# ✅ CORRECT - Create from scratch
./deploy-auto.sh
aws cloudformation deploy
```

## 🚫 Forbidden Operations (When Infrastructure Exists)

### NEVER run these commands if infrastructure exists:
```bash
# ❌ DESTROYS AND RECREATES everything
aws cloudformation deploy --stack-name vitalgo-free-tier

# ❌ TERMINATES existing EC2 instances
aws ec2 terminate-instances

# ❌ DELETES existing databases
aws rds delete-db-instance

# ❌ RECREATES infrastructure from scratch
./deploy-auto.sh
./deploy-free-tier.sh

# ❌ DANGEROUS deployment scripts
./quick-deploy.sh (uses deploy-to-aws.sh which may recreate)
./update-vitalgo.sh (doesn't check existing infrastructure)
```

### ⚠️ Use with EXTREME caution:
```bash
# These MAY be safe but require manual verification
docker-compose down --volumes  # Can destroy data
docker-compose up --force-recreate  # May recreate volumes
```

## ✅ Safe Operations (Infrastructure Exists)

### ALWAYS safe when infrastructure exists:
```bash
# ✅ Maps existing infrastructure first
./aws-infrastructure-map.sh

# ✅ Updates containers only, preserves infrastructure
./aws-change-inplace.sh update

# ✅ Database-safe deployment
./update-vitalgo-safe.sh

# ✅ One-way data sync
./sync-aws-to-local.sh

# ✅ Container-level operations on EC2
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@35.169.20.114
sudo docker-compose -f docker-compose.aws-safe.yml restart backend
sudo docker-compose -f docker-compose.aws-safe.yml pull
sudo docker-compose -f docker-compose.aws-safe.yml up -d --force-recreate backend frontend
```

## 📁 Safe vs. Dangerous Files

| Script | When Infrastructure EXISTS | When NO Infrastructure | Notes |
|--------|---------------------------|----------------------|-------|
| `aws-infrastructure-map.sh` | ✅ **ALWAYS SAFE** | ✅ **ALWAYS SAFE** | Discovery only |
| `aws-change-inplace.sh` | ✅ **SAFE** | ⚠️ **Will fail safely** | Requires existing infrastructure |
| `update-vitalgo-safe.sh` | ✅ **SAFE** | ⚠️ **Will fail safely** | Container updates only |
| `sync-aws-to-local.sh` | ✅ **SAFE** | ⚠️ **Will fail safely** | Read-only operation |
| `deploy-auto.sh` | ❌ **DANGEROUS** | ✅ **SAFE** | Creates new infrastructure |
| `quick-deploy.sh` | ❌ **DANGEROUS** | ✅ **SAFE** | May recreate resources |
| `update-vitalgo.sh` | ❌ **DANGEROUS** | ✅ **SAFE** | Doesn't check existing infrastructure |

## 🔧 Configuration File Safety

### Safe configurations (existing infrastructure):
- `docker-compose.aws-safe.yml` ✅ **Preserves existing volumes**
- Environment variable updates ✅ **Non-destructive**
- Container image updates ✅ **Preserves data**

### Dangerous configurations (existing infrastructure):
- `docker-compose.prod.yml` ❌ **May mount init scripts**
- CloudFormation templates ❌ **May recreate resources**
- New volume definitions ❌ **May lose existing data**

## 🚨 Emergency Procedures

### If Infrastructure is Accidentally Affected:

#### For EC2 Issues:
```bash
# Check instance status
aws ec2 describe-instances --instance-ids i-0b0ba62b1689cb8ff

# If stopped, restart (don't recreate)
aws ec2 start-instances --instance-ids i-0b0ba62b1689cb8ff
```

#### For Database Issues:
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier vitalgo-database-test

# Access database directly if needed
ssh -i ~/.ssh/vitalgo-key.pem ec2-user@35.169.20.114
sudo docker exec -it vitalgo-postgres-1 psql -U backend_user -d backend_db
```

#### For Complete Infrastructure Loss:
1. **STOP** all automation immediately
2. Check AWS Console for any remaining resources
3. Assess what can be recovered vs. what needs recreation
4. If recreation is necessary, ensure data backups exist first

## ✅ Pre-Change Checklist

Before ANY AWS operation, verify:

- [ ] Ran `./aws-infrastructure-map.sh` to map existing resources
- [ ] Confirmed whether infrastructure exists or not
- [ ] Selected appropriate strategy (in-place vs. create-new)
- [ ] Using correct scripts for the situation
- [ ] Understanding the potential impact of the change
- [ ] Have rollback plan if something goes wrong
- [ ] Database backups exist (if modifying data layer)

## 🎯 Quick Decision Matrix

| Situation | Recommended Action | Script to Use |
|-----------|-------------------|---------------|
| No existing infrastructure | Create from scratch | `./deploy-auto.sh` |
| Infrastructure exists, need code update | Update containers only | `./aws-change-inplace.sh update` |
| Infrastructure exists, need config change | Update configuration | `./aws-change-inplace.sh config` |
| Infrastructure exists, need data sync | Sync AWS to local | `./sync-aws-to-local.sh` |
| Infrastructure exists, need deployment | Safe deployment | `./update-vitalgo-safe.sh` |
| Unsure what exists | Discover first | `./aws-infrastructure-map.sh` |

## 📞 Support and Escalation

### Before making ANY infrastructure change:
1. **MAP** existing infrastructure first
2. **UNDERSTAND** the current state
3. **CHOOSE** the appropriate strategy
4. **DOCUMENT** what you're about to do
5. **EXECUTE** with the correct tools

### If you're unsure:
1. **STOP** and run `./aws-infrastructure-map.sh`
2. **REVIEW** the discovery results
3. **ASK** for confirmation if needed
4. **NEVER** guess or assume

**Remember: Infrastructure recreation can cause downtime, data loss, and additional costs. Always choose in-place modifications when infrastructure already exists.**