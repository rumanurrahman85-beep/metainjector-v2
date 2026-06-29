// ============================================
// METAINJECTOR V2 — 100% Bulletproof SVG Metadata Injector
// Fixes: Proper SVG XML parsing, metadata injection, validation
// Supports: AI (Gemini) + Rule-based fallback
// ============================================

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

const PLATFORM_RULES = {
    shutterstock: { maxTitle: 200, maxDesc: 200, maxKeywords: 50 },
    adobe: { maxTitle: 70, maxDesc: 200, maxKeywords: 50 },
    freepik: { maxTitle: 100, maxDesc: 300, maxKeywords: 40 },
    getty: { maxTitle: 80, maxDesc: 250, maxKeywords: 80 },
    dreamstime: { maxTitle: 200, maxDesc: 200, maxKeywords: 50 },
    alamy: { maxTitle: 150, maxDesc: 200, maxKeywords: 50 },
    vecteezy: { maxTitle: 100, maxDesc: 250, maxKeywords: 30 },
    generic: { maxTitle: 200, maxDesc: 300, maxKeywords: 50 }
};

const KEYWORD_DB = {
    vector: {
        core: ['vector','illustration','graphic design','digital art','clipart','editable','scalable','svg'],
        styles: ['flat design','minimalist','clean','modern','simple','elegant','stylish','trendy'],
        technical: ['eps','ai','svg','vector file','layered','isolated','transparent background','high resolution'],
        uses: ['print','web design','marketing','advertising','branding','presentation','social media']
    },
    icon: {
        core: ['icon','symbol','sign','pictogram','glyph','ui element','interface','svg icon'],
        styles: ['minimalist','flat','line art','outline','filled','solid','monochrome','colorful'],
        technical: ['pixel perfect','scalable','responsive','retina ready','vector icon'],
        uses: ['app','website','dashboard','mobile','software','user interface','navigation']
    },
    logo: {
        core: ['logo','logotype','brand identity','branding','corporate','business','company','svg logo'],
        styles: ['professional','minimalist','modern','luxury','premium','elegant','creative'],
        technical: ['vector','scalable','editable','customizable','print ready','web ready'],
        uses: ['startup','enterprise','small business','freelance','agency','portfolio']
    },
    pattern: {
        core: ['seamless pattern','repeatable','tileable','background','wallpaper','texture','surface pattern'],
        styles: ['decorative','ornamental','stylish','modern','classic','elegant','trendy'],
        technical: ['seamless','repeating','high resolution','print ready','digital paper'],
        uses: ['fabric','textile','wrapping paper','scrapbooking','interior design','fashion']
    },
    infographic: {
        core: ['infographic','chart','diagram','data visualization','information graphic','stats'],
        styles: ['modern','clean','professional','corporate','creative','engaging'],
        technical: ['editable','customizable','vector','data driven','presentation ready'],
        uses: ['business','education','marketing','report','presentation','social media']
    },
    social: {
        core: ['social media','template','post','story','banner','cover','header','feed'],
        styles: ['trendy','engaging','viral','aesthetic','modern','stylish','eye catching'],
        technical: ['optimized','ready to use','customizable','editable','layered'],
        uses: ['instagram','facebook','twitter','linkedin','pinterest','tiktok','youtube']
    },
    floral: {
        core: ['floral','flower','botanical','nature','plant','garden','bloom','blossom'],
        styles: ['elegant','romantic','vintage','modern','tropical','wild','delicate'],
        technical: ['detailed','high resolution','isolated','transparent','vector','watercolor'],
        uses: ['wedding','spring','summer','decor','fashion','beauty','organic product']
    },
    geometric: {
        core: ['geometric','abstract','shape','pattern','polygon','minimal','modern art'],
        styles: ['minimalist','contemporary','futuristic','clean','bold','symmetrical','asymmetrical'],
        technical: ['vector','precise','mathematical','grid','golden ratio','scalable'],
        uses: ['background','wallpaper','branding','tech','science','architecture','design']
    },
    business: {
        core: ['business','corporate','professional','office','workplace','career','success'],
        styles: ['modern','clean','minimalist','luxury','trustworthy','confident'],
        technical: ['high resolution','professional','studio','sharp','clean background'],
        uses: ['presentation','website','brochure','annual report','linkedin','marketing']
    },
    holiday: {
        core: ['holiday','seasonal','celebration','festival','christmas','halloween','easter','valentine'],
        styles: ['festive','cheerful','colorful','sparkling','cozy','traditional','modern'],
        technical: ['high resolution','decorated','ornamented','detailed','vibrant colors'],
        uses: ['greeting card','invitation','social media','marketing','decoration','gift wrap']
    },
    watercolor: {
        core: ['watercolor','hand painted','hand drawn','artistic','painting','illustration','fine art'],
        styles: ['organic','natural','soft','delicate','expressive','whimsical','romantic'],
        technical: ['high resolution','scanned','original art','texture','paper texture'],
        uses: ['wedding','invitation','greeting card','scrapbooking','wall art','stationery']
    },
    mockup: {
        core: ['mockup','template','presentation','showcase','display','scene','realistic'],
        styles: ['professional','photorealistic','clean','minimalist','modern','stylish'],
        technical: ['smart object','editable','customizable','high resolution','layered'],
        uses: ['branding','packaging','apparel','device','stationery','product design']
    }
};

