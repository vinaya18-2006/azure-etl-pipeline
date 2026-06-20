import os
import sys
import argparse
import random
from datetime import datetime
import pandas as pd

# Append local path so we can import etl module seamlessly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from etl.extractor import extract_data
from etl.transformer import transform_data
from etl.loader import load_data
from etl.azure_loader import upload_to_azure
from etl.viz import generate_reports
from etl.emailer import send_email_report

def load_env(env_path=".env"):
    """
    Safely reads variables from local .env files to avoid package dependency locks.
    """
    config = {}
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    parts = line.split("=", 1)
                    if len(parts) == 2:
                        config[parts[0].strip()] = parts[1].strip()
    return config

def generate_mock_student_data(file_path, num_records=250):
    """
    Generates a realistic student performance dataset.
    """
    departments = ['CSE', 'ECE', 'MECH', 'EEE', 'CIVIL', 'IT']
    dept_weights = [0.28, 0.22, 0.18, 0.16, 0.10, 0.06]
    
    first_names = [
        'Rahul', 'Priya', 'Arjun', 'Neha', 'Vikram', 'Sneha', 'Karan', 'Ananya', 'Rohit', 'Pooja',
        'Amit', 'Deepa', 'Sanjay', 'Ritu', 'Manish', 'Kiran', 'Rajesh', 'Sunita', 'Vijay', 'Meera',
        'Harish', 'Kavita', 'Suresh', 'Asha', 'Ravi', 'Divya', 'Mohan', 'Shalini', 'Alok', 'Swati'
    ]
    last_names = [
        'Kumar', 'Sharma', 'Singh', 'Patel', 'Joshi', 'Reddy', 'Verma', 'Gupta', 'Das', 'Nair',
        'Jha', 'Choudhury', 'Mehta', 'Rao', 'Bose', 'Pillai', 'Mishra', 'Sen', 'Grover', 'Roy'
    ]
    genders = ['Male', 'Female']
    
    records = []
    
    for i in range(1, num_records + 1):
        student_id = f"STU{20260000 + i}"
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        dept = random.choices(departments, weights=dept_weights)[0]
        gender = random.choice(genders)
        
        # High attendance on average (~80% average)
        attendance = round(random.betavariate(8, 2) * 100, 2)
        
        # Generate grades with some correlation (attendance helps performance)
        perf_factor = attendance / 100.0
        
        mid1 = round(random.uniform(40, 100) * (0.6 + 0.4 * perf_factor), 2)
        mid2 = round(random.uniform(40, 100) * (0.6 + 0.4 * perf_factor), 2)
        assignment = round(random.uniform(50, 100) * (0.7 + 0.3 * perf_factor), 2)
        final_exam = round(random.uniform(35, 100) * (0.5 + 0.5 * perf_factor), 2)
        
        # Ensure marks are within 0-100
        mid1 = min(100.0, max(0.0, mid1))
        mid2 = min(100.0, max(0.0, mid2))
        assignment = min(100.0, max(0.0, assignment))
        final_exam = min(100.0, max(0.0, final_exam))
        
        # Calculate Final Marks as weighted average
        # Mid1 (20%), Mid2 (20%), Assignment (10%), Final Exam (50%)
        final_marks = round(0.2 * mid1 + 0.2 * mid2 + 0.1 * assignment + 0.5 * final_exam, 2)
        
        # Determine Result
        result = "Pass" if final_marks >= 50.0 else "Fail"
        
        records.append({
            "StudentID": student_id,
            "Name": name,
            "Department": dept,
            "Gender": gender,
            "Attendance": attendance,
            "Mid1": mid1,
            "Mid2": mid2,
            "Assignment": assignment,
            "Final Marks": final_marks,
            "Result": result
        })
        
    df = pd.DataFrame(records)
    df.to_csv(file_path, index=False)
    return df

