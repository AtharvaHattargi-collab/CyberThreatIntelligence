import os
from database import engine, SessionLocal
from models import Base, User
from auth_utils import get_password_hash
import logging
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

def init_db():
    logger.info("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            logger.info("Creating initial admin user...")
            admin_password = os.getenv("ADMIN_INITIAL_PASSWORD", "admin123")
            admin_user = User(
                email="admin@cyberthreatintel.local",
                username="admin",
                password_hash=get_password_hash(admin_password),
                role="ADMIN",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logger.info("Admin user created.")
        else:
            logger.info("Admin user already exists.")
    except Exception as e:
        logger.error(f"Error initializing DB: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
