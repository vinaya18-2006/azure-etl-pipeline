import os
import pandas as pd
from etl.extractor import extract_data

def test_extract_csv():
    """
    Verifies that extract_data successfully parses student CSV files.
    """
    temp_path = "data/test_extract_fixture.csv"
    os.makedirs("data", exist_ok=True)
    
    fixture = pd.DataFrame([
        {"StudentID": "STU20260001", "Name": "Rahul Kumar", "Department": "CSE"},
        {"StudentID": "STU20260002", "Name": "Priya Sharma", "Department": "IT"}
    ])
    fixture.to_csv(temp_path, index=False)
    
    try:
        df = extract_data(temp_path)
        assert len(df) == 2
        assert "Name" in df.columns
        assert "StudentID" in df.columns
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
