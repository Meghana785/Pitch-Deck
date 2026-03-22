<!-- # PitchReady README
# PitchReady: Mult-agent AI web application -->

## 🚀 Running the Project

This application consists of three main components: a Next.js Frontend, a FastAPI Backend, and a Python Worker.

### Option 1: Using Docker Compose (Recommended)
The easiest way to run the entire stack is using Docker Compose. Make sure you have Docker installed on your machine.

```bash
docker-compose up --build
```
This will start:
- **Nginx proxy** on ports `80` and `443`
- **Backend API** on port `8000`
- **Background Worker** process

*Note: Ensure your `.env` files are properly configured in the root or respective directories before running.*

---

### Option 2: Local Development Setup (Manual)

If you prefer to run the services individually for development, open three separate terminal windows and follow the steps below:

#### 1. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
The frontend will be available at [http://localhost:3000](http://localhost:3000).

#### 2. Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
The API will be available at [http://localhost:8000](http://localhost:8000). You can view the interactive API docs at `http://localhost:8000/docs`.

#### 3. Worker (Background Tasks)
```bash
cd worker
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
python worker.py
```
