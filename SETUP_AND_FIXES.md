# Chocolate Loop - Complete Setup & Fixes Guide

## ✅ Fixes Applied

### 1. **React 18 Warnings - FIXED**
- ✅ Using `createRoot()` instead of `ReactDOM.render()`
- ✅ React Router Future Flags configured (`v7_startTransition`, `v7_relativeSplatPath`)
- ✅ No false React DevTools warnings affecting functionality

### 2. **Backend Connection Issues - FIXED**
- ✅ API error handling with graceful offline fallbacks
- ✅ Automatic retry logic for failed requests
- ✅ Clear error messages when backend is offline
- ✅ Command fixed in api.ts: `cd backend && npm run dev`

### 3. **Chatbot & Voice Commands - FIXED**
- ✅ Error handling for offline backend
- ✅ Fallback responses when API unavailable
- ✅ Voice recognition works with automatic transcript processing
- ✅ Voice replies with text-to-speech

### 4. **Camera USB Detection - FIXED**
- ✅ Auto-detects USB cameras using `navigator.mediaDevices.enumerateDevices()`
- ✅ Automatically switches between USB and laptop camera
- ✅ Listens for device changes (USB plugin/eject events)
- ✅ Shows camera type in the UI (USB External / Built-in)
- ✅ Disables switch when no camera is available

### 5. **Real-time Data Updates - IMPLEMENTED**
- ✅ Polling intervals configured for all data types
  - Inventory: 3000ms
  - Active Tasks: 2000ms
  - Task History: 4000ms
  - Dashboard Summary: 5000ms
- ✅ Auto-reconnect when backend comes online
- ✅ All data persisted to database

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js 16+** (check: `node --version`)
- **Python 3.8+** (check: `python --version`)
- **MySQL 5.7+** running on port 3308 (XAMPP or direct)

### Step 1: Database Setup
```bash
# Initialize database (one-time only)
cd backend
npm run init-db
```

This creates tables for:
- `users` - system operators
- `inventory_items` - stock
- `tasks` - work queue
- `vision_detections` - camera picks
- `task_logs` - audit trail

### Step 2: Environment Configuration

**Create `backend/.env`** (copy from `.env.example`):
```env
DB_HOST=localhost
DB_PORT=3308
DB_USER=root
DB_PASSWORD=
DB_NAME=chocolate_warehouse_db
PORT=5000
JWT_SECRET=your_secret_key_here
```

**Create `frontend/.env`** (optional, defaults to localhost:5000):
```env
VITE_API_BASE=http://localhost:5000/api
```

### Step 3: Start All Services
```bash
# Windows
start_all.bat

# macOS/Linux
chmod +x start_all.bat
./start_all.bat
```

**Expected startup sequence:**
1. Backend checks/installs npm dependencies
2. Frontend checks/installs npm dependencies
3. Vision service checks/installs Python venv
4. Backend starts on port **5000**
5. Frontend starts on port **5173**
6. Vision service starts on port **8001**

Wait 10-15 seconds for all services to be ready.

### Step 4: Access the Application
```
🌐 Frontend:  http://localhost:5173
📱 Login:     admin@choco.com / password123
🤖 API:       http://localhost:5000/api
👁️  Vision:    http://localhost:8001
```

---

## 🔧 Troubleshooting

### ❌ "API offline at localhost:5000"
**Problem:** Backend is not responding
**Solution:**
1. Check if backend window is running
2. Verify port 5000 is not in use:
   ```bash
   netstat -ano | findstr :5000
   ```
3. Restart backend:
   ```bash
   cd backend
   npm run dev
   ```

### ❌ "Database connection failed"
**Problem:** MySQL not running or wrong credentials
**Solution:**
1. Start XAMPP MySQL (port 3308)
2. Verify connection in `backend/.env`:
   ```bash
   mysql -h localhost -P 3308 -u root
   ```
3. If database doesn't exist:
   ```bash
   cd backend
   npm run init-db
   ```

### ❌ "Camera not detected"
**Problem:** No USB or laptop camera available
**Solution:**
1. **For USB Camera:**
   - Check USB is plugged in
   - Click "Camera Configuration" card to see detection
   - Refresh page if camera was just plugged in
2. **For Laptop Camera:**
   - Check browser has permission: Settings → Permissions → Camera
   - Grant access when prompted

### ❌ "Vision service unreachable"
**Problem:** Python vision service not running on port 8001
**Solution:**
1. Check if vision window is running
2. Verify Python and requirements:
   ```bash
   cd vision
   python app.py
   ```
3. Check port 8001 not in use:
   ```bash
   netstat -ano | findstr :8001
   ```

### ❌ "npm install fails"
**Problem:** Node modules installation error
**Solution:**
1. Clear cache:
   ```bash
   npm cache clean --force
   ```
2. Delete `node_modules` and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   ```
3. Reinstall:
   ```bash
   npm install
   ```

### ❌ "Port already in use"
**Problem:** Another process is using the port
**Solution:**
```bash
# Find process using port
netstat -ano | findstr :PORT_NUMBER

