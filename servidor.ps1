<#
  Calendário de Endomarketing 2027 — servidor local
  Serve a pasta web\ em http://localhost:8027 e grava os dados em dados\calendario-2027.json,
  guardando uma cópia da versão anterior em dados\backups a cada gravação.

  Uso: dois cliques em "Iniciar calendario.bat"
  Ou:  powershell -ExecutionPolicy Bypass -File servidor.ps1 [-Porta 8028] [-SemNavegador]
#>
param(
  [int]$Porta = 8027,
  [switch]$SemNavegador,
  # Pasta de dados alternativa (ex.: uma cópia para testes). Padrão: dados\ ao lado deste script.
  [string]$PastaDados = ''
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $MyInvocation.MyCommand.Path
$pastaWeb = [IO.Path]::GetFullPath((Join-Path $raiz 'web'))
$pastaDados = if ($PastaDados) { [IO.Path]::GetFullPath($PastaDados) } else { Join-Path $raiz 'dados' }
$arquivoDados = Join-Path $pastaDados 'calendario-2027.json'
$pastaBackups = Join-Path $pastaDados 'backups'
$pastaEndo = Join-Path $pastaDados 'endo'
$pastaBackupsEndo = Join-Path $pastaBackups 'endo'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$maxBackups = 60
# Conjuntos de dados do módulo Endomarketing 2027: plano, linkedin, pesquisa e as fichas mes-01 a mes-12
$nomesEndo = '^(plano|linkedin|pesquisa|mes-(0[1-9]|1[0-2]))$'
Add-Type -AssemblyName System.Web.Extensions
$json = New-Object System.Web.Script.Serialization.JavaScriptSerializer
$json.MaxJsonLength = [int]::MaxValue
$json.RecursionLimit = 256
$comprimiveis = '^(text/|application/json|image/svg)'

$tipos = @{
  '.html' = 'text/html; charset=utf-8'
  '.css'  = 'text/css; charset=utf-8'
  '.js'   = 'text/javascript; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'
  '.svg'  = 'image/svg+xml'
  '.png'  = 'image/png'
  '.ico'  = 'image/x-icon'
  '.txt'  = 'text/plain; charset=utf-8'
  '.woff2' = 'font/woff2'
  '.mjs'  = 'text/javascript; charset=utf-8'
}

# Cache em memória das versões comprimidas (chave = arquivo + data de alteração + tamanho):
# o servidor atende um pedido por vez, então não recomprimir a cada pedido faz diferença.
$cacheGz = @{}
$cacheBruto = @{}
function LerComCache([string]$arquivo) {
  $fi = New-Object IO.FileInfo($arquivo)
  $chave = $arquivo + '|' + $fi.LastWriteTimeUtc.Ticks + '|' + $fi.Length
  if (-not $cacheBruto.ContainsKey($chave)) {
    if ($cacheBruto.Count -gt 120) { $cacheBruto.Clear(); $cacheGz.Clear() }
    $cacheBruto[$chave] = [IO.File]::ReadAllBytes($arquivo)
  }
  return @{ chave = $chave; bytes = $cacheBruto[$chave]; info = $fi }
}

function Enviar($ctx, [int]$status, [byte[]]$corpo, [string]$tipo, [string]$cache = 'no-store', [string]$chave = '') {
  $res = $ctx.Response
  $res.StatusCode = $status
  $res.ContentType = $tipo
  $res.Headers['Cache-Control'] = $cache
  $res.Headers['X-Content-Type-Options'] = 'nosniff'
  # Compressão gzip para textos maiores (JSON da pesquisa e das fichas, JS e CSS)
  $aceita = [string]$ctx.Request.Headers['Accept-Encoding']
  if ($corpo.Length -gt 1400 -and $aceita -match 'gzip' -and $tipo -match $comprimiveis) {
    if ($chave -and $cacheGz.ContainsKey($chave)) { $corpo = $cacheGz[$chave] }
    else {
      $ms = New-Object IO.MemoryStream
      $gz = New-Object IO.Compression.GZipStream($ms, [IO.Compression.CompressionLevel]::Fastest)
      $gz.Write($corpo, 0, $corpo.Length); $gz.Close()
      $corpo = $ms.ToArray()
      if ($chave) { $cacheGz[$chave] = $corpo }
    }
    $res.Headers['Content-Encoding'] = 'gzip'
    $res.Headers['Vary'] = 'Accept-Encoding'
  }
  $res.ContentLength64 = $corpo.Length
  $res.OutputStream.Write($corpo, 0, $corpo.Length)
}

# Grava um conjunto de dados com controle de versão (campo "updated") e cópia da versão anterior
function GravarVersionado($ctx, [string]$arquivo, [string]$pastaBk, [string]$prefixo, [scriptblock]$validar) {
  $req = $ctx.Request
  if ($req.ContentLength64 -gt 20MB) { EnviarTexto $ctx 413 '{"erro":"grande-demais"}'; return }
  $leitor = New-Object IO.StreamReader($req.InputStream, $utf8)
  $corpo = $leitor.ReadToEnd()
  $leitor.Close()
  $obj = $null
  try { $obj = $json.DeserializeObject($corpo) } catch { EnviarTexto $ctx 400 '{"erro":"json-invalido"}'; return }
  if (-not (& $validar $obj)) { EnviarTexto $ctx 400 '{"erro":"formato"}'; return }

  $atual = ''
  if (Test-Path $arquivo) { $atual = [IO.File]::ReadAllText($arquivo, $utf8) }
  $versaoAtual = VersaoDe $atual
  $base = [string]$req.Headers['X-Versao']
  $forcar = ([string]$req.Headers['X-Sobrescrever']) -eq '1'
  if ($atual -and -not $forcar -and $base -ne $versaoAtual) {
    EnviarTexto $ctx 409 ('{"erro":"conflito","updated":"' + $versaoAtual + '"}')
    return
  }
  $pasta = Split-Path -Parent $arquivo
  if (-not (Test-Path $pasta)) { New-Item -ItemType Directory -Path $pasta -Force | Out-Null }
  if ($atual) {
    if (-not (Test-Path $pastaBk)) { New-Item -ItemType Directory -Path $pastaBk -Force | Out-Null }
    $nome = $prefixo + '_' + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss-fff') + '.json'
    [IO.File]::WriteAllText((Join-Path $pastaBk $nome), $atual, $utf8)
    Get-ChildItem $pastaBk -Filter ($prefixo + '_*.json') | Sort-Object Name -Descending | Select-Object -Skip $maxBackups | Remove-Item -Force
  }
  $tmp = $arquivo + '.tmp'
  [IO.File]::WriteAllText($tmp, $corpo, $utf8)
  Move-Item -Path $tmp -Destination $arquivo -Force
  Write-Host ('  {0}  {1} salvo.' -f (Get-Date -Format 'HH:mm:ss'), $prefixo)
  EnviarTexto $ctx 200 ('{"ok":true,"updated":"' + (VersaoDe $corpo) + '"}')
}

function TratarEndo($ctx, [string]$nome) {
  if ($nome -notmatch $nomesEndo) { EnviarTexto $ctx 404 '{"erro":"conjunto-desconhecido"}'; return }
  $arquivo = Join-Path $pastaEndo ($nome + '.json')
  $req = $ctx.Request
  if ($req.HttpMethod -eq 'GET') {
    if (-not (Test-Path $arquivo)) { EnviarTexto $ctx 404 '{"erro":"sem-dados"}'; return }
    $f = LerComCache $arquivo
    Enviar $ctx 200 $f.bytes 'application/json; charset=utf-8' 'no-store' $f.chave
    return
  }
  if ($req.HttpMethod -eq 'PUT') {
    GravarVersionado $ctx $arquivo $pastaBackupsEndo $nome { param($o) $o -is [System.Collections.IDictionary] -and $o.ContainsKey('v') -and $o.ContainsKey('updated') }
    return
  }
  $ctx.Response.Headers['Allow'] = 'GET, PUT'
  EnviarTexto $ctx 405 '{"erro":"metodo"}'
}

function EnviarTexto($ctx, [int]$status, [string]$texto, [string]$tipo = 'application/json; charset=utf-8') {
  Enviar $ctx $status ($utf8.GetBytes($texto)) $tipo
}

# Versão = campo "updated" do JSON (lido como texto, para não depender da conversão de datas do PowerShell)
function VersaoDe([string]$json) {
  $m = [regex]::Match($json, '"updated"\s*:\s*"([^"]*)"')
  if ($m.Success) { return $m.Groups[1].Value }
  return ''
}

function TratarApi($ctx) {
  $req = $ctx.Request

  if ($req.HttpMethod -eq 'GET') {
    if (-not (Test-Path $arquivoDados)) { EnviarTexto $ctx 404 '{"erro":"sem-dados"}'; return }
    EnviarTexto $ctx 200 ([IO.File]::ReadAllText($arquivoDados, $utf8))
    return
  }

  if ($req.HttpMethod -eq 'PUT') {
    if ($req.ContentLength64 -gt 10MB) { EnviarTexto $ctx 413 '{"erro":"grande-demais"}'; return }
    $leitor = New-Object IO.StreamReader($req.InputStream, $utf8)
    $corpo = $leitor.ReadToEnd()
    $leitor.Close()

    try { $obj = $corpo | ConvertFrom-Json } catch { EnviarTexto $ctx 400 '{"erro":"json-invalido"}'; return }
    if ($null -eq $obj.events -or $null -eq $obj.categories) { EnviarTexto $ctx 400 '{"erro":"formato"}'; return }

    $atual = ''
    if (Test-Path $arquivoDados) { $atual = [IO.File]::ReadAllText($arquivoDados, $utf8) }
    $versaoAtual = VersaoDe $atual
    $base = [string]$req.Headers['X-Versao']
    $forcar = ([string]$req.Headers['X-Sobrescrever']) -eq '1'

    # Alguém salvou depois que esta página abriu: devolve conflito em vez de apagar o trabalho do outro
    if ($atual -and -not $forcar -and $base -ne $versaoAtual) {
      EnviarTexto $ctx 409 ('{"erro":"conflito","updated":"' + $versaoAtual + '"}')
      return
    }

    if (-not (Test-Path $pastaDados)) { New-Item -ItemType Directory -Path $pastaDados | Out-Null }
    if ($atual) {
      if (-not (Test-Path $pastaBackups)) { New-Item -ItemType Directory -Path $pastaBackups | Out-Null }
      $nome = 'calendario-2027_' + (Get-Date -Format 'yyyy-MM-dd_HH-mm-ss-fff') + '.json'
      [IO.File]::WriteAllText((Join-Path $pastaBackups $nome), $atual, $utf8)
      Get-ChildItem $pastaBackups -Filter '*.json' | Sort-Object Name -Descending | Select-Object -Skip $maxBackups | Remove-Item -Force
    }

    $tmp = $arquivoDados + '.tmp'
    [IO.File]::WriteAllText($tmp, $corpo, $utf8)
    Move-Item -Path $tmp -Destination $arquivoDados -Force
    Write-Host ('  {0}  Calendário salvo.' -f (Get-Date -Format 'HH:mm:ss'))
    EnviarTexto $ctx 200 ('{"ok":true,"updated":"' + (VersaoDe $corpo) + '"}')
    return
  }

  $ctx.Response.Headers['Allow'] = 'GET, PUT'
  EnviarTexto $ctx 405 '{"erro":"metodo"}'
}

function TratarArquivo($ctx) {
  $caminho = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if ($caminho -eq '/' -or $caminho -eq '') { $caminho = '/index.html' }
  $relativo = $caminho.TrimStart('/').Replace('/', '\')
  $completo = ''
  try { $completo = [IO.Path]::GetFullPath((Join-Path $pastaWeb $relativo)) } catch { $completo = '' }
  # Só entrega arquivos de dentro da pasta web\
  if (-not $completo -or -not $completo.StartsWith($pastaWeb + '\', [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $completo -PathType Leaf)) {
    EnviarTexto $ctx 404 'Não encontrado.' 'text/plain; charset=utf-8'
    return
  }
  $ext = [IO.Path]::GetExtension($completo).ToLowerInvariant()
  $tipo = 'application/octet-stream'
  if ($tipos.ContainsKey($ext)) { $tipo = $tipos[$ext] }
  # Revalidação: o navegador guarda o arquivo e só baixa de novo quando ele muda (ETag)
  $info = New-Object IO.FileInfo($completo)
  $etag = '"' + $info.LastWriteTimeUtc.Ticks.ToString('x') + '-' + $info.Length.ToString('x') + '"'
  $ctx.Response.Headers['ETag'] = $etag
  if ([string]$ctx.Request.Headers['If-None-Match'] -eq $etag) {
    $ctx.Response.StatusCode = 304
    $ctx.Response.Headers['Cache-Control'] = 'no-cache'
    return
  }
  $f = LerComCache $completo
  Enviar $ctx 200 $f.bytes $tipo 'no-cache' $f.chave
}

$ouvinte = New-Object System.Net.HttpListener
$endereco = "http://localhost:$Porta/"
$ouvinte.Prefixes.Add($endereco)
try {
  $ouvinte.Start()
} catch {
  Write-Host ''
  Write-Host "  Não foi possível usar a porta $Porta. O calendário talvez já esteja aberto em outra janela." -ForegroundColor Yellow
  Write-Host '  Para usar outra porta: powershell -ExecutionPolicy Bypass -File servidor.ps1 -Porta 8028'
  Write-Host ''
  exit 1
}

Write-Host ''
Write-Host '  Calendário de Endomarketing 2027' -ForegroundColor Cyan
Write-Host "  Aberto em $endereco"
Write-Host "  Dados em  $arquivoDados"
Write-Host '  Mantenha esta janela aberta enquanto usa o calendário. Para encerrar, feche a janela ou aperte Ctrl+C.'
Write-Host ''
if (-not $SemNavegador) { Start-Process $endereco }

try {
  while ($ouvinte.IsListening) {
    $tarefa = $ouvinte.GetContextAsync()
    # Espera em pedaços curtos para o Ctrl+C funcionar
    while (-not $tarefa.AsyncWaitHandle.WaitOne(300)) { }
    $ctx = $tarefa.GetAwaiter().GetResult()
    try {
      $rota = $ctx.Request.Url.AbsolutePath
      if ($rota -eq '/api/calendario') { TratarApi $ctx }
      elseif ($rota.StartsWith('/api/endo/')) { TratarEndo $ctx $rota.Substring(10) }
      else { TratarArquivo $ctx }
    } catch {
      Write-Host ('  Erro: ' + $_.Exception.Message) -ForegroundColor Red
      try { EnviarTexto $ctx 500 '{"erro":"interno"}' } catch { }
    } finally {
      try { $ctx.Response.Close() } catch { }
    }
  }
} finally {
  $ouvinte.Stop()
  $ouvinte.Close()
}
