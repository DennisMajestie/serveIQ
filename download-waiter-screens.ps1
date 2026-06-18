# Download Waiter Screens from Stitch
$stitchAssetsDir = Join-Path -Path $PWD -ChildPath "stitch-assets"
if (-not (Test-Path -Path $stitchAssetsDir)) {
    New-Item -ItemType Directory -Path $stitchAssetsDir -Force | Out-Null
}

# Payment Processing - Table 5
Invoke-WebRequest -Uri "https://lh3.googleusercontent.com/aida/AP1WRLuT4ihUVOGvn5p528JqqaqKCuA4HfJW4SAainBaDe8kLvoQ2xi-O5iNlw5sKHNe7cynzerHD0wPyLljBZmdDsT0fQ08MIaTu1BXhG6svctxPPbwlD5RHd2kLs2FPJFWu6E7UJTO1jpR9RZLC9vz8bjgWB8ql0YA0uQzfAuTl1fMx1CBtff7smTunHr8pB6EDxtmCaJnIFYSnHCBNM-kBeQiKmU11NlIvFfJtkdAQuPJcbl9qU5QAs0smKLr" -OutFile (Join-Path -Path $stitchAssetsDir -ChildPath "waiter-payment-processing-screenshot.png")
Invoke-WebRequest -Uri "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M4ZjI2NDA1MTczOTQxN2ZiY2Y3NzI3MjBiNjk0Yjg1EgsSBxDakujT0xYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjA4NTgxNDg1NjIxMzIyMzU0OA&filename=&opi=96797242" -OutFile (Join-Path -Path $stitchAssetsDir -ChildPath "waiter-payment-processing.html")

# Tables Overview
Invoke-WebRequest -Uri "https://lh3.googleusercontent.com/aida/AP1WRLtgAH3sE7hbYBXf4WqJ9pL45KUtHNBCYOqh2xPGV6qk_how2gs93G52xbjb6lc-VqayJOW_5ZSPppdo1UJYGGf1hXBKumLoFfbutQ8tbVsAENtMeVM6Wp2w4FZ8ncrfKJHYy3FL-KV1bm4wq9sqp_8oyxmRdz7I-JFBP5Ayki8aua2yPWL35lY2pJKMwoHdsKEFZ-NcnK8hWOhNgBp6WBURXQWOQNvT0bi5H8J0ls2RBETqB8L210DUg0iG" -OutFile (Join-Path -Path $stitchAssetsDir -ChildPath "waiter-tables-overview-screenshot.png")
Invoke-WebRequest -Uri "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1NDIwOGVlZmVkYjQwNGE0NzUxMGE4MjA1NjFhEgsSBxDakujT0xYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjA4NTgxNDg1NjIxMzIyMzU0OA&filename=&opi=89354086" -OutFile (Join-Path -Path $stitchAssetsDir -ChildPath "waiter-tables-overview.html")

# Waiter Login - Luminous Edition
Invoke-WebRequest -Uri "https://lh3.googleusercontent.com/aida/AP1WRLtqeiwRZnLTnyb3D93H6Y24f6QjP0LrLwMx7gVwor_qZeLzORlBJ_f-eflQ7FhiBXUnF0LNXlpOilK7c3qel2o3VcjAYrWmQa51v-XlROGo6UNGz1n0kiKHrpba6hFEdEEq0NiD-B4fEDGCtC7MsPdLM6JbuWGh03fC-T5kVLV5vbES3CdWcCd5UHXDLrwjunybtP7MR2gRqlV3jDJVsPX_JZmDSnWBMM9RJjEWP1m3J2kPTn3RtFX-cmqc" -OutFile (Join-Path -Path $stitchAssetsDir -ChildPath "waiter-login-luminous-screenshot.png")
Invoke-WebRequest -Uri "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgyNzk5MzM0MDBhNzRlYTZiMjViMjRhNDE0ZGRjNWY1EgsSBxDakujT0xYYAZIBJAoKcHJvamVjdF9pZBIWQhQxNjA4NTgxNDg1NjIxMzIyMzU0OA&filename=&opi=96797242" -OutFile (Join-Path -Path $stitchAssetsDir -ChildPath "waiter-login-luminous.html")

Write-Host "✅ All waiter screens downloaded successfully!"
