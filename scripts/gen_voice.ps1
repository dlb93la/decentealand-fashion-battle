Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $voice = $synth.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'en-*' } | Select-Object -First 1
  if ($voice) { $synth.SelectVoice($voice.VoiceInfo.Name) }
  $synth.Rate = 2
  $audioDir = Join-Path $PSScriptRoot '../assets/Audio'
  $words = @{1='One';2='Two';3='Three'}
  foreach ($number in 1..3) {
    $synth.SetOutputToWaveFile((Join-Path $audioDir ('count-' + $number + '.wav')))
    $synth.Speak($words[$number])
    $synth.SetOutputToNull()
  }
} finally { $synth.Dispose() }