// State
let currentMode = 'ai';
let currentPlatform = 'shutterstock';
let currentFile = null;
let currentSvgText = null;
let currentMetadata = null;
let apiKey = localStorage.getItem('gemini_api_key') || '';

// DOM refs
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileCard = document.getElementById('fileCard');
const editorPanel = document.getElementById('editorPanel');
const resultsPanel = document.getElementById('resultsPanel');
const apiKeyInput = document.getElementById('apiKey');
const apiBox = document.getElementById('apiBox');
const ruleBox = document.getElementById('ruleBox');
const titleInput = document.getElementById('titleInput');
const descInput = document.getElementById('descInput');
const keywordsInput = document.getElementById('keywordsInput');
const titleCount = document.getElementById('titleCount');
const descCount = document.getElementById('descCount');
const keywordCount = document.getElementById('keywordCount');
const metaPreview = document.getElementById('metaPreview');
const categorySelect = document.getElementById('categorySelect');

// Init
if (apiKey) apiKeyInput.value = apiKey;
apiKeyInput.addEventListener('input', (e) => {
    apiKey = e.target.value.trim();
    localStorage.setItem('gemini_api_key', apiKey);
});

// Mode toggle
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        if (currentMode === 'ai') { apiBox.classList.remove('hidden'); ruleBox.classList.add('hidden'); }
        else { apiBox.classList.add('hidden'); ruleBox.classList.remove('hidden'); }
    });
});

// Platform chips
document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentPlatform = chip.dataset.platform;
        if (currentFile) regenerateMetadata();
    });
});

// Drop zone
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });

// Character counters
function updateCounts() {
    const rules = PLATFORM_RULES[currentPlatform] || PLATFORM_RULES.generic;
    const tLen = titleInput.value.length;
    const dLen = descInput.value.length;
    const kCount = keywordsInput.value.split(',').filter(k => k.trim()).length;

    titleCount.textContent = `${tLen}/${rules.maxTitle}`;
    titleCount.className = 'char-count' + (tLen > rules.maxTitle ? ' danger' : tLen > rules.maxTitle * 0.9 ? ' warn' : '');

    descCount.textContent = `${dLen}/${rules.maxDesc}`;
    descCount.className = 'char-count' + (dLen > rules.maxDesc ? ' danger' : dLen > rules.maxDesc * 0.9 ? ' warn' : '');

    keywordCount.textContent = `${kCount}/${rules.maxKeywords}`;
    keywordCount.className = 'char-count' + (kCount > rules.maxKeywords ? ' danger' : kCount > rules.maxKeywords * 0.9 ? ' warn' : '');
}

titleInput.addEventListener('input', () => { updateCounts(); updatePreview(); });
descInput.addEventListener('input', () => { updateCounts(); updatePreview(); });
keywordsInput.addEventListener('input', () => { updateCounts(); updatePreview(); });

categorySelect.addEventListener('change', () => {
    if (currentFile) regenerateMetadata();
});

