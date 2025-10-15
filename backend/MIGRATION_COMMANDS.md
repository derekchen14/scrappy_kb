# Quick Reference: Alembic Migration Commands

## Initial Setup (First Time Only)

### 1. Create Initial Migration
```bash
docker exec scrappy_kb_app alembic revision --autogenerate -m "Initial migration"
```

### 2. Apply Initial Migration
```bash
docker exec scrappy_kb_app alembic upgrade head
```

## Daily Workflow

### When You Add/Modify Models

1. **Edit model** in `common/models/`
2. **Generate migration**:
   ```bash
   docker exec scrappy_kb_app alembic revision --autogenerate -m "Your description"
   ```
3. **Review** the generated file in `alembic/versions/`
4. **Apply migration**:
   ```bash
   docker exec scrappy_kb_app alembic upgrade head
   ```

## Common Commands

### Check Current Database Version
```bash
docker exec scrappy_kb_app alembic current
```

### View Migration History
```bash
docker exec scrappy_kb_app alembic history
```

### Upgrade to Latest
```bash
docker exec scrappy_kb_app alembic upgrade head
```

### Downgrade One Step
```bash
docker exec scrappy_kb_app alembic downgrade -1
```

### Downgrade to Specific Revision
```bash
docker exec scrappy_kb_app alembic downgrade <revision_id>
```

### Show SQL Without Executing
```bash
docker exec scrappy_kb_app alembic upgrade head --sql
```

## Quick Copy-Paste Commands

### Most Common: Create and Apply Migration
```bash
# Create
docker exec scrappy_kb_app alembic revision --autogenerate -m "Add new field to Founder"

# Apply
docker exec scrappy_kb_app alembic upgrade head
```

### Undo Last Migration
```bash
docker exec scrappy_kb_app alembic downgrade -1
```

### Start Fresh (Dangerous - deletes migration history)
```bash
docker exec scrappy_kb_app alembic stamp head
```

## Examples

### Example 1: Add New Field to Founder
```bash
# 1. Edit backend/common/models/founder.py
# 2. Generate migration
docker exec scrappy_kb_app alembic revision --autogenerate -m "Add phone_number to Founder"
# 3. Apply
docker exec scrappy_kb_app alembic upgrade head
```

### Example 2: Create New Model
```bash
# 1. Create backend/common/models/new_model.py
# 2. Import in backend/common/models/__init__.py
# 3. Generate migration
docker exec scrappy_kb_app alembic revision --autogenerate -m "Add NewModel"
# 4. Apply
docker exec scrappy_kb_app alembic upgrade head
```

### Example 3: Rollback Changes
```bash
# Check current version
docker exec scrappy_kb_app alembic current

# Rollback last migration
docker exec scrappy_kb_app alembic downgrade -1

# Verify
docker exec scrappy_kb_app alembic current
```

