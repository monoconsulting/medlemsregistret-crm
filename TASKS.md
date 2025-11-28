#MEDLEMSREGISTRET CRM
##TASKS



Föreningar->Huvudmodal
Problem efter uppdatering av pipeline

1. Om dropdown "Status" uppdateras så ges http 500 error
Följande visas i devlog:
11:48:42,258 XHRPUT
https://crm.medlemsregistret.se/api/associations.php
[HTTP/2 500  49ms]

	
PUT
	https://crm.medlemsregistret.se/api/associations.php
Status
500
VersionHTTP/2
Överfört1,34 kB (0 B storlek)
Referreringspolicystrict-origin-when-cross-origin
Begärans prioritetHighest
DNS-uppslagningSystem

httpd-error.log
[28-Nov-2025 11:46:46 Europe/Stockholm] PHP Fatal error:  Uncaught mysqli_sql_exception: Unknown column 'lifecycleStage' in 'SELECT' in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php:344
Stack trace:
#0 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(344): mysqli->prepare('SELECT crmStatu...')
#1 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(38): handle_update_association()
#2 {main}
  thrown in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php on line 344
[28-Nov-2025 11:46:50 Europe/Stockholm] PHP Fatal error:  Uncaught mysqli_sql_exception: Unknown column 'lifecycleStage' in 'SELECT' in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php:344
Stack trace:
#0 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(344): mysqli->prepare('SELECT crmStatu...')
#1 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(38): handle_update_association()
#2 {main}
  thrown in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php on line 344
[28-Nov-2025 11:46:52 Europe/Stockholm] PHP Fatal error:  Uncaught mysqli_sql_exception: Unknown column 'lifecycleStage' in 'SELECT' in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php:344
Stack trace:
#0 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(344): mysqli->prepare('SELECT crmStatu...')
#1 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(38): handle_update_association()
#2 {main}
  thrown in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php on line 344
[28-Nov-2025 11:48:45 Europe/Stockholm] PHP Fatal error:  Uncaught mysqli_sql_exception: Unknown column 'lifecycleStage' in 'SELECT' in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php:344
Stack trace:
#0 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(344): mysqli->prepare('SELECT crmStatu...')
#1 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(38): handle_update_association()
#2 {main}
  thrown in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php on line 344



2. Om dropdown "Pipeline" uppdateras så ges http 500 error
Följande visas i devlog:
11:52:17,727 XHRPUT
https://crm.medlemsregistret.se/api/associations.php
[HTTP/2 500  60ms]

	
PUT
	https://crm.medlemsregistret.se/api/associations.php
Status
500
VersionHTTP/2
Överfört1,34 kB (0 B storlek)
Referreringspolicystrict-origin-when-cross-origin
Begärans prioritetHighest
DNS-uppslagningSystem

[28-Nov-2025 11:52:20 Europe/Stockholm] PHP Fatal error:  Uncaught mysqli_sql_exception: Unknown column 'lifecycleStage' in 'SELECT' in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php:344
Stack trace:
#0 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(344): mysqli->prepare('SELECT crmStatu...')
#1 /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php(38): handle_update_association()
#2 {main}
  thrown in /www/webvol55/0u/h1ybs08jxr48j4n/crm.medlemsregistret.se/public_html/api/associations.php on line 344


3. Kolumnen Pipeline i tabellen "Föreningslista" visar inte statusar för Pipeline






