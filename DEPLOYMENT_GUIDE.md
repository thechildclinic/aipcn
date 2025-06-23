# 🚀 AIPC Healthcare Platform - Deployment Guide

## 🎯 **RECOMMENDED DEPLOYMENT PLATFORMS**

After thorough analysis, here are the best platforms for deploying AIPC, ranked by ease of use and reliability:

### **🥇 OPTION 1: VERCEL (RECOMMENDED)**
- **Best For**: Quick deployment with minimal configuration
- **Pros**: Automatic builds, global CDN, excellent performance, built-in monitoring
- **Cons**: Function timeout limits (30s max)
- **Cost**: Free tier available, $20/month for pro features

### **🥈 OPTION 2: RAILWAY**
- **Best For**: Full-stack applications with databases
- **Pros**: Simple CLI deployment, automatic scaling, built-in databases
- **Cons**: Newer platform, limited free tier
- **Cost**: $5/month minimum

### **🥉 OPTION 3: RENDER**
- **Best For**: Production applications with custom domains
- **Pros**: Free tier, automatic SSL, easy scaling
- **Cons**: Cold starts on free tier
- **Cost**: Free tier available, $7/month for always-on

---

## 🚀 **OPTION 1: VERCEL DEPLOYMENT (RECOMMENDED)**

### **Prerequisites**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login
```

### **Step 1: Environment Setup**
```bash
# Set environment variables in Vercel
vercel env add GEMINI_API_KEY
# Paste your Gemini API key when prompted
```

### **Step 2: Deploy**
```bash
# From your project root
vercel

# Follow the prompts:
# ? Set up and deploy "~/aipc/AIPC"? [Y/n] y
# ? Which scope do you want to deploy to? [Your account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? aipc-healthcare-platform
# ? In which directory is your code located? ./

# Deploy to production
vercel --prod
```

### **Step 3: Verify Deployment**
```bash
# Test the deployed API
curl https://your-deployment-url.vercel.app/api/health

# Test the frontend
open https://your-deployment-url.vercel.app
```

---

## 🚂 **OPTION 2: RAILWAY DEPLOYMENT**

### **Prerequisites**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### **Step 1: Initialize Project**
```bash
# Initialize Railway project
railway init

# Set environment variables
railway variables set GEMINI_API_KEY=your_api_key_here
railway variables set NODE_ENV=production
```

### **Step 2: Deploy**
```bash
# Deploy the application
railway up

