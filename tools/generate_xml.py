import os
import xml.etree.ElementTree as ET

def read_f(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read()

css_files = [
    'css/global.css',
    'css/header.css',
    'css/carousel.css',
    'css/blog.css',
    'css/footer.css',
    'css/share-modal.css',
    'post/post.css'
]
combined_css = "\n\n".join(read_f(p) for p in css_files).replace(']]>', ']]&gt;')

js_files = [
    'js/global.js',
    'js/toast.js',
    'js/cookie-auth.js',
    'js/header.js',
    'js/carousel.js',
    'js/share-modal.js',
    'js/blog.js',
    'post/post.js'
]
combined_js = "\n\n".join(read_f(p) for p in js_files).replace(']]>', ']]\\>')

with open('tools/template_head.xml', 'r', encoding='utf-8') as f:
    head_part = f.read()

with open('tools/template_body.xml', 'r', encoding='utf-8') as f:
    body_part = f.read()

final_xml = head_part.replace('/*{{COMBINED_CSS}}*/', combined_css).replace('/*{{COMBINED_JS}}*/', combined_js).replace('{{BODY_CONTENT}}', body_part)

with open('theme.xml', 'w', encoding='utf-8') as f:
    f.write(final_xml)

print("Verifying XML well-formedness...")
try:
    ET.parse('theme.xml')
    print("SUCCESS: theme.xml is 100% valid XML!")
except Exception as e:
    print(f"XML Validation Error: {e}")
    exit(1)
