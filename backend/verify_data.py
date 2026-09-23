from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    print('--- DATABASE ---')
    print(f'security_events row count: {conn.execute(text("SELECT COUNT(*) FROM security_events")).scalar()}')
    print(f'security_event_ml_features row count: {conn.execute(text("SELECT COUNT(*) FROM security_event_ml_features")).scalar()}')
    print(f'training rows in database: {conn.execute(text("SELECT COUNT(*) FROM security_events WHERE dataset_source = \'training\'")).scalar()}')
    print(f'testing rows in database: {conn.execute(text("SELECT COUNT(*) FROM security_events WHERE dataset_source = \'testing\'")).scalar()}')
    
    print('\n--- DATA VALIDATION ---')
    print(f'Normal records: {conn.execute(text("SELECT COUNT(*) FROM security_events WHERE label = 0")).scalar()}')
    print(f'Attack records: {conn.execute(text("SELECT COUNT(*) FROM security_events WHERE label = 1")).scalar()}')
    
    print('\nAttack categories:')
    cats = conn.execute(text("SELECT attack_cat, COUNT(*) FROM security_events WHERE attack_cat IS NOT NULL GROUP BY attack_cat ORDER BY count DESC")).fetchall()
    for cat, count in cats:
        print(f'  {cat}: {count}')
