---
name: production_readiness_auditor
description: Audit application for production readiness, security, performance, and best practices
---

When this skill is invoked, perform a comprehensive production readiness audit across all application layers.

## Step 1: Security Audit

### Backend Security Checklist
```bash
# Check for exposed secrets
grep -r "API_KEY\|SECRET\|PASSWORD" --include="*.py" --exclude-dir=".env" backend/

# Verify environment variables
cat backend/.env.example

# Check for SQL injection vulnerabilities
grep -r "execute\|raw" backend/app/ --include="*.py"

# Verify authentication on protected routes
grep -r "@router" backend/app/routers/ -A 5 | grep -i "depends.*current_user"
```

**Security Requirements:**
- [ ] No hardcoded secrets in code
- [ ] All API keys in .env file
- [ ] JWT tokens expire (30 minutes max)
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (using ORM)
- [ ] XSS prevention (no dangerouslySetInnerHTML)
- [ ] CSRF protection enabled
- [ ] Prompt injection prevention in AI service
- [ ] Password hashing with bcrypt
- [ ] Secure session management

### Frontend Security Checklist
```bash
# Check for exposed API keys
grep -r "API_KEY\|SECRET" frontend/ --include="*.ts" --include="*.tsx" --exclude-dir="node_modules"

# Check for dangerouslySetInnerHTML
grep -r "dangerouslySetInnerHTML" frontend/

# Verify environment variables
cat frontend/.env.local.example
```

**Frontend Security:**
- [ ] No API keys in client code
- [ ] All secrets use NEXT_PUBLIC_ prefix only for public data
- [ ] JWT stored securely (httpOnly cookies preferred)
- [ ] Input sanitization before API calls
- [ ] No eval() or Function() usage
- [ ] Content Security Policy configured

## Step 2: Performance Audit

### Backend Performance
```python
# Test database query performance
import time
from app.database.session import SessionLocal
from app.models.recipe import Recipe

db = SessionLocal()
start = time.time()
recipes = db.query(Recipe).limit(100).all()
end = time.time()
print(f"Query time: {end - start}s")  # Should be < 0.1s

# Check for N+1 queries
# Use SQLAlchemy query logging
```

**Performance Requirements:**
- [ ] Database indexes on foreign keys
- [ ] Connection pooling configured (pool_size=10)
- [ ] Redis caching for repeated queries
- [ ] Async endpoints (all routes use async def)
- [ ] API response time < 5 seconds
- [ ] Database queries optimized (no N+1)
- [ ] Pagination on list endpoints
- [ ] Gzip compression enabled

### Frontend Performance
```bash
# Build and analyze bundle size
cd frontend
npm run build
npm run analyze  # If next-bundle-analyzer installed

# Check for large dependencies
npx depcheck
```

**Frontend Performance:**
- [ ] Images use Next.js Image component
- [ ] Code splitting implemented
- [ ] Lazy loading for heavy components
- [ ] React Query for caching
- [ ] Debouncing on search inputs
- [ ] Optimistic updates for better UX
- [ ] Bundle size < 500KB (gzipped)

## Step 3: Code Quality Audit

### Backend Code Quality
```bash
# Run type checking
cd backend
mypy app/

# Run linting
flake8 app/

# Check code complexity
radon cc app/ -a

# Security vulnerabilities
bandit -r app/
```

**Code Quality Standards:**
- [ ] Type hints on all functions
- [ ] Docstrings on public functions
- [ ] No unused imports
- [ ] Consistent code formatting (black)
- [ ] No code duplication
- [ ] Error handling on all endpoints
- [ ] Logging configured properly
- [ ] No print() statements (use logger)

### Frontend Code Quality
```bash
# Type checking
cd frontend
npx tsc --noEmit

# Linting
npx eslint . --ext .ts,.tsx

# Check for unused dependencies
npx depcheck
```

**Frontend Standards:**
- [ ] No `any` types
- [ ] All components properly typed
- [ ] No console.log in production
- [ ] Proper error boundaries
- [ ] Accessibility attributes (alt, aria-label)
- [ ] Responsive design (mobile-first)
- [ ] Loading states on async operations
- [ ] Error states displayed to user

## Step 4: Testing Coverage

### Backend Tests
```bash
# Run tests with coverage
cd backend
pytest --cov=app --cov-report=html

# Minimum coverage: 80%
```

**Required Tests:**
- [ ] Unit tests for services
- [ ] Integration tests for API endpoints
- [ ] Authentication flow tests
- [ ] Database repository tests
- [ ] AI service mock tests
- [ ] Error handling tests
- [ ] Rate limiting tests

### Frontend Tests
```bash
# Run tests
cd frontend
npm test -- --coverage

# Minimum coverage: 70%
```

**Required Tests:**
- [ ] Component unit tests
- [ ] API client tests (mocked)
- [ ] Hook tests
- [ ] Integration tests for key flows
- [ ] E2E tests for critical paths

