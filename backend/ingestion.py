import pandas as pd
import numpy as np
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, OperationalError
from models import SecurityEvent, SecurityEventMLFeature

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def ingest_dataset(filepath: str, dataset_source: str, db: Session, chunksize: int = 10000):
    logger.info(f"Starting ingestion from {filepath} (Source: {dataset_source})")
    total_inserted = 0
    total_rejected = 0

    try:
        # Check if dataset source already loaded to prevent duplicate runs
        try:
            existing = db.query(SecurityEvent.id).filter(SecurityEvent.dataset_source == dataset_source).first()
            if existing:
                logger.info(f"Dataset '{dataset_source}' is already loaded. Skipping to prevent duplicates.")
                return 0, 0
        except OperationalError:
            # We will catch this properly below, but if we can't query, we can't insert.
            raise

        # Using pyarrow to stream parquet in chunks (using read_table and to_batches or pandas)
        import pyarrow.parquet as pq
        parquet_file = pq.ParquetFile(filepath)
        
        for batch in parquet_file.iter_batches(batch_size=chunksize):
            df = batch.to_pandas()
            
            # Ensure columns are lowercase
            df.columns = df.columns.str.lower()
            
            # Map values
            events_to_insert = []
            
            for _, row in df.iterrows():
                try:
                    # Analytics data
                    event = SecurityEvent(
                        dataset_source=dataset_source,
                        proto=str(row.get('proto', ''))[:50],
                        service=str(row.get('service', ''))[:50],
                        state=str(row.get('state', ''))[:50],
                        spkts=int(row.get('spkts', 0)) if pd.notna(row.get('spkts')) else 0,
                        dpkts=int(row.get('dpkts', 0)) if pd.notna(row.get('dpkts')) else 0,
                        sbytes=int(row.get('sbytes', 0)) if pd.notna(row.get('sbytes')) else 0,
                        dbytes=int(row.get('dbytes', 0)) if pd.notna(row.get('dbytes')) else 0,
                        rate=float(row.get('rate', 0.0)) if pd.notna(row.get('rate')) else 0.0,
                        sload=float(row.get('sload', 0.0)) if pd.notna(row.get('sload')) else 0.0,
                        dload=float(row.get('dload', 0.0)) if pd.notna(row.get('dload')) else 0.0,
                        sloss=int(row.get('sloss', 0)) if pd.notna(row.get('sloss')) else 0,
                        dloss=int(row.get('dloss', 0)) if pd.notna(row.get('dloss')) else 0,
                        is_ftp_login=int(row.get('is_ftp_login', 0)) if pd.notna(row.get('is_ftp_login')) else 0,
                        ct_ftp_cmd=int(row.get('ct_ftp_cmd', 0)) if pd.notna(row.get('ct_ftp_cmd')) else 0,
                        ct_flw_http_mthd=int(row.get('ct_flw_http_mthd', 0)) if pd.notna(row.get('ct_flw_http_mthd')) else 0,
                        attack_cat=str(row.get('attack_cat', ''))[:100] if str(row.get('attack_cat')) not in ('nan', 'None', 'Normal') else None,
                        label=int(row.get('label', 0)) if pd.notna(row.get('label')) else 0
                    )
                    
                    # ML features
                    ml_feature = SecurityEventMLFeature(
                        dur=float(row.get('dur', 0.0)) if pd.notna(row.get('dur')) else 0.0,
                        sinpkt=float(row.get('sinpkt', 0.0)) if pd.notna(row.get('sinpkt')) else 0.0,
                        dinpkt=float(row.get('dinpkt', 0.0)) if pd.notna(row.get('dinpkt')) else 0.0,
                        sjit=float(row.get('sjit', 0.0)) if pd.notna(row.get('sjit')) else 0.0,
                        djit=float(row.get('djit', 0.0)) if pd.notna(row.get('djit')) else 0.0,
                        swin=int(row.get('swin', 0)) if pd.notna(row.get('swin')) else 0,
                        stcpb=int(row.get('stcpb', 0)) if pd.notna(row.get('stcpb')) else 0,
                        dtcpb=int(row.get('dtcpb', 0)) if pd.notna(row.get('dtcpb')) else 0,
                        dwin=int(row.get('dwin', 0)) if pd.notna(row.get('dwin')) else 0,
                        tcprtt=float(row.get('tcprtt', 0.0)) if pd.notna(row.get('tcprtt')) else 0.0,
                        synack=float(row.get('synack', 0.0)) if pd.notna(row.get('synack')) else 0.0,
                        ackdat=float(row.get('ackdat', 0.0)) if pd.notna(row.get('ackdat')) else 0.0,
                        smean=int(row.get('smean', 0)) if pd.notna(row.get('smean')) else 0,
                        dmean=int(row.get('dmean', 0)) if pd.notna(row.get('dmean')) else 0,
                        trans_depth=int(row.get('trans_depth', 0)) if pd.notna(row.get('trans_depth')) else 0,
                        response_body_len=int(row.get('response_body_len', 0)) if pd.notna(row.get('response_body_len')) else 0,
                        ct_srv_src=int(row.get('ct_srv_src', 0)) if pd.notna(row.get('ct_srv_src')) else 0,
                        ct_state_ttl=int(row.get('ct_state_ttl', 0)) if pd.notna(row.get('ct_state_ttl')) else 0,
                        ct_dst_ltm=int(row.get('ct_dst_ltm', 0)) if pd.notna(row.get('ct_dst_ltm')) else 0,
                        ct_src_dport_ltm=int(row.get('ct_src_dport_ltm', 0)) if pd.notna(row.get('ct_src_dport_ltm')) else 0,
                        ct_dst_sport_ltm=int(row.get('ct_dst_sport_ltm', 0)) if pd.notna(row.get('ct_dst_sport_ltm')) else 0,
                        ct_dst_src_ltm=int(row.get('ct_dst_src_ltm', 0)) if pd.notna(row.get('ct_dst_src_ltm')) else 0,
                        ct_src_ltm=int(row.get('ct_src_ltm', 0)) if pd.notna(row.get('ct_src_ltm')) else 0,
                        ct_srv_dst=int(row.get('ct_srv_dst', 0)) if pd.notna(row.get('ct_srv_dst')) else 0,
                        is_sm_ips_ports=int(row.get('is_sm_ips_ports', 0)) if pd.notna(row.get('is_sm_ips_ports')) else 0
                    )
                    
                    event.ml_features = ml_feature
                    events_to_insert.append(event)
                except Exception as e:
                    logger.error(f"ROW ERROR: {type(e).__name__}: {e}")
                    total_rejected += 1
                    continue
            
            if events_to_insert:
                try:
                    db.add_all(events_to_insert)
                    db.commit()
                    total_inserted += len(events_to_insert)
                except Exception as e:
                    db.rollback()
                    logger.error(f"Failed to insert chunk: {e}")
                    total_rejected += len(events_to_insert)

    except FileNotFoundError:
        logger.error(f"Dataset file not found: {filepath}")
    except OperationalError as e:
        logger.error(f"Database connection failed. Cannot insert records: {e}")
        raise
    except Exception as e:
        logger.error(f"Error reading dataset: {e}")
        
    logger.info(f"Ingestion of {dataset_source} complete. Inserted: {total_inserted}, Rejected: {total_rejected}")
    return total_inserted, total_rejected
