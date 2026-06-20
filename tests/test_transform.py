import pandas as pd
from etl.transformer import transform_data

def test_transform_cleansing():
    """
    Verifies that transform_data standardizes student text features, calculates correct grades,
    resolves NaN/null scores, and maps Pass/Fail results correctly.
    """
    raw_df = pd.DataFrame([
        {"StudentID": "STU20260001", "Name": "  Rahul Kumar  ", "Department": "cse", "Final Marks": " 85.50 ", "Attendance": 92.5},
        {"StudentID": "STU20260002", "Name": "Priya Sharma", "Department": "it", "Final Marks": 45.0, "Attendance": None}
    ])
    
    clean_df = transform_data(raw_df)
    
    # Check that names are trimmed and department names are capitalized
    assert clean_df.loc[0, "Name"] == "Rahul Kumar"
    assert clean_df.loc[0, "Department"] == "CSE"
    
    # Check that Final Marks string was successfully coerced to float
    assert clean_df.loc[0, "Final Marks"] == 85.50
    
    # Check Grade and Result mapping for Rahul
    assert clean_df.loc[0, "Grade"] == "A"
    assert clean_df.loc[0, "Result"] == "Pass"
    
    # Check fallback for null Attendance and Grade/Result mapping for Priya
    assert clean_df.loc[1, "Attendance"] == 0.0
    assert clean_df.loc[1, "Grade"] == "F"
    assert clean_df.loc[1, "Result"] == "Fail"
