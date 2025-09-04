-- 更新 auth.config 表中的邮件发送配置，确保使用 sale.nic.bn
UPDATE auth.config 
SET value = 'NIC.BN 域名交易平台 <noreply@sale.nic.bn>'
WHERE parameter = 'MAILER_DEFAULT_FROM_ADDRESS';