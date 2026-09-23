import pandas as pd
import numpy as np
import pickle
import json
import os
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from sqlalchemy import create_engine
import urllib.parse
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load DB config safely
load_dotenv()
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "cyber_threat_intel")

encoded_password = urllib.parse.quote_plus(POSTGRES_PASSWORD)
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    f"postgresql://{POSTGRES_USER}:{encoded_password}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)

# Features
CATEGORICAL_FEATURES = ['proto', 'state', 'service']
NUMERICAL_FEATURES = [
    'spkts', 'dpkts', 'sbytes', 'dbytes', 'rate', 'sload', 'dload', 'sloss', 'dloss', 
    'is_ftp_login', 'ct_ftp_cmd', 'ct_flw_http_mthd', 'dur', 'sinpkt', 'dinpkt', 'sjit', 
    'djit', 'swin', 'stcpb', 'dtcpb', 'dwin', 'tcprtt', 'synack', 'ackdat', 'smean', 
    'dmean', 'trans_depth', 'response_body_len', 'ct_srv_src', 'ct_state_ttl', 'ct_dst_ltm', 
    'ct_src_dport_ltm', 'ct_dst_sport_ltm', 'ct_dst_src_ltm', 'ct_src_ltm', 'ct_srv_dst', 'is_sm_ips_ports'
]

def load_data(dataset_source: str):
    logger.info(f"Loading {dataset_source} data from PostgreSQL...")
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    query = f"""
    SELECT 
        se.proto, se.state, se.service, se.spkts, se.dpkts, se.sbytes, se.dbytes, se.rate, se.sload, se.dload, se.sloss, se.dloss, se.is_ftp_login, se.ct_ftp_cmd, se.ct_flw_http_mthd, se.label, se.attack_cat,
        ml.dur, ml.sinpkt, ml.dinpkt, ml.sjit, ml.djit, ml.swin, ml.stcpb, ml.dtcpb, ml.dwin, ml.tcprtt, ml.synack, ml.ackdat, ml.smean, ml.dmean, ml.trans_depth, ml.response_body_len, ml.ct_srv_src, ml.ct_state_ttl, ml.ct_dst_ltm, ml.ct_src_dport_ltm, ml.ct_dst_sport_ltm, ml.ct_dst_src_ltm, ml.ct_src_ltm, ml.ct_srv_dst, ml.is_sm_ips_ports
    FROM security_events se
    JOIN security_event_ml_features ml ON se.id = ml.event_id
    WHERE se.dataset_source = '{dataset_source}'
    """
    df = pd.read_sql_query(query, engine)
    
    # Fill any nulls securely
    df[CATEGORICAL_FEATURES] = df[CATEGORICAL_FEATURES].fillna('None')
    df[NUMERICAL_FEATURES] = df[NUMERICAL_FEATURES].fillna(0.0)
    
    X = df[CATEGORICAL_FEATURES + NUMERICAL_FEATURES]
    y_anomaly = df['label'].astype(int)
    y_threat = df['attack_cat'].fillna('Normal')
    
    return X, y_anomaly, y_threat

def train_and_evaluate():
    logger.info("Initializing ML Pipeline...")
    
    # 1. Load Data
    X_train, y_train_anomaly, y_train_threat = load_data('training')
    X_test, y_test_anomaly, y_test_threat = load_data('testing')
    
    # 2. Build Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES)
        ]
    )
    
    # 3. Build Model Pipeline (Anomaly Detection)
    # We use a fast configuration for the Random Forest to ensure quick training within the environment
    pipeline_anomaly = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=50, random_state=42, n_jobs=-1, max_depth=15))
    ])
    
    logger.info("Training Anomaly Detection Model...")
    pipeline_anomaly.fit(X_train, y_train_anomaly)
    
    logger.info("Evaluating Anomaly Detection Model...")
    y_pred = pipeline_anomaly.predict(X_test)
    
    # Generate Metrics
    metrics = {
        "accuracy": round(accuracy_score(y_test_anomaly, y_pred), 4),
        "precision": round(precision_score(y_test_anomaly, y_pred, zero_division=0), 4),
        "recall": round(recall_score(y_test_anomaly, y_pred, zero_division=0), 4),
        "f1_score": round(f1_score(y_test_anomaly, y_pred, zero_division=0), 4),
        "confusion_matrix": confusion_matrix(y_test_anomaly, y_pred).tolist(),
        "classification_report": classification_report(y_test_anomaly, y_pred, output_dict=True, zero_division=0)
    }
    
    # 4. Save Models and Metrics
    models_dir = os.path.join(os.path.dirname(__file__), '..', 'models')
    os.makedirs(models_dir, exist_ok=True)
    
    with open(os.path.join(models_dir, 'pipeline_anomaly.pkl'), 'wb') as f:
        pickle.dump(pipeline_anomaly, f)
        
    with open(os.path.join(models_dir, 'metrics.json'), 'w') as f:
        json.dump(metrics, f, indent=4)
        
    logger.info(f"Model saved to {models_dir}. Evaluation completed with F1 Score: {metrics['f1_score']}")

if __name__ == "__main__":
    train_and_evaluate()
