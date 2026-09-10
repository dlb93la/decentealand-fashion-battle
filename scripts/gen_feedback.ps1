# Original synthesized chimes, mono PCM16/22050 Hz. No external assets.
$audioDir = Join-Path $PSScriptRoot '../assets/Audio'
$melodies = @{ 'theme' = @(440, 554.37, 659.25); 'vote' = @(880, 1174.66); 'victory' = @(523.25, 659.25, 783.99, 1046.5) }
foreach ($name in $melodies.Keys) {
  $rate = 22050
  $duration = if ($name -eq 'vote') { 0.09 } else { 0.18 }
  $notes = $melodies[$name]
  $samplesPerNote = [int]($duration * $rate)
  $bytes = $samplesPerNote * $notes.Count * 2
  $stream = [System.IO.File]::Create((Join-Path $audioDir ($name + '.wav')))
  $writer = [System.IO.BinaryWriter]::new($stream)
  try {
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes('RIFF'))
    $writer.Write([int](36 + $bytes))
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes('WAVEfmt '))
    $writer.Write([int]16); $writer.Write([int16]1); $writer.Write([int16]1)
    $writer.Write([int]$rate); $writer.Write([int]($rate * 2))
    $writer.Write([int16]2); $writer.Write([int16]16)
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes('data')); $writer.Write([int]$bytes)
    foreach ($frequency in $notes) {
      for ($i = 0; $i -lt $samplesPerNote; $i++) {
        $t = $i / $rate
        $envelope = [Math]::Min(1, $t / 0.008) * [Math]::Pow(1 - $i / $samplesPerNote, 2)
        $sample = [Math]::Sin(2 * [Math]::PI * $frequency * $t) * $envelope * 9000
        $writer.Write([int16]$sample)
      }
    }
  } finally { $writer.Dispose(); $stream.Dispose() }
}
