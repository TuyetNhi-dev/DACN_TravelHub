param([string]$BaseUrl = 'http://localhost:3000')
$ErrorActionPreference = 'Stop'
$base = $BaseUrl
$jar = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$email = 'auth-test-' + [Guid]::NewGuid().ToString('N') + '@example.invalid'
$password = [Guid]::NewGuid().ToString('N') + 'a!9'
function Call-Api($path, $body = $null, $csrf = $true, $session = $jar) {
    $parameters = @{Uri=($base+'/api/auth/'+$path); WebSession=$session; UseBasicParsing=$true; TimeoutSec=30}
    if ($null -ne $body) {
        $parameters.Method='POST'; $parameters.ContentType='application/json; charset=utf-8'
        $parameters.Body=([System.Text.Encoding]::UTF8.GetBytes(($body | ConvertTo-Json -Compress)))
        if ($csrf) {
            $token = (Invoke-RestMethod -Uri ($base+'/api/auth/csrf') -WebSession $session).token
            $parameters.Headers=@{'X-CSRF-Token'=$token}
        }
    }
    try { $r=Invoke-WebRequest @parameters; return @{Status=[int]$r.StatusCode; Data=($r.Content | ConvertFrom-Json)} }
    catch { if ($_.Exception.Response) { return @{Status=[int]$_.Exception.Response.StatusCode} }; throw }
}
function Expect($name,$actual,$expected) {
    if($actual -ne $expected) { throw ($name+' expected '+$expected+' got '+$actual) }
    Write-Output ('PASS '+$name+' = '+$actual)
}
Expect 'anonymous me' (Call-Api 'me').Status 401
Expect 'csrf required' (Call-Api 'login' @{email=$email;password=$password} $false).Status 400
Expect 'invalid registration' (Call-Api 'register' @{fullName='A';email='bad';phone='x';password='short';confirmPassword='other'}).Status 400
$registration=@{fullName='Kiểm thử xác thực';email=$email;phone='0900000000';password=$password;confirmPassword=$password;role='SUPER_ADMIN';scope='global'}
Expect 'registration' (Call-Api 'register' $registration).Status 200
Expect 'duplicate email' (Call-Api 'register' $registration).Status 409
Expect 'wrong password' (Call-Api 'login' @{email=$email;password='Incorrect-password-123!'}).Status 401
Expect 'login' (Call-Api 'login' @{email=$email.ToUpperInvariant();password=$password}).Status 200
$me=Call-Api 'me'
Expect 'authenticated me' $me.Status 200
Expect 'customer role count' $me.Data.user.roles.Count 1
Expect 'cannot self-assign admin' $me.Data.user.roles[0].code 'CUSTOMER'
Expect 'customer scope' $me.Data.user.roles[0].scope 'self'
$cookie=$jar.Cookies.GetCookies([Uri]$base) | Where-Object Name -eq 'SaiHanh.Session'
Expect 'session HttpOnly' $cookie.HttpOnly $true
$replayJar=New-Object Microsoft.PowerShell.Commands.WebRequestSession
$replayCookie=New-Object System.Net.Cookie('SaiHanh.Session',$cookie.Value,'/','localhost')
$replayJar.Cookies.Add($replayCookie)
$page=Invoke-WebRequest ($base+'/account') -WebSession $jar -UseBasicParsing -TimeoutSec 30
Expect 'protected account signed in' ([int]$page.StatusCode) 200
Expect 'logout' (Call-Api 'logout' @{}).Status 200
Expect 'me after logout' (Call-Api 'me').Status 401
Expect 'old cookie replay after logout' (Call-Api 'me' $null $true $replayJar).Status 401
$page=Invoke-WebRequest ($base+'/account') -WebSession $jar -UseBasicParsing -TimeoutSec 30
$redirected = $page.BaseResponse.ResponseUri.AbsolutePath -eq '/login'
# A loading boundary can commit HTTP 200 before Next streams its redirect instruction.
$streamedRedirect = $page.Content -match '<meta[^>]*id="__next-page-redirect"[^>]*content="[0-9]+;url=/login\?next=/account(?:&amp;expired=1)?"'
Expect 'protected account redirects to login' ($redirected -or $streamedRedirect) $true
foreach($path in @('/login','/register')) {
 $page=Invoke-WebRequest ($base+$path) -UseBasicParsing
 Expect ('page '+$path) ([int]$page.StatusCode) 200
}
Write-Output ('TEST_ACCOUNT='+$email)
