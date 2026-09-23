import sys
import logging
from database import SessionLocal
from ingestion import ingest_dataset
from sqlalchemy.exc import OperationalError
import os

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    db = SessionLocal()
    
    training_path = r"D:\CyberThreatIntelligence\dataset\UNSW_NB15_training-set.parquet"
    testing_path = r"D:\CyberThreatIntelligence\dataset\UNSW_NB15_testing-set.parquet"
    
    total_inserted = 0
    total_rejected = 0
    train_inserted, train_rejected = 0, 0
    test_inserted, test_rejected = 0, 0
    
    try:
        if os.path.exists(training_path):
            train_inserted, train_rejected = ingest_dataset(training_path, "training", db)
        else:
            logging.warning(f"Training dataset not found: {training_path}")
            
        if os.path.exists(testing_path):
            test_inserted, test_rejected = ingest_dataset(testing_path, "testing", db)
        else:
            logging.warning(f"Testing dataset not found: {testing_path}")
            
        total_inserted = train_inserted + test_inserted
        total_rejected = train_rejected + test_rejected
        
        print(f"\n--- Ingestion Summary ---")
        print(f"Training records processed: Inserted={train_inserted}, Rejected/Skipped={train_rejected}")
        print(f"Testing records processed: Inserted={test_inserted}, Rejected/Skipped={test_rejected}")
        print(f"Total records successfully imported: {total_inserted}")
        print(f"Total records rejected/skipped: {total_rejected}")
        print(f"-------------------------\n")
    except OperationalError:
        print("\n[ERROR] Could not connect to PostgreSQL database. Please ensure PostgreSQL is running and credentials in .env are correct.\n")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] An unexpected error occurred: {e}\n")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
