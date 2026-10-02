# AI-Powered Cyber Threat Intelligence & Anomaly Detection Dashboard

## Project Overview
This project is a comprehensive, production-ready Security Operations Center (SOC) dashboard. It provides robust network threat classification and anomaly detection powered by a Random Forest machine learning pipeline trained on the UNSW-NB15 dataset.

## Key Features
- **Authentication System**: Secure login and registration with token-based session management.
- **Overview Dashboard**: Real-time KPI cards reflecting actual dataset metrics (Event counts, Attack rates).
- **Security Event Explorer**: Searchable, filterable, and paginated interface for exploring network events.
- **Event Details**: Deep dive into individual network flows, inspecting volumetric, timing, and categorical features.
- **AI Threat Detection**: An interactive ML interface allowing analysts to manually input network parameters or load sample events to receive instant threat predictions and anomaly risk scores.
- **Analytics & Visualizations**: Interactive charts displaying threat distribution, protocol patterns, and service usage.
- **Incident Center**: Create, manage, and investigate cybersecurity incidents, including an automated PDF report parser.
- **Global Feature Importance**: Interpretability visualizations highlighting the most influential features for the ML model.
- **Dark/Light Theme Support**: Persistent, fully responsive, and accessible UI themes.

## Architecture
```text
Frontend (React / Vite)
   ↓ (REST API)
Backend (FastAPI)
   ↓ (SQLAlchemy)
PostgreSQL Database
   ↓ 
ML Pipeline (Scikit-learn Random Forest)
   ↓ 
UNSW-NB15 Dataset
```

## Technologies
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend**: Python, FastAPI, SQLAlchemy, Pydantic, Uvicorn, Passlib
- **Machine Learning**: Scikit-learn, Pandas, NumPy
- **Database**: PostgreSQL (Supabase)

## Dataset
This project uses the **UNSW-NB15** dataset, which is the source of all current security-event analytics and ML training. It is a comprehensive dataset designed to evaluate network intrusion detection systems, containing both normal activities and synthetic contemporary attack behaviors.

## Machine Learning
- **Algorithm**: Random Forest Classifier
- **Features Used**: 39 network flow features (categorical, volumetric, timing)
- **Objective**: Binary Classification (Normal vs. Anomaly)
- **Evaluation**: The model is evaluated on a held-out testing partition, providing robust metrics such as Accuracy, Precision, Recall, and F1 Score.

## Backend API
The FastAPI backend exposes several key routers:
- `/api/auth`: Login and registration endpoints.
- `/api/events`: Paginated and filterable security event retrieval.
- `/api/analytics`: Aggregation endpoints for dashboard charts.
- `/api/ml`: The core prediction endpoint (`/predict`), feature importance, and performance metrics.
- `/api/incidents`: Incident management and PDF parsing.

## Installation & Setup (Windows)

1. **Clone the repository**:
   Ensure you have the project locally in `D:\CyberThreatIntelligence`.

2. **Database Setup**:
   The project requires a PostgreSQL database. Set up your connection string.

3. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

## Environment Variables
Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
DATABASE_URL=postgresql://user:password@host:port/dbname
SECRET_KEY=your_secure_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://127.0.0.1:8000
```

## Running the Project
**Backend**:
```bash
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

**Frontend**:
```bash
cd frontend
npm run dev
```

## Limitations
- **Dataset-based nature**: The events and analytics are derived from the static UNSW-NB15 dataset.
- **No live SOC feed**: This platform currently operates on historical/sample data and is not connected to a live enterprise network tap.
- **Model limitations**: The model is trained specifically on the network topologies and attacks present in the dataset and may require retraining for novel environments.

## Future Improvements
- Live network packet ingestion (e.g., via Zeek or Suricata).
- SIEM integration for aggregated log analysis.
- External threat-intelligence feed integration (e.g., VirusTotal, AbuseIPDB).
- Advanced anomaly detection using Deep Learning (Autoencoders).
- Automated alerting via email or Slack.