## Step 5: Database Audit

```sql
-- Check indexes
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public';

-- Check table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public';

-- Check slow queries (if logging enabled)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Database Requirements:**
- [ ] Indexes on all foreign keys
- [ ] Indexes on frequently queried columns
- [ ] Database migrations tested
- [ ] Backup strategy configured
- [ ] Connection pooling optimized
- [ ] Query performance acceptable
- [ ] No missing constraints

## Step 6: API Documentation

```bash
# Generate OpenAPI docs
cd backend
python -c "from app.main import app; import json; print(json.dumps(app.openapi()))" > openapi.json
```

**Documentation Requirements:**
- [ ] OpenAPI/Swagger docs available
- [ ] All endpoints documented
- [ ] Request/response schemas defined
- [ ] Authentication requirements clear
- [ ] Error responses documented
- [ ] Rate limits documented
- [ ] Example requests provided

## Step 7: Environment Configuration

### Production Environment Variables Audit

**Backend (.env):**
```bash
# Required variables
DATABASE_URL=postgresql://...  # Production database
SECRET_KEY=...  # Min 32 chars, cryptographically secure
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
REDIS_URL=...
ALLOWED_ORIGINS=["https://yourapp.com"]
ENVIRONMENT=production
DEBUG=False
LOG_LEVEL=INFO
```

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://api.yourapp.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

**Verification:**
- [ ] All required variables present
- [ ] No development values in production
- [ ] Secrets are secure (not in git)
- [ ] CORS origins match frontend URL
- [ ] DEBUG=False in production
- [ ] Proper log levels set

## Step 8: Monitoring & Logging

### Backend Logging
```python
# app/main.py
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

**Monitoring Requirements:**
- [ ] Structured logging configured
- [ ] Error tracking (Sentry) integrated
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Database monitoring active
- [ ] API metrics tracked
- [ ] Alert thresholds set

## Step 9: Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] SSL certificate valid
- [ ] Domain configured
- [ ] CORS settings correct
- [ ] Rate limiting tested

### Post-Deployment
- [ ] Health check endpoint responding
- [ ] Authentication flow working
- [ ] Recipe generation working
- [ ] Database connections stable
- [ ] Redis caching working
- [ ] Monitoring dashboards active
- [ ] Error tracking receiving data
- [ ] Backup jobs running
- [ ] SSL certificate valid
- [ ] Performance acceptable

## Step 10: Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test health endpoint
ab -n 1000 -c 10 https://api.yourapp.com/health

# Test recipe generation
ab -n 100 -c 5 -p recipe.json -T application/json https://api.yourapp.com/recipe/generate-recipe
```

**Load Testing Requirements:**
- [ ] Health endpoint: 1000 req/s
- [ ] Recipe generation: 10 req/s
- [ ] No errors under normal load
- [ ] Response times acceptable
- [ ] Database connections stable
- [ ] Memory usage stable
- [ ] CPU usage acceptable

## Step 11: Disaster Recovery

**Backup Strategy:**
- [ ] Database automated backups (daily)
- [ ] Backup retention policy (30 days)
- [ ] Backup restore tested
- [ ] Code in version control
- [ ] Environment variables documented
- [ ] Deployment process documented
- [ ] Rollback procedure tested

**Recovery Plan:**
- [ ] Database restore procedure documented
- [ ] Application rollback procedure documented
- [ ] Incident response plan created
- [ ] Contact information updated
- [ ] Escalation path defined

## Step 12: Final Production Checklist

### Critical Items
- [ ] All secrets secured
- [ ] HTTPS enforced
- [ ] Authentication working
- [ ] Rate limiting active
- [ ] Error tracking configured
- [ ] Backups automated
- [ ] Monitoring active
- [ ] Documentation complete

### Performance
- [ ] API response < 5s
- [ ] Database queries optimized
- [ ] Caching implemented
- [ ] Bundle size optimized

### Quality
- [ ] Tests passing (80%+ coverage)
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Error handling complete
- [ ] Accessibility compliant

### Operations
- [ ] Health check working
- [ ] Logs aggregated
- [ ] Alerts configured
- [ ] Rollback tested
- [ ] Team trained

## Audit Report Template

```markdown
# Production Readiness Audit Report

**Date:** [Date]
**Auditor:** [Name]
**Application:** AI Recipe Generator

## Summary
- Security: ✅ PASS / ❌ FAIL
- Performance: ✅ PASS / ❌ FAIL
- Code Quality: ✅ PASS / ❌ FAIL
- Testing: ✅ PASS / ❌ FAIL
- Documentation: ✅ PASS / ❌ FAIL

## Critical Issues
1. [Issue description]
   - Severity: High/Medium/Low
   - Impact: [Description]
   - Recommendation: [Fix]

## Recommendations
1. [Recommendation]
2. [Recommendation]

## Sign-off
Ready for production: YES / NO
```

Run this comprehensive audit before every production deployment.
