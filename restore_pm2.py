import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
# Contraseña por variable de entorno — exporta VPS_SSH_PASSWORD antes de correr esto.
ssh.connect('149.56.133.201', username='ubuntu', password=os.environ['VPS_SSH_PASSWORD'])
sftp = ssh.open_sftp()
sftp.put(r'c:\Users\Edgar\OneDrive\Documentos\MetaSuiteApp\meta-ads-dashboard\server\generate_eq_report.py',
    '/home/ubuntu/MetaSuiteApp/meta-ads-dashboard/server/generate_eq_report.py')
print('Uploaded generate_eq_report.py')
sftp.close()

stdin, stdout, stderr = ssh.exec_command('fuser -k 3002/tcp 2>/dev/null; sleep 3; pm2 restart meta-ads-api; sleep 4; curl -s http://localhost:3002/api/health | head -1')
print(stdout.read().decode('utf-8', errors='replace').strip())
ssh.close()
print('Done!')
