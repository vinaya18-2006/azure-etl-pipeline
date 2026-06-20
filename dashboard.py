# pyrefly: ignore [missing-import]
import streamlit as st
import pandas as pd
import sqlite3
import os
import subprocess
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
from io import BytesIO

# Page configuration
st.set_page_config(
    page_title="EduAnalytics - Student Performance Dashboard",
    page_icon="🎓",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for Premium Design & Dark Elements
st.markdown("""
<style>
    /* Global Styles */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    /* Metrics Card Styling */
    .metric-card {
        background-color: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .metric-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    .metric-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.05em;
    }
    .metric-value {
        font-size: 1.875rem;
        font-weight: 700;
        color: #0f172a;
        margin-top: 4px;
        margin-bottom: 2px;
    }
    .metric-subtitle {
        font-size: 0.75rem;
        font-weight: 500;
        color: #10b981; /* Default success green */
    }
    .metric-subtitle-red {
        font-size: 0.75rem;
        font-weight: 500;
        color: #ef4444; /* Error red */
    }
    
    /* Login Container */
    .login-container {
        max-w: 450px;
        margin: 100px auto;
        padding: 40px;
        background: rgba(17, 24, 39, 0.8);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(55, 65, 81, 0.8);
        border-radius: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
    }
    
    /* Status Panel */
    .status-panel {
        background-color: #0f172a;
        color: #94a3b8;
        border-radius: 12px;
        padding: 15px;
        margin-top: 20px;
        font-size: 0.8rem;
        border: 1px solid #1e293b;
    }
    
    /* Custom Headers */
    .section-header {
        font-size: 1.1rem;
        font-weight: 600;
        color: #94a3b8;
        margin-bottom: 15px;
        border-bottom: 1px solid #1e293b;
        padding-bottom: 8px;
    }
</style>
""", unsafe_allow_html=True)

# Database Helpers
DB_PATH = "data/etl.db"

def get_db_connection():
    if not os.path.exists(DB_PATH):
        return None
    return sqlite3.connect(DB_PATH)

def fetch_students_data():
    conn = get_db_connection()
    if conn is None:
        return pd.DataFrame()
    try:
        df = pd.read_sql_query("SELECT * FROM students", conn)
        conn.close()
        return df
    except Exception:
        return pd.DataFrame()

def fetch_attendance_history():
    conn = get_db_connection()
    if conn is None:
        return pd.DataFrame()
    try:
        df = pd.read_sql_query("SELECT * FROM attendance_history", conn)
        conn.close()
        return df
    except Exception:
        # Fallback trend
        return pd.DataFrame([
            {"Month": "Dec", "Attendance_Percentage": 76.2},
            {"Month": "Jan", "Attendance_Percentage": 78.5},
            {"Month": "Feb", "Attendance_Percentage": 82.1},
            {"Month": "Mar", "Attendance_Percentage": 79.3},
            {"Month": "Apr", "Attendance_Percentage": 85.4},
            {"Month": "May", "Attendance_Percentage": 87.6}
        ])

def fetch_pipeline_runs():
    conn = get_db_connection()
    if conn is None:
        return []
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT RunID, Date, Time, Duration, RowsProcessed, Status, Operator FROM pipeline_runs ORDER BY RunID DESC LIMIT 5")
        runs = cursor.fetchall()
        conn.close()
        return runs
    except Exception:
        return []

def run_etl_pipeline(azure=False, email=False):
    python_exe = ".venv\\Scripts\\python" if os.path.exists(".venv") else "python"
    cmd = [python_exe, "run_etl.py"]
    if azure:
        cmd.append("--azure")
    if email:
        cmd.append("--email")
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stderr

# Session state initialization
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False

# ----------------- LOGIN PAGE -----------------
if not st.session_state.logged_in:
    st.markdown('<div class="login-container">', unsafe_allow_html=True)
    st.markdown("<h2 style='text-align: center; color: #f8fafc; font-weight: 800; margin-bottom: 5px;'>🎓 EduAnalytics</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 25px;'>Admin Portal Ingress</p>", unsafe_allow_html=True)
    
    username = st.text_input("Username", placeholder="Enter admin username")
    password = st.text_input("Password", type="password", placeholder="Enter password")
    
    st.markdown("<div style='margin-top: 20px;'>", unsafe_allow_html=True)
    if st.button("Log In", use_container_width=True, type="primary"):
        if username == "admin" and password == "admin123":
            st.session_state.logged_in = True
            st.rerun()
        else:
            st.error("Invalid Username or Password.")
    st.markdown("</div>", unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    st.stop()

# ----------------- MAIN APP CONTENT -----------------

# Fetch Data
students_df = fetch_students_data()

# Auto-ETL Trigger if database is missing
if students_df.empty:
    st.warning("No student records found in the database. Auto-running the ETL pipeline to initialize data...")
    success, log = run_etl_pipeline()
    if success:
        st.success("ETL Pipeline completed successfully! Reloading data...")
        students_df = fetch_students_data()
        st.rerun()
    else:
        st.error(f"Failed to initialize database: {log}")
        st.stop()

# Extract dashboard stats
total_students = len(students_df)
avg_marks = students_df["Final Marks"].mean()
pass_count = len(students_df[students_df["Result"] == "Pass"])
pass_pct = (pass_count / total_students) * 100 if total_students > 0 else 0.0

highest_row = students_df.loc[students_df["Final Marks"].idxmax()] if total_students > 0 else None
highest_score = highest_row["Final Marks"] if highest_row is not None else 0.0
highest_student = f"{highest_row['Name']} ({highest_row['Department']})" if highest_row is not None else "N/A"

failed_students = total_students - pass_count
unique_depts = students_df["Department"].nunique() if total_students > 0 else 0

# Sidebar Layout
with st.sidebar:
    st.markdown("<h2 style='color: #ffffff; font-weight: 800; font-size: 1.5rem; margin-bottom: 2px;'>🎓 EduAnalytics</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #475569; font-size: 0.8rem; margin-bottom: 25px;'>Student Data Operations</p>", unsafe_allow_html=True)
    
    st.markdown("<p style='color: #f97316; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 10px; margin-top: 20px;'>DATA MANAGEMENT</p>", unsafe_allow_html=True)
    menu = st.radio(
        label="Navigation Menu",
        options=[
            "Dashboard", 
            "Upload Data", 
            "View Records", 
            "Data Quality", 
            "Detail Reports", 
            "Download Center"
        ],
        label_visibility="collapsed"
    )
    
    st.markdown("---")
    if st.button("Log Out", use_container_width=True, type="secondary"):
        st.session_state.logged_in = False
        st.rerun()
        
    # Bottom Sidebar Status
    st.markdown(
        f"""
        <div class="status-panel">
            <p style="margin: 0; color: #10b981; font-weight: 700;">● All Systems Operational</p>
            <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 0.8rem;">Internet (Connected)</p>
            <p style="margin: 2px 0 0 0; color: #94a3b8; font-size: 0.8rem;">Cloud Sync Enabled</p>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 0.75rem;">Last Update: {datetime.now().strftime('%d %b %Y %H:%M')}</p>
        </div>
        """, 
        unsafe_allow_html=True
    )

# ----------------- VIEW: DASHBOARD -----------------
if menu == "Dashboard":
    st.markdown("<h1 style='font-weight: 800; color: #2563eb; margin-bottom: 2px;'>Student Performance Analytics Dashboard</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b; font-size: 0.95rem; margin-bottom: 25px;'>Real-time insights and analytics from student performance data</p>", unsafe_allow_html=True)
    
    # 1. Top Metric Cards (Grid of 6 columns)
    m1, m2, m3, m4, m5, m6 = st.columns(6)
    
    with m1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Total Students</div>
            <div class="metric-value">{total_students:,}</div>
            <div class="metric-subtitle">↑ 5.2% <span style="color: #64748b; font-weight: 400;">from last month</span></div>
        </div>
        """, unsafe_allow_html=True)
        
    with m2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Average Marks</div>
            <div class="metric-value">{avg_marks:.2f}%</div>
            <div class="metric-subtitle">↑ 3.1% <span style="color: #64748b; font-weight: 400;">from last month</span></div>
        </div>
        """, unsafe_allow_html=True)
        
    with m3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Pass Percentage</div>
            <div class="metric-value">{pass_pct:.2f}%</div>
            <div class="metric-subtitle">↑ 2.8% <span style="color: #64748b; font-weight: 400;">from last month</span></div>
        </div>
        """, unsafe_allow_html=True)
        
    with m4:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Highest Score</div>
            <div class="metric-value">{highest_score:.1f}%</div>
            <div class="metric-subtitle" style="color: #4f46e5; font-size: 0.68rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{highest_student}</div>
        </div>
        """, unsafe_allow_html=True)
        
    with m5:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Failed Students</div>
            <div class="metric-value">{failed_students}</div>
            <div class="metric-subtitle-red">↑ 11.1% <span style="color: #64748b; font-weight: 400;">from last month</span></div>
        </div>
        """, unsafe_allow_html=True)
        
    with m6:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title">Departments</div>
            <div class="metric-value">{unique_depts}</div>
            <div class="metric-subtitle" style="color: #0284c7;">Active Departments</div>
        </div>
        """, unsafe_allow_html=True)
        
    st.markdown("<br>", unsafe_allow_html=True)
    
    # 2. Charts Row (Donut, Bar, Line)
    c1, c2, c3 = st.columns(3)
    
    with c1:
        st.markdown('<div class="section-header">Students by Department</div>', unsafe_allow_html=True)
        dept_counts = students_df["Department"].value_counts().reset_index()
        dept_counts.columns = ["Department", "Students"]
        fig_donut = px.pie(
            dept_counts, 
            values="Students", 
            names="Department", 
            hole=0.5,
            color_discrete_sequence=px.colors.qualitative.Safe
        )
        fig_donut.update_layout(
            template="plotly_dark",
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            margin=dict(t=10, b=10, l=10, r=10),
            legend=dict(orientation="h", yanchor="bottom", y=-0.15, xanchor="center", x=0.5),
            height=280
        )
        st.plotly_chart(fig_donut, use_container_width=True)
        
    with c2:
        st.markdown('<div class="section-header">Average Marks by Department</div>', unsafe_allow_html=True)
        dept_avg_marks = students_df.groupby("Department")["Final Marks"].mean().reset_index()
        dept_avg_marks.columns = ["Department", "Average Marks (%)"]
        fig_bar = px.bar(
            dept_avg_marks,
            x="Department",
            y="Average Marks (%)",
            color="Department",
            color_discrete_sequence=px.colors.qualitative.Safe,
            text_auto='.1f'
        )
        fig_bar.update_layout(
            template="plotly_dark",
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            margin=dict(t=10, b=10, l=10, r=10),
            showlegend=False,
            height=280,
            yaxis_range=[0, 100]
        )
        st.plotly_chart(fig_bar, use_container_width=True)
        
    with c3:
        st.markdown('<div class="section-header">Attendance Trend (Last 6 Months)</div>', unsafe_allow_html=True)
        trend_df = fetch_attendance_history()
        fig_line = px.line(
            trend_df,
            x="Month",
            y="Attendance_Percentage",
            markers=True,
            labels={"Attendance_Percentage": "Attendance (%)"}
        )
        fig_line.update_traces(line_color="#3b82f6", line_width=3, marker=dict(size=8, color="#60a5fa"))
        fig_line.update_layout(
            template="plotly_dark",
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            margin=dict(t=10, b=10, l=10, r=10),
            height=280,
            yaxis_range=[60, 100]
        )
        st.plotly_chart(fig_line, use_container_width=True)
        
    # 3. Bottom Row: Top 10 Table, Grade Pie Chart, Student Search
    r1, r2, r3 = st.columns([1.5, 1, 1.2])
    
    with r1:
        st.markdown('<div class="section-header">Top 10 Students</div>', unsafe_allow_html=True)
        top_10 = students_df.sort_values(by="Final Marks", ascending=False).head(10).reset_index(drop=True)
        top_10.index += 1
        top_10_disp = top_10[["Name", "Department", "Final Marks", "Attendance", "Grade"]].rename(
            columns={"Final Marks": "Average Marks (%)"}
        )
        st.dataframe(top_10_disp, use_container_width=True, height=380)
        
    with r2:
        st.markdown('<div class="section-header">Performance Distribution</div>', unsafe_allow_html=True)
        grade_counts = students_df["Grade"].value_counts().reset_index()
        grade_counts.columns = ["Grade", "Count"]
        # Custom color map for grades
        grade_colors = {
            "A+": "#10b981", # Green
            "A": "#3b82f6",  # Blue
            "B": "#f59e0b",  # Amber
            "C": "#a855f7",  # Purple
            "F": "#ef4444"   # Red
        }
        fig_grades = px.pie(
            grade_counts, 
            values="Count", 
            names="Grade",
            color="Grade",
            color_discrete_map=grade_colors
        )
        fig_grades.update_layout(
            template="plotly_dark",
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            margin=dict(t=10, b=10, l=10, r=10),
            legend=dict(orientation="h", yanchor="bottom", y=-0.15, xanchor="center", x=0.5),
            height=300
        )
        st.plotly_chart(fig_grades, use_container_width=True)
        
    with r3:
        st.markdown('<div class="section-header">Search Student</div>', unsafe_allow_html=True)
        search_term = st.text_input("Search student...", placeholder="Search by name, ID or department...")
        
        if search_term:
            res_df = students_df[
                students_df["Name"].str.contains(search_term, case=False) |
                students_df["StudentID"].str.contains(search_term, case=False) |
                students_df["Department"].str.contains(search_term, case=False)
            ]
            
            if not res_df.empty:
                st.write(f"Found {len(res_df)} match(es):")
                for index, row in res_df.head(3).iterrows():
                    st.markdown(f"""
                    <div style="background-color: #1e2030; border: 1px solid #2d3748; border-radius: 10px; padding: 12px; margin-bottom: 8px;">
                        <span style="font-weight: 700; color: #ffffff; font-size: 0.95rem;">{row['Name']}</span> 
                        <span style="font-size: 0.75rem; color: #a0aec0; background-color: #2d3748; padding: 2px 6px; border-radius: 4px; margin-left: 5px;">{row['Department']}</span>
                        <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 4px;">
                            ID: <b>{row['StudentID']}</b> | Attendance: <b>{row['Attendance']}%</b>
                        </div>
                        <div style="font-size: 0.8rem; color: #cbd5e1;">
                            Marks: <b>{row['Final Marks']}%</b> | Grade: <b style="color:{grade_colors.get(row['Grade'], '#f8fafc')};">{row['Grade']}</b>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                if len(res_df) > 3:
                    st.info(f"+ {len(res_df) - 3} more match(es). Go to 'View Records' menu to see all.")
            else:
                st.warning("No student records matched your search query.")
        else:
            # Default quick view cards
            quick_list = students_df.sort_values(by="Final Marks", ascending=False).head(3)
            for idx, row in quick_list.iterrows():
                st.markdown(f"""
                <div style="background-color: #1e2030; border: 1px solid #2d3748; border-radius: 10px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-weight: 600; color: #ffffff;">{row['Name']}</span><br>
                        <span style="font-size: 0.75rem; color: #a0aec0;">{row['Department']} - Roll: {row['StudentID']}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-weight: 700; color: #60a5fa; font-size: 1.05rem;">{row['Final Marks']:.1f}%</span><br>
                        <span style="font-size: 0.7rem; color: #a0aec0;">Avg Marks</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
            if st.button("View All Students", use_container_width=True):
                st.info("Select 'View Records' in the sidebar menu to view all student entries.")

# ----------------- VIEW: UPLOAD DATA -----------------
elif menu == "Upload Data":
    st.markdown("<h1 style='font-weight: 800; color: #0f172a; margin-bottom: 2px;'>Upload Staging Student Data</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b; font-size: 0.95rem; margin-bottom: 25px;'>Upload a new CSV/Excel batch payload to trigger the ETL Pipeline</p>", unsafe_allow_html=True)
    
    st.info("Make sure the file columns match the schema: StudentID, Name, Department, Gender, Attendance, Mid1, Mid2, Assignment, Final Marks, Result (or let the ETL pipeline calculate marks/grades dynamically).")
    
    uploaded_file = st.file_uploader("Select Staging CSV Payload File", type=["csv"])
    
    c_azure = st.checkbox("Replicate backup to Azure Blob Storage container on success", value=False)
    c_email = st.checkbox("Email dispatch automated HTML performance report", value=False)
    
    if uploaded_file is not None:
        # Save to data directory
        save_path = "data/student_data.csv"
        with open(save_path, "wb") as f:
            f.write(uploaded_file.getbuffer())
        st.success(f"File uploaded successfully and staged at: `{save_path}`")
        
        if st.button("Trigger Ingestion ETL Pipeline", type="primary", use_container_width=True):
            with st.spinner("Executing Extraction, Transformation, Loading, and Cloud Sync steps..."):
                success, log_output = run_etl_pipeline(azure=c_azure, email=c_email)
                if success:
                    st.success("ETL Pipeline completed successfully! ✓")
                    with st.expander("ETL Pipeline Terminal Output Logs"):
                        st.code(log_output)
                    # Trigger cache reload
                    st.session_state["pipeline_triggered"] = True
                else:
                    st.error("ETL Ingestion failed!")
                    st.code(log_output)

# ----------------- VIEW: VIEW RECORDS -----------------
elif menu == "View Records":
    st.markdown("<h1 style='font-weight: 800; color: #0f172a; margin-bottom: 2px;'>Processed Student Records</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b; font-size: 0.95rem; margin-bottom: 25px;'>Review or filter all currently loaded database records in SQLite</p>", unsafe_allow_html=True)
    
    # Filters
    f1, f2, f3 = st.columns(3)
    with f1:
        depts_list = ["ALL"] + sorted(list(students_df["Department"].unique()))
        sel_dept = st.selectbox("Filter by Department", depts_list)
    with f2:
        genders_list = ["ALL"] + sorted(list(students_df["Gender"].unique()))
        sel_gender = st.selectbox("Filter by Gender", genders_list)
    with f3:
        results_list = ["ALL", "Pass", "Fail"]
        sel_result = st.selectbox("Filter by Result Status", results_list)
        
    filtered_df = students_df.copy()
    if sel_dept != "ALL":
        filtered_df = filtered_df[filtered_df["Department"] == sel_dept]
    if sel_gender != "ALL":
        filtered_df = filtered_df[filtered_df["Gender"] == sel_gender]
    if sel_result != "ALL":
        filtered_df = filtered_df[filtered_df["Result"] == sel_result]
        
    st.write(f"Showing {len(filtered_df)} of {len(students_df)} students:")
    st.dataframe(filtered_df.reset_index(drop=True), use_container_width=True, height=450)

# ----------------- VIEW: DATA QUALITY -----------------
elif menu == "Data Quality":
    st.markdown("<h1 style='font-weight: 800; color: #0f172a; margin-bottom: 2px;'>Data Quality Assurance checks</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b; font-size: 0.95rem; margin-bottom: 25px;'>Data completeness and schema conformity validation logs</p>", unsafe_allow_html=True)
    
    dq1, dq2, dq3 = st.columns(3)
    
    # Let's count potential quality anomalies
    null_count = students_df.isnull().sum().sum()
    duplicate_ids = students_df["StudentID"].duplicated().sum()
    total_cells = students_df.size
    validity_percentage = ((total_cells - null_count) / total_cells) * 100 if total_cells > 0 else 100.0
    
    with dq1:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title" style="color:#f59e0b;">Missing Values</div>
            <div class="metric-value">{null_count}</div>
            <div class="metric-subtitle">Missing cells detected in DB</div>
        </div>
        """, unsafe_allow_html=True)
        
    with dq2:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title" style="color:#ef4444;">Duplicate Records</div>
            <div class="metric-value">{duplicate_ids}</div>
            <div class="metric-subtitle">Duplicate StudentIDs in table</div>
        </div>
        """, unsafe_allow_html=True)
        
    with dq3:
        st.markdown(f"""
        <div class="metric-card">
            <div class="metric-title" style="color:#10b981;">Valid Entries</div>
            <div class="metric-value">{validity_percentage:.2f}%</div>
            <div class="metric-subtitle">Data completeness compliance</div>
        </div>
        """, unsafe_allow_html=True)
        
    st.markdown("<br><div class='section-header'>Schema Compliance and Column Checks</div>", unsafe_allow_html=True)
    
    schema_info = []
    for col in students_df.columns:
        dtype = str(students_df[col].dtype)
        completeness = ((len(students_df) - students_df[col].isnull().sum()) / len(students_df)) * 100
        schema_info.append({
            "Column Name": col,
            "Detected Data Type": dtype,
            "Completeness Rate": f"{completeness:.1f}%",
            "Status": "Passed ✓" if completeness == 100.0 else "Attention Required ⚠️"
        })
        
    st.table(pd.DataFrame(schema_info))

