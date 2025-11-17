# Quick Start Guide - A.W.A.R.E. System

## Prerequisites Check

Before starting, ensure you have:
- ✅ Python 3.8+ installed (`python3 --version`)
- ✅ Node.js 18+ installed (`node --version`)
- ✅ npm installed (`npm --version`)

---

## Running the System (2 Terminals Required)

### Terminal 1: Backend (FastAPI)

```bash
# Navigate to backend
cd backend

# Create and activate virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend will be running at:**
- API: http://localhost:8000
- Swagger Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

### Terminal 2: Frontend (React + Vite)

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

**Frontend will be running at:**
- App: http://localhost:5173

---

## Quick Test Commands

### Test Backend (in a new terminal)

```bash
# Health check
curl http://localhost:8000/

# Get sensor data
curl http://localhost:8000/sensors

# Get leak detection results
curl http://localhost:8000/leaks
```

### Access Frontend
Open your browser and navigate to: http://localhost:5173

---

## Folder Structure

```
aware-water-agent/
├── backend/          ← FastAPI server
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/         ← React app
│   ├── src/
│   ├── package.json
│   └── .env
├── WIREFRAMES.md     ← UI documentation
├── README.md         ← Full documentation
└── QUICKSTART.md     ← This file
```

---

## Common Issues

### Backend not starting?
```bash
cd backend
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend not starting?
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Port already in use?
- Backend: Change port in terminal: `uvicorn main:app --reload --port 8001`
- Frontend: Update `vite.config.ts` port setting

---

## What's Working?

### Backend Endpoints ✅
- GET `/` - Health check
- GET `/sensors` - Simulated sensor data (10 pipes)
- GET `/leaks` - Leak detection (pressure < 60 & acoustic > 0.7)

### Frontend Pages ✅
- `/` - Landing page
- `/auth` - Authentication
- `/dashboard` - Main dashboard with metrics
- `/network` - Interactive network map
- `/incidents` - Event management
- `/agents` - AI agents overview
- `/energy` - Energy optimization
- `/admin` - System administration
- `/team` - Team information

---

## Next Steps

1. **Start both services** (backend + frontend)
2. **Open** http://localhost:5173 in your browser
3. **Navigate to** `/auth` to sign in (if Supabase is configured)
4. **Explore** the dashboard and all pages
5. **Check** WIREFRAMES.md for detailed UI documentation
6. **Read** README.md for complete project documentation

---

## Need Help?

- Full documentation: [README.md](./README.md)
- UI wireframes: [WIREFRAMES.md](./WIREFRAMES.md)
- Backend docs: [backend/README.md](./backend/README.md)
- Frontend docs: [frontend/README.md](./frontend/README.md)

## Contact

Team A.W.A.R.E.:
- Raymond Li: raymond.li01@sjsu.edu
- Sophia Atendido: sophia.atendido@sjsu.edu
- Jack Liang: jack.liang@sjsu.edu
- Dhruv Verma: dhruv.verma01@sjsu.edu
