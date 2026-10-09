import urllib.request
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script src="([^"]+)"', html)
css_links = re.findall(r'<link rel="stylesheet" href="([^"]+)"', html)

print("Verifying CSS assets:")
for c in css_links:
    res = urllib.request.urlopen(f"http://localhost:8080/{c}")
    data = res.read()
    print(f"  {c}: Status {res.status}, Size {len(data)} bytes")
    assert res.status == 200

print("Verifying Script assets:")
for s in scripts:
    res = urllib.request.urlopen(f"http://localhost:8080/{s}")
    data = res.read()
    print(f"  {s}: Status {res.status}, Size {len(data)} bytes")
    assert res.status == 200

print("ALL CSS and JavaScript assets loaded with 200 OK without a single missing file!")