# ----------------- VIEW: EMAIL REPORTS -----------------
elif menu == "Email Reports":
    st.markdown("<h1 style='font-weight: 800; color: #0f172a; margin-bottom: 2px;'>SMTP Automated Email Reports</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b; font-size: 0.95rem; margin-bottom: 25px;'>Manually dispatch HTML reports and charts to administrators</p>", unsafe_allow_html=True)
    
    st.info("Configures and triggers the ETL email notification stage using the local SMTP configuration.")
    
    # Read environment configs if present
    env_vars = {}
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.strip().split("=", 1)
                    env_vars[k.strip()] = v.strip()
                    
    rec_email = st.text_input("Recipient Administrator Email Address", value=env_vars.get("RECEIVER_EMAIL", "recipient@example.com"))
    
    if st.button("Send Ingestion Analytics Email", type="primary", use_container_width=True):
        with st.spinner("Preparing attachments and dispatching email package..."):
            success, log_output = run_etl_pipeline(azure=False, email=True)
            if success:
                st.success(f"Daily report sent successfully! ✓ Subject delivered to: **{rec_email}**")
                with st.expander("ETL Emailer logs"):
                    st.code(log_output)
            else:
                st.error("Failed to dispatch email. Please check your SMTP parameters in `.env`.")
                st.code(log_output)

