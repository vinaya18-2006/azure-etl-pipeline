import pandas as pd

def transform_data(df):
    """
    Cleanses strings, standardizes column formats, and fills empty cells.
    """
    print("[TRANSFORMER] Commencing data transformation & text sanitization...")
    transformed_df = df.copy()
    
    # Trim string features
    for col in transformed_df.select_dtypes(include=['object']):
        transformed_df[col] = transformed_df[col].astype(str).str.strip()
        
    # Handle numeric columns (coercing NaN/null bounds to 0.0)
    for col in transformed_df.columns:
        col_lower = col.lower()
        if any(term in col_lower for term in ['amount', 'revenue', 'price', 'sales', 'cost', 'total', 'val']):
            transformed_df[col] = pd.to_numeric(transformed_df[col], errors='coerce').fillna(0.0)
            
    print(f"[TRANSFORMER] Telemetry standardized. Ingestion format: {transformed_df.shape}")
    return transformed_df
