# 🚀 Quick Start Guide - Get Running in 10 Minutes

## Prerequisites Check
```bash
node --version  # Should be 18+
mysql --version # Should be 8.0+
npm --version   # Should be 9+
```

---

## Option 1: Local Development (Fastest)

### Step 1: Database Setup (2 minutes)
```bash
# Start MySQL
mysql -u root -p

# Create database
CREATE DATABASE hospital_queue_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# Load schema
mysql -u root -p hospital_queue_db < database/schema.sql

# Seed sample data
cd database
npm install
node seed.js
cd ..
```

### Step 2: Backend Setup (3 minutes)
```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your MySQL password
nano .env  # or use any text editor

# Start backend
npm run dev
```

**Backend is now running at http://localhost:5000**

### Step 3: Frontend Setup (3 minutes)
```bash
# Open new terminal
cd frontend
npm install

# Start frontend
npm start
```

**Frontend opens automatically at http://localhost:3000**

### Step 4: Test the System (2 minutes)
1. **Open browser**: http://localhost:3000
2. **Book an appointment**:
   - Click "Book Appointment Now"
   - Select Tikur Anbessa Hospital
   - Choose Cardiology department
   - Pick tomorrow's date
   - Select a time slot
   - Fill in patient details
3. **Check queue position**:
   - Click "Check Queue Position"
   - Enter your appointment number (shown after booking)
   - See real-time position!

---

## Option 2: Docker (Even Easier!)

### Prerequisites
- Docker & Docker Compose installed

### One Command Deploy
```bash
# 1. Create environment file
cp .env.example .env

# 2. Edit database password
nano .env

# 3. Start everything
docker-compose up -d

# Wait 30 seconds for database initialization...

# 4. Seed database
docker-compose exec backend node /app/../database/seed.js
```

**Access the system:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Testing USSD Flow (Simulator)

Since you might not have Africa's Talking credentials yet, test USSD via API:

```bash
# Simulate USSD session
curl -X POST http://localhost:5000/api/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "serviceCode": "*711#",
    "phoneNumber": "+251911111111",
    "text": ""
  }'

# Expected response:
# CON Welcome to HealthQueue
# 1. Book Appointment
# 2. Check Queue Position
# 3. Cancel Appointment
```

---

## Sample Login Credentials

After seeding database, use these to access staff dashboards:

**Admin**
- Username: `admin`
- Password: `password123`

**Reception**
- Username: `tikur_reception`
- Password: `password123`

**Doctor**
- Username: `dr.abebe`
- Password: `password123`

---

## Common Issues & Fixes

### Issue: "Error: connect ECONNREFUSED"
**Fix:** MySQL not running
```bash
# Mac
brew services start mysql

# Ubuntu
sudo systemctl start mysql

# Windows
net start MySQL80
```

### Issue: "Port 3000 already in use"
**Fix:** Kill the process
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "Database connection failed"
**Fix:** Check .env credentials
```bash
# Verify MySQL password
mysql -u root -p

# Update backend/.env with correct password
DB_PASSWORD=your_actual_password
```

### Issue: Frontend can't reach backend
**Fix:** Check proxy setting in frontend/package.json
```json
"proxy": "http://localhost:5000"
```

---

## Verify Everything is Working

### Backend Health Check
```bash
curl http://localhost:5000/health
# Should return: {"status":"healthy"}
```

### Get Hospitals
```bash
curl http://localhost:5000/api/hospitals
# Should return list of 4 hospitals
```

### WebSocket Connection
Open browser console at http://localhost:3000 and check for:
```
Socket connected
```

---

## Next Steps

1. **Customize Settings**
   - Edit hospital names in database
   - Update contact information
   - Configure SMS credentials (Africa's Talking)

2. **Production Deployment**
   - See README.md for detailed deployment guides
   - Configure domain & SSL
   - Set up monitoring

3. **User Training**
   - Train reception staff on dashboard
   - Test USSD flow with real phones
   - Create patient awareness materials

---

## Need Help?

- **Documentation**: See README.md for full details
- **Project Summary**: See PROJECT_SUMMARY.md for features
- **API Docs**: See backend/routes/*.js for endpoints
- **Issues**: Open GitHub issue with logs

---

## Performance Tips

### Speed Up Development
```bash
# Backend hot reload
npm run dev  # Uses nodemon

# Frontend hot reload
# Already enabled by default with npm start
```

### Database Optimization
```bash
# Add indexes if querying gets slow
ALTER TABLE appointments ADD INDEX idx_custom (column_name);

# Check slow queries
mysql> SHOW FULL PROCESSLIST;
```

### Monitor in Real-Time
```bash
# Backend logs
tail -f backend/logs/combined.log

# MySQL slow queries
mysql> SET GLOBAL slow_query_log = 'ON';
```

---

## Success Checklist ✅

- [ ] MySQL running and database created
- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:3000
- [ ] Can create an appointment
- [ ] Can check queue position
- [ ] Reception dashboard shows queue
- [ ] Real-time updates work (open 2 browser tabs)
- [ ] Sample data visible

**All checked? You're ready to go! 🎉**

---

## Production Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configure Africa's Talking API keys
- [ ] Set up SSL certificate (Let's Encrypt)
- [ ] Configure backup schedule
- [ ] Set up monitoring (UptimeRobot)
- [ ] Test on real feature phone (USSD)
- [ ] Load test with expected traffic
- [ ] Train hospital staff
- [ ] Create patient awareness campaign

---

**Happy Coding! 🚀**