def main():
    parser = argparse.ArgumentParser(description="Student Performance ETL Pipeline Orchestrator")
    parser.add_argument("--source", default="data/student_data.csv", help="Source CSV data file path")
    parser.add_argument("--destination", default=None, help="SQLite database output path")
    parser.add_argument("--azure", action="store_true", help="Sync database backup to Azure Blob Storage")
    parser.add_argument("--email", action="store_true", help="Send HTML/PNG telemetry digest to recipient email")
    args = parser.parse_args()

    # Create project folders if missing
    os.makedirs("logs", exist_ok=True)
    os.makedirs("data", exist_ok=True)
    os.makedirs("reports", exist_ok=True)
    
    log_file_path = os.path.join("logs", "etl.log")
    
    def log(msg, error=False):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prefix = "[ERROR] " if error else "[INFO] "
        formatted = f"[{timestamp}] {prefix}{msg}"
        try:
            print(formatted)
        except UnicodeEncodeError:
            import sys
            codec = sys.stdout.encoding or 'utf-8'
            print(formatted.encode(codec, errors='replace').decode(codec))
        with open(log_file_path, "a", encoding="utf-8") as f:
            f.write(formatted + "\n")

    log("ETL ORCHESTRATION PIPELINE STARTING...")
    
    # Verify/generate input CSV if missing
    if not os.path.exists(args.source) and args.source == "data/student_data.csv":
        log(f"Source file not found at '{args.source}'. Auto-generating mock student dataset...")
        generate_mock_student_data(args.source, num_records=250)
        log(f"Mock student data payload created at: {args.source}")

    # Load settings
    env_config = load_env()
    sqlite_db = args.destination or env_config.get("SQLITE_DB_PATH", "data/etl.db")

    try:
        # Step 1: EXTRACT
        log("Executing Ingress EXTRACT phase...")
        df_raw = extract_data(args.source)
        log(f"EXTRACT phase completed. Row count: {len(df_raw)}")

        # Step 2: TRANSFORM
        log("Executing Data TRANSFORM phase...")
        df_clean = transform_data(df_raw)
        log("TRANSFORM phase completed successfully.")

        # Step 3: LOAD
        log(f"Executing Local LOAD phase. Target SQLite DB: {sqlite_db}")
        load_data(df_clean, db_path=sqlite_db)
        log("LOAD phase completed successfully.")

        # Step 4: VISUALIZE
        log("Executing Report VISUALIZATION phase...")
        generate_reports(df_clean)
        log("VISUALIZE phase completed successfully.")

        # Step 5: AZURE CLOUD SYNC
        if args.azure:
            log("Executing Cloud Backup replication to Azure Blob Storage...")
            conn_str = env_config.get("AZURE_STORAGE_CONNECTION_STRING", "")
            container = env_config.get("AZURE_CONTAINER_NAME", "etl-backups")
            upload_to_azure(sqlite_db, conn_str, container)
            
        # Step 6: EMAIL AUTOMATION
        if args.email:
            log("Executing SMTP Dispatch Automation...")
            pass_count = len(df_clean[df_clean["Result"] == "Pass"])
            pass_percentage = round((pass_count / len(df_clean)) * 100, 2)
            avg_marks = round(df_clean["Final Marks"].mean(), 2)
            
            email_body = f"""
            <h2>Student Performance Ingestion Summary</h2>
            <p>Your pipeline has successfully committed <strong>{len(df_clean)} records</strong> to SQLite.</p>
            <ul>
                <li><strong>Average Final Marks:</strong> {avg_marks}%</li>
                <li><strong>Pass Percentage:</strong> {pass_percentage}%</li>
            </ul>
            <p>Find the attached HTML statistics profile and graph summaries for detailed student performance telemetry.</p>
            """
            send_email_report(
                subject=f"Student Performance Telemetry Report - {datetime.now().strftime('%Y-%m-%d')}",
                body=email_body,
                attachment_paths=[
                    os.path.join("reports", "report.html"),
                    os.path.join("reports", "summary.png")
                ],
                smtp_config=env_config
              )
            
        log("ETL PIPELINE ORCHESTRATION COMPLETED SUCCESSFULLY ✓")

    except Exception as e:
        log(f"ETL PIPELINE FAILURE: {e}", error=True)
        sys.exit(1)

if __name__ == "__main__":
    main()
