from database import engine
from sqlalchemy import text
import sys

try:
    with engine.connect() as conn:
        conn.execute(text('SELECT 1'))
        print('Connection successful')
except Exception as e:
    print(f'Connection failed: {e}')
    sys.exit(1)
