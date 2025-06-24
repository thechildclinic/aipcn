# AI-Powered Care Backend - Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### 1. Environment Setup
```bash
# Clone repository
git clone <repository-url>
cd AIPC/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration
```

### 2. Database Setup
```bash
# Create database
createdb aipc_development

# Setup demo data
node scripts/demo-setup.js
```

### 3. Start Development Server
```bash
# Build and start
npm run build
npm run dev

# Server runs at http://localhost:5000
# API docs at http://localhost:5000/api
```

### 4. Run Demo
```bash
# Test all endpoints
./scripts/demo-api-test.sh

# Import Postman collection
# File: postman/AIPC-Backend-API.postman_collection.json
```

## Production Deployment

### Docker Deployment (Recommended)

#### 1. Production Environment Setup
```bash
# Create production environment file
cp .env.example .env.production

# Configure production values
DB_HOST=postgres-primary
DB_NAME=aipc_production
JWT_SECRET=<strong-production-secret>
GEMINI_API_KEY=<your-api-key>
ALLOWED_ORIGINS=https://yourdomain.com
```

#### 2. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p ssl

# Add your SSL certificates
# ssl/cert.pem - SSL certificate
# ssl/key.pem - Private key
```

#### 3. Deploy with Docker Compose
```bash
# Production deployment
docker-compose -f docker-compose.production.yml up -d

# Monitor deployment
docker-compose -f docker-compose.production.yml logs -f
```

### AWS ECS Deployment

#### 1. Infrastructure Setup
```bash
# Create VPC and subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create ECS cluster
aws ecs create-cluster --cluster-name aipc-production

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier aipc-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username aipc_user \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxxxxxxx
```

#### 2. Container Registry
```bash
# Build and push to ECR
aws ecr create-repository --repository-name aipc-backend

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t aipc-backend .
docker tag aipc-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/aipc-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/aipc-backend:latest
```

#### 3. ECS Service Deployment
```bash
# Create task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster aipc-production \
  --service-name aipc-backend \
  --task-definition aipc-backend:1 \
  --desired-count 2 \
  --load-balancers targetGroupArn=<target-group-arn>,containerName=aipc-backend,containerPort=5000
```

## Security Configuration

### HIPAA Compliance Checklist

#### Administrative Safeguards
- [ ] Security Officer assigned
- [ ] Workforce training completed
- [ ] Access management procedures documented
- [ ] Incident response plan in place

#### Physical Safeguards
- [ ] Data center security verified (AWS SOC 2)
- [ ] Workstation security policies enforced
- [ ] Media controls documented

#### Technical Safeguards
- [ ] Access controls implemented (MFA, RBAC)
- [ ] Audit logs enabled and monitored
- [ ] Data integrity controls in place
- [ ] Transmission security (TLS 1.3)

### Security Configuration
```bash
# Generate strong secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET

# Setup SSL certificates
certbot certonly --standalone -d yourdomain.com

# Configure firewall
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

## Monitoring & Maintenance

### Health Monitoring
```bash
# Health check endpoint
curl https://yourdomain.com/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "production",
  "database": "connected"
}
```

### Log Management
```bash
# View application logs
docker-compose logs -f backend

# Monitor error logs
tail -f logs/error.log

# Check audit logs
tail -f logs/audit.log
```

### Performance Monitoring
```bash
# Database performance
docker exec -it aipc-postgres psql -U aipc_user -d aipc_production -c "
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;"

# Redis performance
docker exec -it aipc-redis redis-cli info stats
```

## Backup & Recovery

### Database Backup
```bash
# Automated daily backup
pg_dump -h localhost -U aipc_user aipc_production | \
  gzip > backups/aipc_$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip -c backups/aipc_20240115.sql.gz | \
  psql -h localhost -U aipc_user aipc_production
```

### Application Backup
```bash
# Backup configuration
tar -czf backups/config_$(date +%Y%m%d).tar.gz \
  .env nginx/ ssl/ logs/

# Backup uploaded files
tar -czf backups/uploads_$(date +%Y%m%d).tar.gz uploads/
```

## Scaling Considerations

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose -f docker-compose.production.yml up -d --scale backend=4

# Load balancer configuration
# Update nginx upstream configuration
```

### Database Scaling
```bash
# Read replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier aipc-db-replica \
  --source-db-instance-identifier aipc-db

# Connection pooling
# Configure PgBouncer for connection management
```

## Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
docker exec -it aipc-postgres pg_isready -U aipc_user

# Check connection pool
docker exec -it aipc-backend npm run db:status
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Monitor API response times
curl -w "@curl-format.txt" -s -o /dev/null https://yourdomain.com/health
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Renew certificates
certbot renew --dry-run
```

### Emergency Procedures

#### Service Recovery
```bash
# Restart all services
docker-compose -f docker-compose.production.yml restart

# Rollback to previous version
docker-compose -f docker-compose.production.yml down
docker pull <previous-image-tag>
docker-compose -f docker-compose.production.yml up -d
```

#### Database Recovery
```bash
# Emergency database restore
pg_restore -h localhost -U aipc_user -d aipc_production \
  backups/aipc_emergency.dump
```

## Support Contacts

### Technical Support
- **DevOps Team**: devops@aipc.com
- **Security Team**: security@aipc.com
- **Database Team**: dba@aipc.com

### Emergency Contacts
- **On-Call Engineer**: +1-617-555-0199
- **Security Incident**: security-incident@aipc.com
- **System Outage**: outage@aipc.com

## Additional Resources

### Documentation
- [API Reference](docs/api-reference.md)
- [Database Schema](docs/database-schema.md)
- [User Manuals](docs/user-manual-patients.md)
- [Security Guide](deployment/hipaa-compliance-checklist.md)

### Monitoring Dashboards
- **Application Metrics**: https://grafana.yourdomain.com
- **Infrastructure**: https://prometheus.yourdomain.com
- **Logs**: https://kibana.yourdomain.com
- **Uptime**: https://status.yourdomain.com

### Development Resources
- **Repository**: https://github.com/yourorg/aipc-backend
- **CI/CD Pipeline**: https://github.com/yourorg/aipc-backend/actions
- **Issue Tracking**: https://github.com/yourorg/aipc-backend/issues
- **Documentation**: https://docs.aipc.com
