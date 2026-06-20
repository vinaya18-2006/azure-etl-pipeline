import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

def send_email_report(subject, body, attachment_paths, smtp_config):
    """
    Constructs and dispatches email reports via SMTP.
    Falls back to simulation logging if settings remain in default state.
    """
    print("[EMAILER] Composing email packages and binding attachments...")
    
    sender = smtp_config.get('sender_email')
    receiver = smtp_config.get('receiver_email')
    user = smtp_config.get('smtp_user')
    password = smtp_config.get('smtp_password')
    host = smtp_config.get('smtp_host', 'smtp.gmail.com')
    port = int(smtp_config.get('smtp_port', 587))
    
    # Check SMTP configuration integrity
    if not sender or not receiver or not user or not password or "your_email" in sender:
        print("[EMAILER] SMTP credentials not set in environment. Simulating dispatch...")
        print(f"[EMAILER] Mail Simulated: Sent subject '{subject}' to '{receiver}' from '{sender}'. Attachments: {attachment_paths}")
        return True
        
    try:
        msg = MIMEMultipart()
        msg['From'] = sender
        msg['To'] = receiver
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        for file_path in attachment_paths:
            if os.path.exists(file_path):
                filename = os.path.basename(file_path)
                with open(file_path, "rb") as f:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', f'attachment; filename={filename}')
                msg.attach(part)
                
        # Connect & dispatch
        server = smtplib.SMTP(host, port)
        server.starttls()
        server.login(user, password)
        server.sendmail(sender, receiver, msg.as_string())
        server.quit()
        
        print(f"[EMAILER] Email dispatch successful. Recipient: {receiver}")
        return True
    except Exception as e:
        print(f"[EMAILER] Connection to SMTP server failed: {e}")
        return False