async function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.svg')) {
        showToast('Please upload an SVG file only', 'err');
        return;
    }

    currentFile = file;
    currentSvgText = await file.text();

    // Validate it's actually SVG
    if (!currentSvgText.trim().toLowerCase().includes('<svg')) {
        showToast('Invalid SVG file', 'err');
        return;
    }

    // Show file card
    fileCard.innerHTML = `
        <div class="thumb">${currentSvgText}</div>
        <div class="info">
            <div class="name">${file.name}</div>
            <div class="meta">${(file.size / 1024).toFixed(1)} KB &bull; SVG</div>
        </div>
        <div class="status status-wait" id="fileStatus">Processing...</div>
    `;
    fileCard.classList.remove('hidden');

    editorPanel.classList.remove('hidden');

    await generateMetadata();
}

async function generateMetadata() {
    const statusEl = document.getElementById('fileStatus');
    statusEl.textContent = 'Processing...';
    statusEl.className = 'status status-wait';

    try {
        let meta;

        if (currentMode === 'ai' && apiKey) {
            try {
                meta = await generateWithAI();
                statusEl.textContent = 'AI';
                statusEl.className = 'status status-ok';
                showToast('Metadata generated with AI', 'ok');
            } catch (err) {
                console.log('AI failed, falling back:', err);
                meta = generateWithRules();
                statusEl.textContent = 'Rule';
                statusEl.className = 'status status-ok';
                showToast('AI failed, used Rule Mode', 'warn');
            }
        } else {
            meta = generateWithRules();
            statusEl.textContent = 'Rule';
            statusEl.className = 'status status-ok';
            showToast('Metadata generated with rules', 'ok');
        }

        currentMetadata = meta;

        // Populate inputs
        titleInput.value = meta.title;
        descInput.value = meta.description;
        keywordsInput.value = meta.keywords.join(', ');
        categorySelect.value = meta.category;

        updateCounts();
        updatePreview();

    } catch (e) {
        statusEl.textContent = 'Error';
        statusEl.className = 'status status-err';
        showToast('Failed: ' + e.message, 'err');
    }
}

function regenerateMetadata() {
    generateMetadata();
}

document.getElementById('regenBtn').addEventListener('click', regenerateMetadata);

// ============================================
// AI GENERATION
// ============================================
async function generateWithAI() {
    if (!apiKey) throw new Error('No API key');

    const base64 = await fileToBase64(currentFile);
    const rules = PLATFORM_RULES[currentPlatform] || PLATFORM_RULES.generic;

    const prompt = `You are an expert SEO metadata writer for stock photography/vector contributor platforms.

Analyze this SVG image and generate SEO-optimized metadata. The metadata must be:
- 100% original (describing only what is in THIS image)
- Human-like, natural language
- Optimized for stock platform search algorithms
- No trademarked names, no copyrighted characters, no brand names

Respond ONLY in this exact JSON format (no markdown, no explanation, just raw JSON):
{"title":"SEO title under ${rules.maxTitle} chars","description":"Compelling description under ${rules.maxDesc} chars","keywords":["keyword1","keyword2",...up to ${rules.maxKeywords}]}

Rules:
- Title: catchy, includes main subject + style + use case
- Description: 2-3 sentences about what it is, style, colors, uses
- Keywords: array of single words or short phrases, most important first`;

    const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: 'image/svg+xml', data: base64.split(',')[1] } }
                ]
            }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON
    let parsed;
    try {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No JSON found');
        parsed = JSON.parse(match[0]);
    } catch {
        throw new Error('Invalid AI response');
    }

    return {
        title: parsed.title || '',
        description: parsed.description || '',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        category: detectCategory(currentFile.name),
        source: 'AI'
    };
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================
// RULE-BASED GENERATION
// ============================================
function generateWithRules() {
    const category = categorySelect.value === 'auto' ? detectCategory(currentFile.name) : categorySelect.value;
    const db = KEYWORD_DB[category] || KEYWORD_DB.vector;
    const rules = PLATFORM_RULES[currentPlatform] || PLATFORM_RULES.generic;
    const parsed = parseFilename(currentFile.name);

    // Title
    let title = parsed.baseWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    if (!title) title = category.charAt(0).toUpperCase() + category.slice(1) + ' Design';
    if (!title.toLowerCase().includes('vector')) title += ' Vector';
    if (!title.toLowerCase().includes('svg')) title += ' SVG';
    if (!title.toLowerCase().includes('illustration')) title += ' Illustration';
    title = title.length > rules.maxTitle ? title.substring(0, rules.maxTitle - 3) + '...' : title;

    // Description
    let desc = `Professional ${category} vector design in SVG format. High-quality scalable illustration perfect for ${db.uses.slice(0, 3).join(', ')}, and more. Fully editable and customizable. Compatible with Adobe Illustrator, Inkscape, Figma, and all vector editors. Ready for stock contributor platforms.`;
    desc = desc.length > rules.maxDesc ? desc.substring(0, rules.maxDesc - 3) + '...' : desc;

    // Keywords
    let keywords = new Set();
    parsed.baseWords.forEach(w => keywords.add(w));
    db.core.forEach(k => keywords.add(k));
    db.styles.slice(0, 5).forEach(k => keywords.add(k));
    db.technical.slice(0, 4).forEach(k => keywords.add(k));
    db.uses.slice(0, 4).forEach(k => keywords.add(k));
    keywords.add('svg');
    keywords.add('vector');
    keywords.add('stock');
    keywords.add('royalty free');

    let result = Array.from(keywords)
        .map(k => k.replace(/[^a-z0-9\s]/g, '').trim())
        .filter(k => k.length > 2 && k.length < 30)
        .filter((v, i, a) => a.indexOf(v) === i);

    const filenameWords = parsed.baseWords;
    result.sort((a, b) => {
        const aInFile = filenameWords.includes(a) ? 2 : 0;
        const bInFile = filenameWords.includes(b) ? 2 : 0;
        return bInFile - aInFile;
    });

    return {
        title,
        description: desc,
        keywords: result.slice(0, rules.maxKeywords),
        category,
        source: 'Rule'
    };
}

