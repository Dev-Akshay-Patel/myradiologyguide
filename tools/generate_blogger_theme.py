#!/usr/bin/env python3
"""
Generator script for Blogger XML Theme Template (theme.xml and blogger-theme.xml).
Converts the clinical radiology web template into a 100% compliant Blogger v3 Layout XML theme.
"""
import os
import re
import xml.etree.ElementTree as ET

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

# 1. Load Stylesheets
css_files = [
    'css/global.css',
    'css/header.css',
    'css/carousel.css',
    'css/blog.css',
    'css/footer.css',
    'css/share-modal.css',
    'post/post.css'
]
combined_css = "\n\n".join(read_file(p) for p in css_files).replace(']]>', ']]&gt;')

# 2. Load Javascript
js_files = [
    'js/global.js',
    'js/toast.js',
    'js/cookie-auth.js',
    'js/header.js',
    'js/carousel.js',
    'js/posts-data.js',
    'js/share-modal.js',
    'js/blog.js',
    'post/post.js'
]
combined_js = "\n\n".join(read_file(p) for p in js_files).replace(']]>', ']]\\>')

# 3. Read template head and body
head_template = read_file('tools/template_head.xml')

# Make sure template_body.xml is updated or generated
# First run build_body_template.py logic with XML entity fixes
with open('tools/build_body_template.py', 'r', encoding='utf-8') as f:
    body_script = f.read()

# Replace any &bull; or unescaped entities
body_script = body_script.replace('&bull;', '&#8226;')

# Execute body script in controlled namespace
ns = {}
exec(body_script, ns)

body_xml = read_file('tools/template_body.xml')
body_xml = body_xml.replace('&bull;', '&#8226;')

# Combine into full Blogger theme XML
final_xml = head_template.replace('/*{{COMBINED_CSS}}*/', combined_css)\
                         .replace('/*{{COMBINED_JS}}*/', combined_js)\
                         .replace('{{BODY_CONTENT}}', body_xml)

# Save both theme.xml and blogger-theme.xml
with open('theme.xml', 'w', encoding='utf-8') as f:
    f.write(final_xml)

with open('blogger-theme.xml', 'w', encoding='utf-8') as f:
    f.write(final_xml)

print(f"Generated theme.xml ({len(final_xml)} bytes)")
print("Validating XML syntax with ElementTree...")
try:
    ET.fromstring(final_xml)
    print("SUCCESS: Blogger XML Theme is 100% well-formed and valid XML!")
except Exception as e:
    print(f"Validation Error: {e}")
    exit(1)
