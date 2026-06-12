import fitz
import os
import re
from PIL import Image

def get_blocks(doc):
    all_blocks = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        blocks = page.get_text("blocks")
        for b in blocks:
            if b[6] == 0:
                text = b[4].strip()
                if text:
                    all_blocks.append({
                        "page": page_num,
                        "rect": fitz.Rect(b[:4]),
                        "text": text
                    })
    return all_blocks

def main():
    doc = fitz.open('/Users/dmitt/Desktop/QuantGuide_Web/(Important) QuantProf.pdf')
    print("Extracting blocks...")
    blocks = get_blocks(doc)
    
    print("Identifying sections...")
    q_starts = {}
    q_ends = {}
    h_starts = {}
    h_ends = {}
    s_starts = {}
    s_ends = {}
    q_titles = {}
    
    # 1. First Pass: Identify all titles
    raw_text = chr(10).join(b['text'] for b in blocks)
    for match in re.finditer(r'^(\d+)\.\s+(.+?)\n.+?Lvl', raw_text, re.MULTILINE):
        q_id = int(match.group(1))
        title = match.group(2).strip()
        q_titles[q_id] = title.replace(" ", "_").replace("/", "").replace(":", "")

    # 2. Second Pass: Find block indices
    in_hints_section = False
    in_solutions_section = False
    
    for i, b in enumerate(blocks):
        text = b['text']
        
        if "HINTS" in text and "QuantProf Problems" in text:
            in_hints_section = True
            in_solutions_section = False
            continue
            
        if "SOLUTIONS" in text and "QuantProf Problems" in text:
            in_solutions_section = True
            in_hints_section = False
            continue
            
        match = re.match(r'^(\d+)\.\s+(.+)', text)
        if match:
            q_id = int(match.group(1))
            
            if not in_hints_section and not in_solutions_section:
                if q_id not in q_starts:
                    q_starts[q_id] = i
            elif in_hints_section:
                if q_id not in h_starts:
                    h_starts[q_id] = i
            elif in_solutions_section:
                if q_id not in s_starts:
                    s_starts[q_id] = i
            
    # Resolve Ends
    for q_id in q_starts.keys():
        start_idx = q_starts[q_id]
        end_idx = start_idx
        while end_idx < len(blocks):
            if "[ Hint ↓" in blocks[end_idx]['text']:
                q_ends[q_id] = end_idx # Exclude this block
                break
            end_idx += 1
            
    for q_id in h_starts.keys():
        start_idx = h_starts[q_id]
        end_idx = start_idx + 1 # Skip the title block
        # The next block is usually "[ Question ↑ | Solution ↓ | ↑ ]"
        # We need to skip it
        while end_idx < len(blocks):
            if "[ Question ↑" in blocks[end_idx]['text']:
                start_idx = end_idx + 1
                break
            end_idx += 1
            
        # Update start_idx
        h_starts[q_id] = start_idx
        
        end_idx = start_idx
        while end_idx < len(blocks):
            # Check if next question starts or next section starts
            if re.match(r'^(\d+)\.\s+(.+)', blocks[end_idx]['text']) or ("SOLUTIONS" in blocks[end_idx]['text']):
                h_ends[q_id] = end_idx
                break
            end_idx += 1
            
    for q_id in s_starts.keys():
        start_idx = s_starts[q_id]
        end_idx = start_idx + 1
        while end_idx < len(blocks):
            if "[ Question ↑" in blocks[end_idx]['text']:
                start_idx = end_idx + 1
                break
            end_idx += 1
            
        s_starts[q_id] = start_idx
            
        end_idx = start_idx
        while end_idx < len(blocks):
            if "Answer:" in blocks[end_idx]['text']:
                s_ends[q_id] = end_idx + 1
                break
            end_idx += 1

    def render_blocks(start_idx, end_idx, out_path):
        if start_idx >= len(blocks) or start_idx >= end_idx:
            return
            
        pages = {}
        for i in range(start_idx, end_idx):
            b = blocks[i]
            if "SOLUTIONS" in b['text'] or "HINTS" in b['text']:
                if "QuantProf Problems" in b['text']:
                    continue
            if b['text'].startswith("Bibliography"):
                continue
                
            p = b['page']
            if p not in pages:
                pages[p] = []
            pages[p].append(b['rect'])
            
        pixmaps = []
        for p, rects in pages.items():
            if not rects: continue
            x0 = min(r.x0 for r in rects)
            y0 = min(r.y0 for r in rects)
            x1 = max(r.x1 for r in rects)
            y1 = max(r.y1 for r in rects)
            
            # Tighter bottom crop (+2 instead of +10) to avoid capturing the next block's pixels
            rect = fitz.Rect(x0 - 10, y0 - 10, x1 + 10, y1 + 2)
            
            page = doc[p]
            mat = fitz.Matrix(4, 4)
            pix = page.get_pixmap(matrix=mat, clip=rect)
            
            img_path = f"/tmp/temp_render_{p}.png"
            pix.save(img_path)
            pixmaps.append(Image.open(img_path))
            
        if not pixmaps:
            return
            
        total_width = max(img.width for img in pixmaps)
        total_height = sum(img.height for img in pixmaps)
        
        stitched = Image.new('RGB', (total_width, total_height), (255, 255, 255))
        y_offset = 0
        for img in pixmaps:
            stitched.paste(img, (0, y_offset))
            y_offset += img.height
            
        stitched.save(out_path)
        
    print("Rendering images...")
    os.makedirs('public/images/problems', exist_ok=True)
    os.makedirs('public/images/solutions', exist_ok=True)
    os.makedirs('public/images/hints', exist_ok=True)
    
    count = 0
    for q_id, title in q_titles.items():
        if q_id in q_starts and q_id in q_ends:
            render_blocks(q_starts[q_id], q_ends[q_id], f"public/images/problems/{title}.png")
            
        if q_id in h_starts and q_id in h_ends:
            render_blocks(h_starts[q_id], h_ends[q_id], f"public/images/hints/{title}.png")
            
        if q_id in s_starts and q_id in s_ends:
            render_blocks(s_starts[q_id], s_ends[q_id], f"public/images/solutions/{title}.png")
            
        count += 1
        if count % 50 == 0:
            print(f"Rendered {count} problems (Q/H/S)...")
            
    print(f"Done rendering {count} problems!")

if __name__ == "__main__":
    main()
