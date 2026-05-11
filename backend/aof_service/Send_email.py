import smtplib
from email.mime.text import MIMEText
from email.header import Header
content = "Dear Teacher:\n"
sender = "jeffcai672@gmail.com"
receiver = "campisin27@avonoldfarms.com"
password = "jvtbdevagydnipes"
msg = MIMEText(content,"plain","utf-8")
msg["From"] = Header("AOF Service APP", "utf-8")
msg["To"] = Header("Jeff","utf_8")
msg["Subject"] = Header("Service Hour Verification", "utf-8")
with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
    server.login(sender, password)
    server.sendmail(sender, receiver, msg.as_string())
server.close()
