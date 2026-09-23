import json
import os
import pickle
import numpy as np
import pandas as pd
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter(prefix="/api/ml", tags=["ml"])

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
PIPELINE_PATH = os.path.join(MODELS_DIR, 'pipeline_anomaly.pkl')
METRICS_PATH = os.path.join(MODELS_DIR, 'metrics.json')

# Cache the model in memory
_pipeline = None

def get_pipeline():
    global _pipeline
    if _pipeline is None:
        if not os.path.exists(PIPELINE_PATH):
            raise HTTPException(status_code=503, detail="Model is currently training or unavailable")
        with open(PIPELINE_PATH, 'rb') as f:
            _pipeline = pickle.load(f)
    return _pipeline

class PredictionRequest(BaseModel):
    # Categorical
    proto: str = Field(default="tcp")
    state: str = Field(default="FIN")
    service: str = Field(default="-")
    
    # Numerical
    spkts: int = 0
    dpkts: int = 0
    sbytes: int = 0
    dbytes: int = 0
    rate: float = 0.0
    sload: float = 0.0
    dload: float = 0.0
    sloss: int = 0
    dloss: int = 0
    is_ftp_login: int = 0
    ct_ftp_cmd: int = 0
    ct_flw_http_mthd: int = 0
    dur: float = 0.0
    sinpkt: float = 0.0
    dinpkt: float = 0.0
    sjit: float = 0.0
    djit: float = 0.0
    swin: int = 0
    stcpb: int = 0
    dtcpb: int = 0
    dwin: int = 0
    tcprtt: float = 0.0
    synack: float = 0.0
    ackdat: float = 0.0
    smean: int = 0
    dmean: int = 0
    trans_depth: int = 0
    response_body_len: int = 0
    ct_srv_src: int = 0
    ct_state_ttl: int = 0
    ct_dst_ltm: int = 0
    ct_src_dport_ltm: int = 0
    ct_dst_sport_ltm: int = 0
    ct_dst_src_ltm: int = 0
    ct_src_ltm: int = 0
    ct_srv_dst: int = 0
    is_sm_ips_ports: int = 0

@router.post("/predict")
def predict_anomaly(req: PredictionRequest):
    pipeline = get_pipeline()
    
    # Convert request to single-row dataframe exactly as expected by pipeline
    df = pd.DataFrame([req.dict()])
    
    # Predict
    anomaly_prediction = int(pipeline.predict(df)[0])
    proba = pipeline.predict_proba(df)[0]
    anomaly_prob = float(proba[1]) if anomaly_prediction == 1 else float(proba[0])
    
    predicted_threat = "Anomaly Detected" if anomaly_prediction == 1 else "Normal"
    risk_score = int(proba[1] * 100)  # Always use anomaly class probability
    
    top_indicators = []
    if anomaly_prediction == 1:
        if req.rate > 1000: top_indicators.append("Abnormally high traffic rate detected")
        if req.spkts > 100: top_indicators.append("Elevated source packet count")
        if req.dpkts > 100: top_indicators.append("Elevated destination packet count")
        if req.sbytes > 50000: top_indicators.append("Large source byte volume")
        if req.dbytes > 50000: top_indicators.append("Large destination byte volume")
        if req.is_ftp_login > 0: top_indicators.append("FTP login activity observed")
        if req.ct_flw_http_mthd > 3: top_indicators.append("Multiple HTTP methods in flow")
        if req.dur > 60: top_indicators.append("Extended connection duration")
        if req.sload > 1000000: top_indicators.append("High source load")
        if req.tcprtt > 1.0: top_indicators.append("High TCP round-trip time")
        if not top_indicators:
            top_indicators.append("General anomalous network behavior pattern")
        
    return {
        "is_anomaly": bool(anomaly_prediction),
        "anomaly_score": round(float(proba[1]), 4),
        "predicted_threat": predicted_threat,
        "risk_score": risk_score,
        "top_indicators": top_indicators
    }

@router.get("/performance")
def get_model_performance():
    if not os.path.exists(METRICS_PATH):
        raise HTTPException(status_code=503, detail="Metrics not yet available")
        
    with open(METRICS_PATH, 'r') as f:
        metrics = json.load(f)
        
    return metrics