# Kill process (Windows)
taskkill /PID PROCESS_ID /F

# Kill process (macOS/Linux)
kill -9 PROCESS_ID
```

---

## 📝 Testing the Application

### ✅ Test Checklist

#### Backend & Database
- [ ] `curl http://localhost:5000/api/dashboard/summary` returns data
- [ ] Inventory page shows items
- [ ] Task creation works
- [ ] Real-time updates happen

#### Frontend
- [ ] Login works (admin@choco.com / password123)
- [ ] All pages load without errors
- [ ] Dark/light theme toggle works
- [ ] All buttons are clickable

#### Camera
- [ ] Camera page detects camera type
- [ ] Toggle master switch turns camera on/off
- [ ] Recent detections update in real-time
- [ ] USB camera is detected automatically

#### Chatbot
- [ ] Chatbot appears in bottom-right
- [ ] Can type and send messages
- [ ] Voice input works (allow permissions)
- [ ] Assistant replies with data
- [ ] System handles offline gracefully

#### Voice Commands
- [ ] "Check inventory" returns stock status
- [ ] "Show active tasks" lists tasks
- [ ] "System status" shows health
- [ ] "Start the camera" toggles vision
- [ ] Commands work even if backend is slow

---

## 🔄 Real-time Data Flow

```
┌─────────────────────────────────────────────────┐
│          Frontend (React/Vite)                  │
│  ┌──────────────────────────────────────────┐  │
│  │ Polling every 2-5 seconds:              │  │
│  │ • /api/inventory                        │  │
│  │ • /api/tasks/active                     │  │
│  │ • /api/tasks/history                    │  │
│  │ • /api/dashboard/summary                │  │
│  │ • /api/vision/detections                │  │
│  └──────────────────────────────────────────┘  │
└──────────────┬──────────────────────────────────┘
               │
        ┌──────▼──────┐
        │ localhost   │
        │ :5000       │
        │             │
        │  Backend    │
        │  (Express)  │
        └──────┬──────┘
               │
        ┌──────▼──────────────────────┐
        │  MySQL Database             │
        │  localhost:3308             │
        │                             │
        │  • inventory_items          │
        │  • tasks                    │
        │  • vision_detections        │
        │  • task_logs                │
        │  • users                    │
        └─────────────────────────────┘
```

---

## 📚 Key Endpoints

### Auth
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Data
- `GET /api/inventory` - List all items
- `POST /api/tasks` - Create new task
- `GET /api/tasks/active` - Active task queue
- `GET /api/tasks/history` - Completed tasks
- `GET /api/vision/detections` - Recent picks
- `GET /api/dashboard/summary` - Dashboard data
- `POST /api/assistant/chat` - AI assistant

### Vision
- `GET /status` - Vision service status
- `POST /start` - Start camera
- `POST /stop` - Stop camera
- `GET /video_feed` - Live stream

---

## 🛠️ Development Commands

```bash
# Backend
cd backend
npm run dev           # Development server
npm run init-db       # Initialize database
npm run seed          # Seed test data

# Frontend
cd frontend
npm run dev           # Development server
npm run build         # Production build
npm run preview       # Preview build

# Vision
cd vision
python app.py         # Start vision service
python stream_server.py # Alternative server
```

---

## 🎯 Next Steps

1. **Start the application** using `start_all.bat`
2. **Log in** with `admin@choco.com` / `password123`
3. **Test each page:**
   - Dashboard - check real-time updates
   - Inventory - verify stock data
   - Tasks - create and monitor tasks
   - Camera - check USB detection and live feed
   - Analytics - view trends
4. **Try voice commands** - "Check inventory", "Show active tasks"
5. **Monitor console** for any errors and refer to troubleshooting

---

## 📞 Support

If you encounter issues:
1. Check **Console Errors** (F12 → Console tab)
2. Check **Network Requests** (F12 → Network tab)
3. Verify all **Services are Running:**
   - Backend: `http://localhost:5000/api/dashboard/summary`
   - Frontend: `http://localhost:5173`
   - Vision: `http://localhost:8001/status`
4. Check **Database Connection:**
   ```bash
   mysql -h localhost -P 3308 -u root chocolate_warehouse_db
   SELECT COUNT(*) FROM inventory_items;
   ```

---

## 📋 All Fixes Summary

| Issue | Status | Fix |
|-------|--------|-----|
| React 18 warnings | ✅ FIXED | Using createRoot + Future flags |
| API offline errors | ✅ FIXED | Error handling + auto-retry |
| Backend not starting | ✅ FIXED | Proper startup script |
| Camera not detected | ✅ FIXED | Auto-detect via mediaDevices API |
| USB camera switching | ✅ FIXED | Device change listener |
| Data not updating | ✅ FIXED | Polling with configurable intervals |
| Voice commands fail | ✅ FIXED | Error handling + offline fallback |
| Chatbot errors | ✅ FIXED | Try-catch + helpful messages |
| Database connection | ✅ FIXED | Connection pooling + auto-retry |

---

**Last Updated:** 2024
**Version:** 1.0 - Production Ready ✅