# Monitor deployment
railway logs
```

### **Step 3: Custom Domain (Optional)**
```bash
# Add custom domain
railway domain add yourdomain.com
```

---

## 🎨 **OPTION 3: RENDER DEPLOYMENT**

### **Step 1: Create render.yaml**
```yaml
services:
  - type: web
    name: aipc-backend
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: GEMINI_API_KEY
        sync: false
      - key: NODE_ENV
        value: production

  - type: web
    name: aipc-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /api/*
        destination: https://aipc-backend.onrender.com/api/*
      - type: rewrite
        source: /*
        destination: /index.html
```

### **Step 2: Deploy via Git**
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy automatically

---

## 🐳 **OPTION 4: DOCKER DEPLOYMENT**

### **Step 1: Build Docker Image**
```bash
# Build the image
docker build -t aipc-healthcare-platform .

# Test locally
docker run -p 3001:3001 -e GEMINI_API_KEY=your_api_key aipc-healthcare-platform
```

### **Step 2: Deploy to Cloud**

#### **AWS ECS**
```bash
# Tag for ECR
docker tag aipc-healthcare-platform:latest your-account.dkr.ecr.region.amazonaws.com/aipc:latest

# Push to ECR
docker push your-account.dkr.ecr.region.amazonaws.com/aipc:latest

# Deploy via ECS CLI or AWS Console
```

#### **Google Cloud Run**
```bash
# Tag for GCR
docker tag aipc-healthcare-platform gcr.io/your-project/aipc

# Push to GCR
docker push gcr.io/your-project/aipc

# Deploy to Cloud Run
gcloud run deploy aipc --image gcr.io/your-project/aipc --platform managed
```

---

## 🔧 **PRE-DEPLOYMENT CHECKLIST**

### **✅ Code Quality**
```bash
# Run all tests
npm test

# Check TypeScript compilation
npm run build

# Lint code
npm run lint

# Security audit
npm audit
```

### **✅ Environment Variables**
- [ ] `GEMINI_API_KEY` - Your Google Gemini API key
- [ ] `NODE_ENV` - Set to "production"
- [ ] `PORT` - Set to 3001 (or platform default)

### **✅ Dependencies**
```bash
# Verify all dependencies are installed
npm install
cd backend && npm install

# Check for vulnerabilities
npm audit fix
```

### **✅ Build Verification**
```bash
# Test frontend build
npm run build
ls -la dist/

# Test backend build
cd backend && npm run build
ls -la dist/
```

---

## 🔍 **POST-DEPLOYMENT VERIFICATION**

### **Health Check Endpoints**
```bash
# Backend health
curl https://your-domain.com/api/health

# API functionality
curl -X POST https://your-domain.com/api/doctor-assist/specialty-diagnosis \
  -H "Content-Type: application/json" \
  -d '{"symptoms": "test", "chatHistory": [], "patientProfile": {"age": "30"}, "clinicSpecialty": "General Practice"}'
```

### **Frontend Verification**
1. **Login Test**: Try logging in with test accounts
2. **Role Routing**: Verify each role redirects to correct dashboard
3. **AI Features**: Test symptom checker and drug interactions
4. **Responsive Design**: Test on mobile and desktop

### **Performance Testing**
```bash
# Load testing with Apache Bench
ab -n 100 -c 10 https://your-domain.com/

# API performance testing
ab -n 50 -c 5 -p test-payload.json -T application/json https://your-domain.com/api/doctor-assist/specialty-diagnosis
```

---

## 🚨 **TROUBLESHOOTING COMMON ISSUES**

### **Build Failures**
```bash
# Clear node_modules and reinstall
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install

# Check Node.js version (should be 18+)
node --version

# Verify TypeScript compilation
npx tsc --noEmit
```

### **API Errors**
```bash
# Check environment variables
echo $GEMINI_API_KEY

# Test API key directly
curl -H "Authorization: Bearer $GEMINI_API_KEY" https://generativelanguage.googleapis.com/v1/models

# Check server logs
tail -f logs/app.log
```

### **Frontend Issues**
```bash
# Check build output
npm run build 2>&1 | tee build.log

# Verify static files
ls -la dist/

# Test local build
npx serve dist
```

---

## 📊 **MONITORING & MAINTENANCE**

### **Health Monitoring**
```bash
# Set up monitoring endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/metrics
```

### **Log Management**
- **Vercel**: Built-in function logs
- **Railway**: `railway logs`
- **Render**: Dashboard logs
- **Docker**: `docker logs container-name`

### **Performance Monitoring**
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure error tracking (Sentry, LogRocket)
- Monitor API response times
- Track user engagement metrics

---

## 🎯 **RECOMMENDED DEPLOYMENT STRATEGY**

### **For Development/Testing**
1. **Vercel** - Quick deployment and testing
2. Free tier sufficient for initial testing
3. Easy rollbacks and branch deployments

### **For Production**
1. **Railway** or **Render** - More robust for production workloads
2. Custom domain and SSL certificates
3. Database integration for user data
4. Monitoring and alerting setup

### **For Enterprise**
1. **Docker + AWS/GCP** - Full control and scalability
2. Load balancing and auto-scaling
3. Database clusters and backups
4. Comprehensive monitoring and logging

---

## 📞 **DEPLOYMENT SUPPORT**

If you encounter any issues during deployment:

1. **Check the logs** first - most issues are environment-related
2. **Verify API key** - Ensure Gemini API key is correctly set
3. **Test locally** - Ensure everything works locally before deploying
4. **Contact support** - Reach out if you need assistance

**Ready to deploy? Start with Vercel for the quickest path to production!** 🚀
