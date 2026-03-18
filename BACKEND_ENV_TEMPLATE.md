# ===== BACKEND ENVIRONMENT VARIABLES FOR DEPLOYMENT =====
# Copy these to Render, Railway, or Heroku dashboard

# ===== MONGODB CONNECTION (Required) =====
# Format: mongodb+srv://username:password@cluster.mongodb.net/?appName=appname
# Get from: https://cloud.mongodb.com/
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=CRMBACKEND

# ===== JWT AUTHENTICATION (Required) =====
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=Be+f8wmO6YoWep2QGu9ezk3zxRr44z8AyfcW9wUo0ro=

# ===== SERVER CONFIGURATION =====
PORT=5000
NODE_ENV=production

# ===== FRONTEND URL (For CORS) =====
# Update to your deployed Vercel frontend URL
FRONTEND_URL=https://your-frontend.vercel.app

# ===== EMAIL CONFIGURATION (Optional - Gmail SMTP) =====
# Get App Password from: https://myaccount.google.com/apppasswords
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ===== REDIS CONFIGURATION (Optional - Caching) =====
# Format: redis://username:password@host:port
REDIS_URL=redis://localhost:6379

# ===== API RATE LIMITING (Optional) =====
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ===== DEPLOYMENT INSTRUCTIONS =====
# 1. Copy this file content
# 2. Go to your Render/Railway dashboard
# 3. In Environment Variables section, paste these
# 4. Replace placeholder values with actual credentials
# 5. Click "Deploy" or "Redeploy"
