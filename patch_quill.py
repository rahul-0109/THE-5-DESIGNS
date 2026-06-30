import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add CSS
if 'quill.snow.css' not in content:
    content = content.replace(
        '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">',
        '<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@100;200;300;400;500;600;700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">\n    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">'
    )

# 2. Add JS
if 'quill.js' not in content:
    content = content.replace(
        '</body>',
        '    <script src="https://cdn.quilljs.com/1.3.6/quill.js"></script>\n</body>'
    )

# 3. Replace textarea
content = content.replace(
    '<textarea id="diary-content" placeholder="Narrative / Content" class="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-black h-32"></textarea>',
    '''<div class="w-full mb-4">
                                <div id="editor-toolbar" class="border border-gray-200 rounded-t-lg bg-gray-50">
                                    <span class="ql-formats">
                                        <select class="ql-font">
                                            <option selected></option>
                                            <option value="serif"></option>
                                            <option value="monospace"></option>
                                        </select>
                                        <select class="ql-header">
                                            <option value="1"></option>
                                            <option value="2"></option>
                                            <option value="3"></option>
                                            <option selected></option>
                                        </select>
                                    </span>
                                    <span class="ql-formats">
                                        <button class="ql-bold"></button>
                                        <button class="ql-italic"></button>
                                        <button class="ql-underline"></button>
                                    </span>
                                    <span class="ql-formats">
                                        <select class="ql-color"></select>
                                        <select class="ql-background"></select>
                                    </span>
                                    <span class="ql-formats">
                                        <button class="ql-list" value="ordered"></button>
                                        <button class="ql-list" value="bullet"></button>
                                        <select class="ql-align"></select>
                                    </span>
                                    <span class="ql-formats">
                                        <button class="ql-link"></button>
                                        <button class="ql-image"></button>
                                    </span>
                                </div>
                                <div id="diary-content-editor" style="height: 350px;" class="border border-t-0 border-gray-200 rounded-b-lg bg-white"></div>
                            </div>'''
)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