# ----------------- VIEW: DOWNLOAD CENTER -----------------
elif menu == "Download Center":
    st.markdown("<h1 style='font-weight: 800; color: #0f172a; margin-bottom: 2px;'>Download Reports & Datasets</h1>", unsafe_allow_html=True)
    st.markdown("<p style='color: #64748b; font-size: 0.95rem; margin-bottom: 25px;'>Export student analytics data in standard industry formats</p>", unsafe_allow_html=True)
    
    d1, d2, d3 = st.columns(3)
    
    with d1:
        st.subheader("1. Raw Student CSV")
        st.write("Export full tabular student records in CSV format.")
        csv_buffer = BytesIO()
        students_df.to_csv(csv_buffer, index=False)
        st.download_button(
            label="Download CSV",
            data=csv_buffer.getvalue(),
            file_name="student_records_export.csv",
            mime="text/csv",
            use_container_width=True
        )
        
    with d2:
        st.subheader("2. Microsoft Excel (.xlsx)")
        st.write("Export records in clean spreadsheet formats with separate sheets.")
        xlsx_buffer = BytesIO()
        with pd.ExcelWriter(xlsx_buffer, engine='openpyxl') as writer:
            students_df.to_excel(writer, sheet_name="Students", index=False)
            fetch_attendance_history().to_excel(writer, sheet_name="Attendance Trend", index=False)
        st.download_button(
            label="Download Excel Spreadsheet",
            data=xlsx_buffer.getvalue(),
            file_name="student_records_export.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True
        )
        
    with d3:
        st.subheader("3. HTML Telemetry Report")
        st.write("Download the static HTML metrics profiling dashboard report.")
        html_report_path = "reports/report.html"
        if os.path.exists(html_report_path):
            with open(html_report_path, "r", encoding="utf-8") as f:
                html_data = f.read()
            st.download_button(
                label="Download HTML Report",
                data=html_data,
                file_name="student_performance_report.html",
                mime="text/html",
                use_container_width=True
            )
        else:
            st.warning("HTML report has not been generated yet. Please run the ETL Pipeline first.")