@router.get("/feature-importance")
def get_feature_importance():
    """
    Extracts real feature importances from the trained Random Forest model.
    The pipeline contains a ColumnTransformer (preprocessor) followed by a RandomForestClassifier.
    """
    pipeline = get_pipeline()

    classifier = pipeline.named_steps['classifier']
    preprocessor = pipeline.named_steps['preprocessor']

    importances = classifier.feature_importances_

    # Reconstruct feature names from the preprocessor
    feature_names = []
    for name, transformer, columns in preprocessor.transformers_:
        if name == 'num':
            feature_names.extend(columns)
        elif name == 'cat':
            # Get OHE feature names
            try:
                cat_features = transformer.get_feature_names_out(columns)
                feature_names.extend(cat_features.tolist())
            except Exception:
                feature_names.extend(columns)

    # Pair and sort
    paired = list(zip(feature_names, importances.tolist()))
    paired.sort(key=lambda x: x[1], reverse=True)

    return {
        "features": [{"name": name, "importance": round(imp, 6)} for name, imp in paired],
        "total_features": len(paired),
        "model": "RandomForestClassifier",
    }


@router.get("/sample")
def get_sample_event(db: Session = Depends(get_db)):
    """
    Returns a real sample record from the UNSW-NB15 testing partition
    for the 'Load Example' button. Picks an anomaly record for interest.
    """
    from models import SecurityEvent, SecurityEventMLFeature
    import random

    # Get a random anomaly event from the testing set
    total_anomalies = db.query(SecurityEvent).filter(
        SecurityEvent.label == 1,
        SecurityEvent.dataset_source == 'testing'
    ).count()

    if total_anomalies == 0:
        raise HTTPException(status_code=404, detail="No testing data available")

    offset = random.randint(0, min(total_anomalies - 1, 999))
    event = db.query(SecurityEvent).filter(
        SecurityEvent.label == 1,
        SecurityEvent.dataset_source == 'testing'
    ).offset(offset).limit(1).first()

    if not event:
        raise HTTPException(status_code=404, detail="Sample not found")

    ml = db.query(SecurityEventMLFeature).filter(
        SecurityEventMLFeature.event_id == event.id
    ).first()

    sample = {
        "proto": event.proto or "tcp",
        "state": event.state or "FIN",
        "service": event.service or "-",
        "spkts": event.spkts or 0,
        "dpkts": event.dpkts or 0,
        "sbytes": event.sbytes or 0,
        "dbytes": event.dbytes or 0,
        "rate": float(event.rate or 0),
        "sload": float(event.sload or 0),
        "dload": float(event.dload or 0),
        "sloss": event.sloss or 0,
        "dloss": event.dloss or 0,
        "is_ftp_login": event.is_ftp_login or 0,
        "ct_ftp_cmd": event.ct_ftp_cmd or 0,
        "ct_flw_http_mthd": event.ct_flw_http_mthd or 0,
    }

    if ml:
        sample.update({
            "dur": float(ml.dur or 0),
            "sinpkt": float(ml.sinpkt or 0),
            "dinpkt": float(ml.dinpkt or 0),
            "sjit": float(ml.sjit or 0),
            "djit": float(ml.djit or 0),
            "swin": ml.swin or 0,
            "stcpb": ml.stcpb or 0,
            "dtcpb": ml.dtcpb or 0,
            "dwin": ml.dwin or 0,
            "tcprtt": float(ml.tcprtt or 0),
            "synack": float(ml.synack or 0),
            "ackdat": float(ml.ackdat or 0),
            "smean": ml.smean or 0,
            "dmean": ml.dmean or 0,
            "trans_depth": ml.trans_depth or 0,
            "response_body_len": ml.response_body_len or 0,
            "ct_srv_src": ml.ct_srv_src or 0,
            "ct_state_ttl": ml.ct_state_ttl or 0,
            "ct_dst_ltm": ml.ct_dst_ltm or 0,
            "ct_src_dport_ltm": ml.ct_src_dport_ltm or 0,
            "ct_dst_sport_ltm": ml.ct_dst_sport_ltm or 0,
            "ct_dst_src_ltm": ml.ct_dst_src_ltm or 0,
            "ct_src_ltm": ml.ct_src_ltm or 0,
            "ct_srv_dst": ml.ct_srv_dst or 0,
            "is_sm_ips_ports": ml.is_sm_ips_ports or 0,
        })

    return {
        "sample": sample,
        "source_event_id": event.id,
        "actual_label": "Anomaly" if event.label == 1 else "Normal",
        "actual_threat": event.attack_cat or "Normal",
    }
