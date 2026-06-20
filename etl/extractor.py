import os
import pandas as pd

def extract_data(file_path):
    """
    Extracts tabular data from local file formats (CSV or JSON).
    """
    print(f"[EXTRACTOR] Ingesting source file: {file_path}")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Source file path does not exist: {file_path}")
        
    _, ext = os.path.splitext(file_path)
    if ext.lower() == '.csv':
        df = pd.read_csv(file_path)
    elif ext.lower() == '.json':
        df = pd.read_json(file_path)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")
        
    print(f"[EXTRACTOR] Load completed. Raw size: {len(df)} records. Columns: {list(df.columns)}")
    return df

if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else "data/staged_records.csv"
    try:
        extract_data(path)
    except Exception as e:
        print(f"[EXTRACTOR] Extraction check failed: {e}")