function detectCategory(filename) {
    const lower = filename.toLowerCase().replace(/\.svg$/i, '');
    const keywords = {
        icon: ['icon','icons','ui','glyph','pictogram'],
        logo: ['logo','logotype','brand','badge','emblem'],
        pattern: ['pattern','seamless','tile','wallpaper'],
        infographic: ['infographic','chart','graph','diagram'],
        social: ['social','instagram','post','banner','story'],
        floral: ['floral','flower','botanical','bloom'],
        geometric: ['geometric','polygon','abstract','shape'],
        business: ['business','corporate','office','meeting'],
        holiday: ['christmas','halloween','easter','valentine','holiday'],
        watercolor: ['watercolor','watercolour','aquarelle'],
        mockup: ['mockup','mock','template','scene'],
        vector: ['vector','illustration','clipart']
    };
    for (const [cat, words] of Object.entries(keywords)) {
        if (words.some(w => lower.includes(w))) return cat;
    }
    return 'vector';
}

function parseFilename(filename) {
    const name = filename.replace(/\.[^/.]+$/, '');
    const parts = name.split(/[-_\s]+/).filter(w => w.length > 2);
    return { baseWords: parts.map(w => w.toLowerCase()), cleanName: name };
}

// ============================================
// BULLETPROOF SVG METADATA INJECTION
// ============================================
function buildMetadataBlock(meta) {
    const date = new Date().toISOString().split('T')[0];
    const keywordsXml = meta.keywords.map(k => `        <rdf:li>${escapeXml(k)}</rdf:li>`).join('\n');

    return `<!-- SVG Metadata by MetaInjector V2 -->
<!-- Compatible with: Adobe Stock, Shutterstock, Freepik, Getty, Dreamstime, Alamy, Vecteezy -->
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:RDF>
    <rdf:Description rdf:about="">
      <dc:title>${escapeXml(meta.title)}</dc:title>
      <dc:description>${escapeXml(meta.description)}</dc:description>
      <dc:subject>
        <rdf:Bag>
${keywordsXml}
        </rdf:Bag>
      </dc:subject>
      <dc:creator>Stock Contributor</dc:creator>
      <dc:rights>Copyright (c) ${new Date().getFullYear()}. All rights reserved.</dc:rights>
      <dc:date>${date}</dc:date>
      <dc:format>image/svg+xml</dc:format>
      <dc:type>Still Image</dc:type>
    </rdf:Description>
  </rdf:RDF>
</metadata>`;
}

