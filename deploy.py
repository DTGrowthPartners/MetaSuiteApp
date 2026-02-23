import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
import paramiko, os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('149.56.133.201', username='ubuntu', password='zohzer-sebky3-pypNaw')

sftp = ssh.open_sftp()

# Upload metaAdsApi.js
local_api = r'c:\Users\Edgar\OneDrive\Documentos\MetaSuiteApp\meta-ads-dashboard\src\services\metaAdsApi.js'
remote_api = '/home/ubuntu/MetaSuiteApp/meta-ads-dashboard/src/services/metaAdsApi.js'
sftp.put(local_api, remote_api)
print('Uploaded metaAdsApi.js')

# Upload server/index.js (backend)
local_server = r'c:\Users\Edgar\OneDrive\Documentos\MetaSuiteApp\meta-ads-dashboard\server\index.js'
remote_server = '/home/ubuntu/MetaSuiteApp/meta-ads-dashboard/server/index.js'
sftp.put(local_server, remote_server)
print('Uploaded server/index.js')

# Upload dist files
local_dist = r'c:\Users\Edgar\OneDrive\Documentos\MetaSuiteApp\meta-ads-dashboard\dist'
remote_dist = '/home/ubuntu/MetaSuiteApp/meta-ads-dashboard/dist'

for root, dirs, files in os.walk(local_dist):
    for d in dirs:
        local_dir = os.path.join(root, d)
        rel = os.path.relpath(local_dir, local_dist).replace(os.sep, '/')
        remote_dir = remote_dist + '/' + rel
        try:
            sftp.mkdir(remote_dir)
        except:
            pass

    for f in files:
        local_file = os.path.join(root, f)
        rel = os.path.relpath(local_file, local_dist).replace(os.sep, '/')
        remote_file = remote_dist + '/' + rel
        sftp.put(local_file, remote_file)
        print('Uploaded dist/' + rel)

sftp.close()

# Restart PM2
stdin, stdout, stderr = ssh.exec_command('pm2 restart meta-ads-api')
print(stdout.read().decode('utf-8', errors='replace'))
print(stderr.read().decode('utf-8', errors='replace'))

ssh.close()
print('Deploy complete!')
