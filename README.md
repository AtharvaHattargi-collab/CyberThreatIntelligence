# Cyber Threat Intelligence (CTI) SOC Dashboard

A premium Security Operations Center (SOC) dashboard utilizing the UNSW-NB15 dataset and Random Forest machine learning model to classify and monitor network threats.

## QUICK START (Windows)

1. **Install PostgreSQL** (Make sure the service is running).
2. **Install Node.js** (v18+ recommended).
3. **Install Python** (3.9+ recommended).
4. **Configure Environment Variables**:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your PostgreSQL database credentials (`DB_PASSWORD`, `DB_NAME`, etc.).
5. **Start the Application**:
   - Double-click `START_CTI.bat` in the project root.
6. **Open the application**:
   - The script will automatically open your browser to the frontend.

## Services & URLs

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: [http://localhost:8001](http://localhost:8001)
- **Swagger API Docs**: [http://localhost:8001/docs](http://localhost:8001/docs)

## Project Scripts

- `START_CTI.bat` - Starts both frontend (Vite) and backend (FastAPI) servers on correct ports.
- `STOP_CTI.bat` - Safely stops the background node.exe and python.exe processes holding ports 5173 and 8001.
- `STATUS_CTI.bat` - Checks the health of both the backend and frontend.
- `RESTART_CTI.bat` - Safely stops and restarts both services.

## Production / Deployment

### Backend
To run the backend without development reload, activate your environment and start uvicorn directly:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
To produce a static production bundle:
```bash
cd frontend
npm run build
```
The compiled static assets will be located in the `frontend/dist` directory. Serve this folder using Nginx, Apache, or any static file server.

## GitHub Readiness & Large Files

The machine learning pipeline model (`backend/models/pipeline_anomaly.pkl` - ~6.2 MB) and the Parquet dataset files (`dataset/*.parquet` - ~14 MB total) are relatively small and technically fit within GitHub's standard 100 MB per-file limit. 

However, best practices dictate that binary models and raw datasets should not be committed directly into Git history. They have been added to `.gitignore`. 
**Deployment Strategy:** Store these files in **Git LFS (Large File Storage)**, or an object storage bucket (e.g., AWS S3), and fetch them dynamically during your CI/CD deployment pipeline.
