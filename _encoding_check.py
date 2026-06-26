#!/usr/bin/env python
"""Check all source files for character encoding issues."""
import os
import re
import glob

# All files we want to check
extensions = {'.js', '.vue', '.css', '.html', '.json', '.md', '.bat'}
files_to_check = []

for root, dirs, files in os.walk(r'D:/05 File/SQL Practice'):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '__pycache__')]
    for f in files:
        ext = os.path.splitext(f)[1].lower()
        if ext in extensions:
            files_to_check.append(os.path.join(root, f))

files_to_check.sort()

print("=" * 80)
print("CHARACTER ENCODING ANALYSIS REPORT")
print("=" * 80)

ok_count = 0
issue_count = 0

for filepath in files_to_check:
    relpath = os.path.relpath(filepath, r'D:/05 File/SQL Practice')
    
    with open(filepath, 'rb') as fh:
        raw = fh.read()
    
    file_issues = []
    
    # 1. Check for BOM markers
    if raw[:3] == b'\xef\xbb\xbf':
        file_issues.append("BOM: UTF-8 BOM (EF BB BF) detected")
    elif raw[:2] == b'\xff\xfe':
        file_issues.append("BOM: UTF-16 LE BOM (FF FE) detected")
    elif raw[:2] == b'\xfe\xff':
        file_issues.append("BOM: UTF-16 BE BOM (FE FF) detected")
    
    # 2. Check for null bytes (UTF-16 / binary)
    if b'\x00' in raw:
        # Only flag if it's not just a trailing null
        null_positions = [i for i, b in enumerate(raw) if b == 0]
        if len(null_positions) > 2:  # More than a couple of nulls = likely binary
            file_issues.append(f"Multiple null bytes found ({len(null_positions)} positions) - file may be UTF-16 or binary")
    
    # 3. Try to decode as UTF-8
    try:
        text = raw.decode('utf-8')
    except UnicodeDecodeError as e:
        # Try GBK (common Chinese encoding on Windows)
        try:
            text_gbk = raw.decode('gbk')
            file_issues.append(f"NOT UTF-8: Decoded as GBK instead. UTF-8 error: {e}")
            text = text_gbk  # Use for further analysis
        except:
            try:
                text_latin = raw.decode('latin-1')
                file_issues.append(f"NOT UTF-8: Decoded as Latin-1 instead. UTF-8 error: {e}")
                text = text_latin
            except:
                file_issues.append(f"NOT UTF-8: Cannot decode at all: {e}")
                continue
    
    # 4. Check for control characters (excluding normal whitespace)
    control_lines = []
    for i, ch in enumerate(text):
        cp = ord(ch)
        if cp < 0x20 and cp not in (0x09, 0x0A, 0x0D):
            line_num = text[:i].count('\n') + 1
            control_lines.append(f"U+{cp:04X} at line {line_num}")
            if len(control_lines) >= 5:
                break
    if control_lines:
        file_issues.append(f"Control characters (non-whitespace): {', '.join(control_lines)}")
    
    # 5. Check for non-BMP characters (emoji, rare CJK, etc.)
    non_bmp_chars = []
    for i, ch in enumerate(text):
        cp = ord(ch)
        if cp > 0xFFFF:
            line_num = text[:i].count('\n') + 1
            non_bmp_chars.append(f"U+{cp:08X} at line {line_num}")
            if len(non_bmp_chars) >= 5:
                break
    if non_bmp_chars:
        file_issues.append(f"Non-BMP characters (emoji/special): {', '.join(non_bmp_chars)}")
    
    # 6. Check for common mojibake patterns:
    #    Sequences like Ã© (é encoded as UTF-8 then read as Latin-1)
    #    Or å·² (Chinese GBK bytes read as Latin-1 then written as UTF-8)
    mojibake_lines = []
    for linenum, line in enumerate(text.split('\n'), 1):
        # Pattern 1: High Latin-1 chars that often indicate UTF-8 interpreted as Latin-1
        # À-ÿ (0xC0-0xFF) are common mojibake indicators when they appear in Chinese text context
        high_latin_count = sum(1 for ch in line if '\xc0' <= ch <= '\xff')
        
        # Pattern 2: Check for sequences like "æ\x99\x82" (UTF-8 bytes re-interpreted)
        # This looks for sequences of 2-3 consecutive high bytes
        consecutive_high = 0
        for ch in line:
            if ord(ch) >= 0x80:
                consecutive_high += 1
            else:
                if consecutive_high >= 4:
                    mojibake_lines.append(linenum)
                    break
                consecutive_high = 0
    
    if mojibake_lines:
        file_issues.append(f"Possible mojibake (garbled CJK): lines {mojibake_lines[:8]}")
    
    # 7. For JSON files: validate UTF-8 compliance specifically
    if filepath.endswith('.json'):
        try:
            import json
            json.loads(text)
        except json.JSONDecodeError as e:
            if not any("NOT UTF-8" in i for i in file_issues):
                file_issues.append(f"JSON parse warning: {e}")
    
    # Report
    if file_issues:
        issue_count += 1
        print(f"\n⚠ {relpath}")
        for issue in file_issues:
            print(f"    • {issue}")
        # Show a small preview of suspicious lines
        if mojibake_lines:
            for ln in mojibake_lines[:3]:
                if ln <= len(text.split('\n')):
                    line_text = text.split('\n')[ln-1][:120]
                    print(f"    > Line {ln}: {repr(line_text[:120])}")
    else:
        ok_count += 1

print("\n" + "=" * 80)
print(f"RESULT: {ok_count} clean files, {issue_count} files with potential issues (out of {len(files_to_check)} total)")
print("=" * 80)
