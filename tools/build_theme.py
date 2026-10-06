import os
import xml.etree.ElementTree as ET

def read_f(p):
    with open(p, 'r', encoding='utf-8') as f:
        return f.read()

# Load all stylesheet files
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

# Load all JS files
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

print(f"Loaded CSS: {len(combined_css)} chars, JS: {len(combined_js)} chars")