function escapeXml(str) {
    return String(str).replace(/&/g, '&amp;')
                      .replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;')
                      .replace(/"/g, '&quot;')
                      .replace(/'/g, '&apos;');
}

/**
 * BULLETPROOF SVG INJECTION
 * 1. Finds the <svg> opening tag (handles namespaces, attributes, self-closing)
 * 2. Removes any existing <metadata> blocks
 * 3. Inserts new metadata immediately after <svg> opening tag
 * 4. Validates the result is parseable XML
 */
function injectMetadata(svgText, meta) {
    // Step 1: Remove existing metadata blocks (handles nested content)
    svgText = svgText.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');

    // Step 2: Find the SVG opening tag end position
    // Pattern: <svg followed by attributes, ending with >
    // Must handle: <svg>, <svg xmlns="...">, <svg xmlns="..." viewBox="...">
    const svgOpenRegex = /(<svg\b[^>]*?>)/i;
    const match = svgText.match(svgOpenRegex);

    if (!match) {
        throw new Error('Could not find valid <svg> opening tag');
    }

    const svgTag = match[0];
    const insertPos = match.index + svgTag.length;

    // Step 3: Build metadata block
    const metaBlock = buildMetadataBlock(meta);

    // Step 4: Insert metadata after SVG opening tag
    // Add newline for clean formatting
    const before = svgText.substring(0, insertPos);
    const after = svgText.substring(insertPos);

    let newSvg = before + '\n' + metaBlock + '\n' + after;

    // Step 5: Validate the result is parseable XML
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(newSvg, 'image/svg+xml');
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('XML validation failed: ' + parseError.textContent.substring(0, 100));
        }
        // Verify metadata is present
        const metadata = doc.querySelector('metadata');
        if (!metadata) {
            throw new Error('Metadata injection verification failed');
        }
    } catch (e) {
        throw new Error('SVG validation failed: ' + e.message);
    }

    return newSvg;
}

function updatePreview() {
    if (!currentMetadata) return;

    // Update metadata from current inputs
    const meta = {
        title: titleInput.value,
        description: descInput.value,
        keywords: keywordsInput.value.split(',').map(k => k.trim()).filter(k => k),
        category: categorySelect.value
    };

    const block = buildMetadataBlock(meta);
    metaPreview.innerHTML = escapeHtml(block)
        .replace(/&lt;(\/?)(dc:\w+|rdf:\w+|metadata)&gt;/g, '<span class="tag">&lt;$1$2&gt;</span>')
        .replace(/&lt;!--[\s\S]*?--&gt;/g, '<span class="comment">$&</span>');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// DOWNLOAD
// ============================================
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!currentSvgText || !currentMetadata) {
        showToast('No file to download', 'err');
        return;
    }

    // Get current values from inputs (user may have edited)
    const meta = {
        title: titleInput.value,
        description: descInput.value,
        keywords: keywordsInput.value.split(',').map(k => k.trim()).filter(k => k),
        category: categorySelect.value
    };

    try {
        // Inject metadata
        const newSvg = injectMetadata(currentSvgText, meta);

        // Download
        const blob = new Blob([newSvg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile.name.replace('.svg', '_meta.svg');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Downloaded with metadata!', 'ok');

        // Show result
        resultsPanel.classList.remove('hidden');
        document.getElementById('results').innerHTML = `
            <div class="result-item">
                <h4>&#9989; ${currentFile.name.replace('.svg', '_meta.svg')}</h4>
                <div class="result-field"><label>Title</label><div class="value">${escapeHtml(meta.title)}</div></div>
                <div class="result-field"><label>Description</label><div class="value">${escapeHtml(meta.description)}</div></div>
                <div class="result-field"><label>Keywords (${meta.keywords.length})</label><div class="value">${meta.keywords.map(k => `<span class="keyword-tag">${escapeHtml(k)}</span>`).join('')}</div></div>
                <div class="result-field"><label>Validation</label><div class="value" style="color:#22c55e;">&#10003; SVG XML validated successfully — metadata injected correctly</div></div>
            </div>
        `;

    } catch (e) {
        showToast('Injection failed: ' + e.message, 'err');
        console.error(e);
    }
});

function showToast(msg, type = 'ok') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast' + (type === 'err' ? ' toast-err' : type === 'warn' ? ' toast-warn' : ' toast-ok') + ' show';
    setTimeout(() => toast.classList.remove('show'), 3000);
}
