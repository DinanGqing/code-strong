import os, glob

# Fix white text colors in .jsx files (text, not bg/border/fieldset)
fixes = {
    "color: '#fff'": "color: '#1a1a2e'",
    "rgba(255,255,255,0.85)": "rgba(26,26,46,0.9)",
    "rgba(255,255,255,0.8)": "rgba(26,26,46,0.85)",
    "rgba(255,255,255,0.7)": "rgba(26,26,46,0.75)",
    "rgba(255,255,255,0.6)": "rgba(26,26,46,0.65)",
    "rgba(255,255,255,0.5)": "rgba(26,26,46,0.55)",
    "rgba(255,255,255,0.45)": "rgba(26,26,46,0.5)",
    "rgba(255,255,255,0.4)": "rgba(26,26,46,0.45)",
    "rgba(255,255,255,0.35)": "rgba(26,26,46,0.4)",
    "rgba(255,255,255,0.3)": "rgba(26,26,46,0.35)",
    "rgba(255,255,255,0.25)": "rgba(26,26,46,0.3)",
    "rgba(255,255,255,0.2)": "rgba(26,26,46,0.25)",
}

app_files = glob.glob('src/app/**/*.jsx', recursive=True)
shared_files = glob.glob('src/shared/components/*.jsx')
all_files = app_files + shared_files

for fp in all_files:
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for old, new in fixes.items():
        content = content.replace(old, new)
    
    if content != original:
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed: ' + fp)

print('Done')
