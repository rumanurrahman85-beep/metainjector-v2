# MetaInjector V2 — 100% Bulletproof SVG Metadata Injector

**AI-Powered (Gemini) + Rule-Based Fallback | SVG Metadata Injection | 100% Valid XML**

Upload any SVG file, get SEO-optimized metadata, and download the SVG with metadata **embedded correctly** inside the file — no XML errors, no broken rendering.

## What Was Fixed (vs Previous Versions)

| Issue | Previous | V2 Fix |
|-------|----------|--------|
| **"Extra content at end of document"** | Metadata inserted incorrectly | Proper XML parsing + insertion after `<svg>` opening tag |
| **Metadata visible as text** | Metadata not wrapped in `<metadata>` tag | Proper Dublin Core `<metadata>` block with namespaces |
| **Broken SVG rendering** | Invalid XML structure | DOMParser validation before download |
| **No error checking** | Silent failures | Full try-catch with user feedback |
| **No preview** | Couldn't see what gets injected | Live XML preview with syntax highlighting |

## Features

- **AI Mode**: Gemini 3.1 Flash-Lite API analyzes your SVG image and generates human-like SEO metadata
- **Rule Mode**: Offline filename analysis + keyword database. No API needed, works forever
- **Auto-Fallback**: If AI fails, instantly switches to Rule Mode automatically
- **Bulletproof Injection**: Metadata inserted correctly after `<svg>` opening tag, validated with DOMParser
- **Platform Optimized**: Shutterstock, Adobe Stock, Freepik, Getty, Dreamstime, Alamy, Vecteezy
- **Editable**: Modify title, description, keywords before downloading
- **Live Preview**: See the exact XML that will be injected

## Get Free Gemini API Key

1. Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)**
2. Sign in with Google
3. Click **"Create API Key"**
4. Copy key (starts with `AIza...`)
5. Paste into website — **No billing, no credit card**

**Free tier**: 30 requests/min, 1,500 requests/day

## File Structure

```
repo/
├── index.html    # UI
├── app.js        # Engine (AI + Rules + Injection + Validation)
└── README.md     # This file
```

## Deploy to GitHub Pages

1. Create new repo on GitHub
2. Upload these 3 files
3. Settings → Pages → Deploy from branch `main`
4. Live at: `https://yourusername.github.io/repo-name/`

## How Injection Works (Bulletproof Method)

```javascript
// Step 1: Remove any existing <metadata> blocks
svgText = svgText.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');

// Step 2: Find <svg> opening tag (handles namespaces, attributes)
const match = svgText.match(/(<svg[^>]*?>)/i);
const insertPos = match.index + match[0].length;

// Step 3: Insert metadata after <svg> opening tag
newSvg = before + '
' + metadataBlock + '
' + after;

// Step 4: Validate with DOMParser before download
const doc = new DOMParser().parseFromString(newSvg, 'image/svg+xml');
if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
```

## Metadata Format (Injected Inside SVG)

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- SVG Metadata by MetaInjector V2 -->
  <!-- Compatible with: Adobe Stock, Shutterstock, Freepik... -->
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:RDF>
      <rdf:Description rdf:about="">
        <dc:title>Your SEO Title</dc:title>
        <dc:description>Your description...</dc:description>
        <dc:subject>
          <rdf:Bag>
            <rdf:li>keyword1</rdf:li>
            <rdf:li>keyword2</rdf:li>
          </rdf:Bag>
        </dc:subject>
        <dc:creator>Stock Contributor</dc:creator>
        <dc:rights>Copyright (c) 2026. All rights reserved.</dc:rights>
        <dc:date>2026-06-29</dc:date>
        <dc:format>image/svg+xml</dc:format>
        <dc:type>Still Image</dc:type>
      </rdf:Description>
    </rdf:RDF>
  </metadata>
  <!-- rest of SVG content -->
</svg>
```

## Pro Tips

1. **Name files descriptively**: `floral-watercolor-wedding-invitation.svg` → much better metadata
2. **Use AI Mode for best results** — it actually analyzes the image content
3. **Rule Mode is your safety net** — works forever, no dependencies
4. **Edit before download** — you can modify any field before saving
5. **Check the preview** — see exactly what XML will be injected

## License

MIT — Free for personal and commercial use.
