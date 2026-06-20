import os
import sys
from fastapi import FastAPI, HTTPException, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json
import random

# Ensure local backend modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auth.auth_handler import hash_password, create_access_token, verify_token
from etl.extractor import extract_data
from etl.transformer import transform_data
from etl.loader import load_data
from etl.azure_loader import upload_to_azure
from analytics.viz import generate_reports
from alerts.emailer import send_email_report

app = FastAPI(title="Smart DataOps API Engine", version="1.0.0")

# Enable CORS for the Vite React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Employee Database
EMPLOYEE_DB = {
    "dev@company.com": {
        "password_hash": hash_password("developer123"),
        "name": "Alex Mercer",
        "role": "Data Engineer",
        "dept": "Data Operations",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        "permissions": ["run_pipeline", "view_reports", "view_data"]
    },
    "admin@company.com": {
        "password_hash": hash_password("admin123"),
        "name": "Sarah Connor",
        "role": "System Administrator",
        "dept": "IT Infrastructure",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        "permissions": ["run_pipeline", "view_reports", "view_data", "edit_config", "manage_roles"]
    }
}

# In-Memory Run Logs & Audit Table
RUN_LOGS = [
    {
        "id": "#RUN-1002",
        "time": "14:20:10",
        "duration": "6.8s",
        "rows": 250,
        "status": "success",
        "target": "SQLite",
        "triggered_by": "Alex Mercer"
    },
    {
        "id": "#RUN-1001",
        "time": "11:05:00",
        "duration": "8.2s",
        "rows": 500,
        "status": "success",
        "target": "SQLite + Azure",
        "triggered_by": "Sarah Connor"
    }
]

class LoginRequest(BaseModel):
    email: str
    password: str

class ETLConfig(BaseModel):
    source_file: str = "data/staged_records.csv"
    destination_type: str = "sqlite"  # or "azure_blob"
    alert_email: str = "alerts@company.com"
    send_email: bool = True

@app.get("/")
def read_root():
    return {"status": "online", "message": "Smart DataOps API Engine is live."}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = EMPLOYEE_DB.get(req.email)
    if not user or user["password_hash"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(req.email, user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": req.email,
            "name": user["name"],
            "role": user["role"],
            "dept": user["dept"],
            "avatar": user["avatar"],
            "permissions": user["permissions"]
        }
    }

@app.get("/api/auth/profile")
def get_profile(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication token missing")
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
        
    user_email = payload["user_id"]
    user = EMPLOYEE_DB.get(user_email)
    if not user:
         raise HTTPException(status_code=404, detail="Employee record not found")
         
    return {
        "email": user_email,
        "name": user["name"],
        "role": user["role"],
        "dept": user["dept"],
        "avatar": user["avatar"],
        "permissions": user["permissions"]
    }

@app.get("/api/etl/logs")
def get_etl_logs(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing auth token")
    return RUN_LOGS

@app.post("/api/etl/run")
def trigger_pipeline(config: ETLConfig, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Access denied")
        
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_email = payload["user_id"]
    operator_name = EMPLOYEE_DB.get(user_email, {}).get("name", "Unknown Operator")
    
    # Run the ETL Process
    start_time = datetime.now()
    run_id = f"#RUN-{random.randint(1000, 9999)}"
    
    # Auto-generate staged records if file doesn't exist
    if not os.path.exists("data"):
        os.makedirs("data", exist_ok=True)
        
    src_file = config.source_file
    if not os.path.exists(src_file):
        # Create default mock staged file
        products = ['Widget A', 'Gadget B', 'Device C', 'System X', 'Module Y']
        customers = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Brown', 'Acme Corp']
        rows = []
        for i in range(120):
            rows.append({
                "order_id": 1000 + i,
                "customer_name": random.choice(customers),
                "order_date": datetime.now().strftime("%Y-%m-%d"),
                "amount": round(random.uniform(15.0, 750.0), 2),
                "product": random.choice(products)
            })
        import pandas as pd
        pd.DataFrame(rows).to_csv(src_file, index=False)
        
    try:
        # 1. EXTRACT
        df_raw = extract_data(src_file)
        
        # 2. TRANSFORM
        df_clean = transform_data(df_raw)
        
        # 3. LOAD
        sqlite_db = "data/sqlite.db"
        load_data(df_clean, db_path=sqlite_db)
        
        # 4. REPORT & VISUALIZATION
        generate_reports(df_clean, "reports")
        
        # 5. AZURE LOAD
        target_dest = "SQLite"
        if config.destination_type == "azure_blob":
            upload_to_azure(sqlite_db, "", "etl-backups")
            target_dest = "SQLite + Azure"
            
        # 6. MAIL REPORT
        if config.send_email:
            email_body = f"""
            <h2>Smart DataOps Ingestion Summary</h2>
            <p>The pipeline has successfully completed <strong>{len(df_clean)} records</strong>.</p>
            <p>Operator: {operator_name}</p>
            <p>Run ID: {run_id}</p>
            """
            send_email_report(
                subject=f"ETL Ingestion Telemetry Report - {datetime.now().strftime('%Y-%m-%d')}",
                body=email_body,
                attachment_paths=[
                    "reports/report.html",
                    "reports/chart.png"
                ],
                smtp_config={"receiver_email": config.alert_email}
            )
            
        duration = f"{(datetime.now() - start_time).total_seconds():.1f}s"
        
        # Append run log
        run_record = {
            "id": run_id,
            "time": start_time.strftime("%H:%M:%S"),
            "duration": duration,
            "rows": len(df_clean),
            "status": "success",
            "target": target_dest,
            "triggered_by": operator_name
        }
        RUN_LOGS.insert(0, run_record)
        
        return {
            "success": True,
            "run_id": run_id,
            "rows_processed": len(df_clean),
            "duration": duration,
            "target": target_dest,
            "operator": operator_name
        }
    except Exception as e:
        run_record = {
            "id": run_id,
            "time": start_time.strftime("%H:%M:%S"),
            "duration": f"{(datetime.now() - start_time).total_seconds():.1f}s",
            "rows": 0,
            "status": "error",
            "target": "None",
            "triggered_by": operator_name
        }
        RUN_LOGS.insert(0, run_record)
        raise HTTPException(status_code=500, detail=str(e))
