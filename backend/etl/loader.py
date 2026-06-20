import os
import sqlite3

def load_data(df, db_path="data/sqlite.db", table_name="processed_records"):
    """
    Loads cleansed DataFrame into the local SQLite database database.
    """
    print(f"[LOADER] Writing to database endpoint: {db_path}")
    
    # Check parent directory
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
        
    conn = sqlite3.connect(db_path)
    try:
        # Save records
        df.to_sql(table_name, conn, if_exists="replace", index=False)
        print(f"[LOADER] Transaction complete. Loaded {len(df)} rows into target table '{table_name}'.")
    finally:
        conn.close()
