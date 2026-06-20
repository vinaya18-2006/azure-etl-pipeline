import pandas as pd
import numpy as np

def transform_data(df):
    """
    Cleanses student performance data, standardizes columns, removes duplicates,
    calculates Grades based on Final Marks, and verifies Results.
    
    If it detects the UCI Student Performance schema (columns G1, G2, G3, sex, absences),
    or the Kaggle Student Performance schema (columns GPA, GradeClass, Absences, StudentID),
    it dynamically maps it into the dashboard-friendly schema.
    """
    print("[TRANSFORMER] Commencing student data transformation & sanitization...")
    transformed_df = df.copy()
    
    # Names and departments shared mapping pools
    female_names = [
        'Priya Sharma', 'Neha Patel', 'Sneha Reddy', 'Ananya Gupta', 'Pooja Nair',
        'Deepa Choudhury', 'Ritu Mehta', 'Kiran Pillai', 'Sunita Mishra', 'Meera Roy',
        'Kavita Grover', 'Asha Rao', 'Divya Bose', 'Shalini Sen', 'Swati Verma'
    ]
    male_names = [
        'Rahul Kumar', 'Arjun Singh', 'Vikram Joshi', 'Karan Verma', 'Rohit Das',
        'Amit Jha', 'Sanjay Mishra', 'Manish Roy', 'Rajesh Patel', 'Vijay Reddy',
        'Harish Sen', 'Suresh Pillai', 'Ravi Bose', 'Mohan Grover', 'Alok Rao'
    ]
    departments = ['CSE', 'ECE', 'MECH', 'EEE', 'CIVIL', 'IT']
    dept_weights = [0.28, 0.22, 0.18, 0.16, 0.10, 0.06]
    
    import random
    random.seed(42)

    # 1. Detect if this is the UCI Student Performance dataset (e.g. school, sex, age, G3)
    if "G3" in transformed_df.columns and "sex" in transformed_df.columns:
        print("[TRANSFORMER] UCI Student Performance schema detected. Mapping columns to analytics schema...")
        mapped_records = []
        gender_map = {"F": "Female", "M": "Male"}
        
        for idx, row in transformed_df.iterrows():
            student_id = f"STU2026{1000 + idx}"
            gender = gender_map.get(str(row["sex"]).strip().upper(), "Female")
            name = random.choice(female_names) if gender == "Female" else random.choice(male_names)
            dept = random.choices(departments, weights=dept_weights)[0]
            
            absences = pd.to_numeric(row.get("absences", 0), errors='coerce')
            if pd.isna(absences):
                absences = 0
            attendance = max(60.0, 100.0 - absences * 1.5)
            
            g1 = pd.to_numeric(row.get("G1", 0), errors='coerce')
            g2 = pd.to_numeric(row.get("G2", 0), errors='coerce')
            g3 = pd.to_numeric(row.get("G3", 0), errors='coerce')
            
            mid1 = min(100.0, max(0.0, g1 * 5.0))
            mid2 = min(100.0, max(0.0, g2 * 5.0))
            final_marks = min(100.0, max(0.0, g3 * 5.0))
            assignment = min(100.0, max(0.0, (g1 + g2) * 2.5))
            
            mapped_records.append({
                "StudentID": student_id,
                "Name": name,
                "Department": dept,
                "Gender": gender,
                "Attendance": round(attendance, 2),
                "Mid1": round(mid1, 2),
                "Mid2": round(mid2, 2),
                "Assignment": round(assignment, 2),
                "Final Marks": round(final_marks, 2),
                "Result": "Pass" if final_marks >= 50.0 else "Fail"
            })
        transformed_df = pd.DataFrame(mapped_records)
        print(f"[TRANSFORMER] UCI mapping completed successfully. Ingested size: {transformed_df.shape}")

    # 2. Detect if this is the Kaggle Student Performance dataset (e.g. GPA, GradeClass, StudyTimeWeekly)
    elif "GPA" in transformed_df.columns and "GradeClass" in transformed_df.columns:
        print("[TRANSFORMER] Kaggle Student Performance schema detected. Mapping columns to analytics schema...")
        mapped_records = []
        
        for idx, row in transformed_df.iterrows():
            student_id = str(row.get("StudentID", f"STU2026{1000 + idx}")).strip()
            
            # Map Gender (usually 0 = Male, 1 = Female in Kaggle dataset)
            raw_gen = str(row.get("Gender", "0")).strip()
            gender = "Female" if raw_gen in ["1", "1.0", "1", "Female"] else "Male"
            
            name = random.choice(female_names) if gender == "Female" else random.choice(male_names)
            dept = random.choices(departments, weights=dept_weights)[0]
            
            # Map Absences (0-30) to Attendance (60-100)
            abs_val = pd.to_numeric(row.get("Absences", 0), errors='coerce')
            if pd.isna(abs_val):
                abs_val = 0
            attendance = max(60.0, 100.0 - abs_val * 1.5)
            
            # Map GPA (0.0 to 4.0) to Final Marks (0 to 100)
            gpa = pd.to_numeric(row.get("GPA", 0.0), errors='coerce')
            if pd.isna(gpa):
                gpa = 0.0
            final_marks = min(100.0, max(0.0, gpa * 25.0))
            
            # Generate Mid1, Mid2, Assignment around final marks dynamically
            mid1 = min(100.0, max(0.0, final_marks + random.uniform(-5, 5)))
            mid2 = min(100.0, max(0.0, final_marks + random.uniform(-5, 5)))
            assignment = min(100.0, max(0.0, final_marks + random.uniform(-3, 3)))
            
            mapped_records.append({
                "StudentID": student_id,
                "Name": name,
                "Department": dept,
                "Gender": gender,
                "Attendance": round(attendance, 2),
                "Mid1": round(mid1, 2),
                "Mid2": round(mid2, 2),
                "Assignment": round(assignment, 2),
                "Final Marks": round(final_marks, 2),
                "Result": "Pass" if final_marks >= 50.0 else "Fail"
            })
        transformed_df = pd.DataFrame(mapped_records)
        print(f"[TRANSFORMER] Kaggle mapping completed successfully. Ingested size: {transformed_df.shape}")

    # 3. Deduplicate by StudentID if present
    if "StudentID" in transformed_df.columns:
        initial_len = len(transformed_df)
        transformed_df = transformed_df.drop_duplicates(subset=["StudentID"])
        dup_count = initial_len - len(transformed_df)
        if dup_count > 0:
            print(f"[TRANSFORMER] Removed {dup_count} duplicate student records.")

    # 4. Trim string columns
    for col in transformed_df.select_dtypes(include=['object']):
        transformed_df[col] = transformed_df[col].astype(str).str.strip()
        
    # 5. Clean numeric columns (coerce to float, handle nulls)
    numeric_cols = ["Attendance", "Mid1", "Mid2", "Assignment", "Final Marks"]
    for col in numeric_cols:
        if col in transformed_df.columns:
            transformed_df[col] = pd.to_numeric(transformed_df[col], errors='coerce').fillna(0.0)
            if col == "Attendance":
                transformed_df[col] = transformed_df[col].clip(0.0, 100.0)
            elif col in ["Mid1", "Mid2", "Assignment", "Final Marks"]:
                transformed_df[col] = transformed_df[col].clip(0.0, 100.0)

    # 6. Standardize text columns
    if "Department" in transformed_df.columns:
        transformed_df["Department"] = transformed_df["Department"].astype(str).str.upper()
        transformed_df["Department"] = transformed_df["Department"].replace("", "GEN").fillna("GEN")
        
    if "Name" in transformed_df.columns:
        transformed_df["Name"] = transformed_df["Name"].astype(str).str.title().replace("", "Unknown Student").fillna("Unknown Student")

    if "Gender" in transformed_df.columns:
        transformed_df["Gender"] = transformed_df["Gender"].astype(str).str.title().replace("", "Other").fillna("Other")

    # 7. Calculate Grades and Results
    if "Final Marks" in transformed_df.columns:
        def determine_grade(marks):
            if marks >= 90.0:
                return "A+"
            elif marks >= 80.0:
                return "A"
            elif marks >= 70.0:
                return "B"
            elif marks >= 50.0:
                return "C"
            else:
                return "F"
                
        transformed_df["Grade"] = transformed_df["Final Marks"].apply(determine_grade)
        transformed_df["Result"] = transformed_df["Final Marks"].apply(lambda m: "Pass" if m >= 50.0 else "Fail")

    print(f"[TRANSFORMER] Cleaning complete. Standardized shape: {transformed_df.shape}")
    return transformed_df
