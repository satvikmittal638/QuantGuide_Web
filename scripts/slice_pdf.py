import fitz
import sqlite3
import os
from PIL import Image

def get_blocks(doc):
    all_blocks = []
    for page_num in range(len(doc)):
        page = doc[page_num]
        blocks = page.get_text("blocks")
        for b in blocks:
            # b = (x0, y0, x1, y1, "text", block_no, block_type)
            if b[6] == 0: # text block
                text = b[4].strip()
                if text:
                    all_blocks.append({
                        "page": page_num,
                        "rect": fitz.Rect(b[:4]),
                        "text": text
                    })
    return all_blocks

def main():
    doc = fitz.open('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf')
    print("Extracting blocks...")
    blocks = get_blocks(doc)
    
    # We want to identify the start index of each Question and each Solution
    print("Identifying sections...")
    import re
    q_starts = {}
    s_starts = {}
    q_titles = {}
    
    # We will also use regex on the raw text to find titles safely
    raw_text = chr(10).join(b['text'] for b in blocks)
    for match in re.finditer(r'Question (\d+):\s*(.*?)\nTopic:', raw_text):
        q_titles[int(match.group(1))] = match.group(2).strip().replace(" ", "_").replace("/", "").replace(":", "")
        
    for i, b in enumerate(blocks):
        text = b['text']
        if text.startswith("Question ") and ":" in text:
            try:
                num = int(text.split("Question ")[1].split(":")[0])
                q_starts[num] = i
            except:
                pass
        elif text.startswith("Solution to Question "):
            try:
                num = int(text.split("Solution to Question ")[1].split(":")[0])
                s_starts[num] = i
            except:
                pass
                
    # Function to render a sequence of blocks as an image
    def render_blocks(start_idx, end_idx, out_path, is_solution=False):
        if start_idx >= len(blocks) or start_idx >= end_idx:
            return
            
        # Group blocks by page
        pages = {}
        for i in range(start_idx, end_idx):
            b = blocks[i]
            # Ignore chapter headers
            if "CHAPTER" in b['text'] and ("QUESTIONS" in b['text'] or "SOLUTIONS" in b['text']):
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
            # Find the bounding box for all rects on this page
            x0 = min(r.x0 for r in rects)
            y0 = min(r.y0 for r in rects)
            x1 = max(r.x1 for r in rects)
            y1 = max(r.y1 for r in rects)
            
            # Add padding
            rect = fitz.Rect(x0 - 10, y0 - 10, x1 + 10, y1 + 10)
            
            page = doc[p]
            # render at 4x resolution for extremely high quality (retina displays)
            mat = fitz.Matrix(4, 4)
            pix = page.get_pixmap(matrix=mat, clip=rect)
            
            img_path = f"/tmp/temp_render_{p}.png"
            pix.save(img_path)
            pixmaps.append(Image.open(img_path))
            
        if not pixmaps:
            return
            
        # Stitch vertically
        total_width = max(img.width for img in pixmaps)
        total_height = sum(img.height for img in pixmaps)
        
        stitched = Image.new('RGB', (total_width, total_height), (255, 255, 255))
        y_offset = 0
        for img in pixmaps:
            stitched.paste(img, (0, y_offset))
            y_offset += img.height
            
        stitched.save(out_path)
        
    print("Rendering images...")
    # Render ALL questions
    for q_id, title in q_titles.items():
        if q_id in q_starts:
            start = q_starts[q_id]
            end = q_starts.get(q_id + 1, s_starts.get(1, len(blocks)))
            # print(f"Rendering Q{q_id}: {title}")
            render_blocks(start, end, f"public/images/problems/{title}.png")
            
        if q_id in s_starts:
            start = s_starts[q_id]
            end = s_starts.get(q_id + 1, len(blocks))
            render_blocks(start, end, f"public/images/solutions/{title}.png", True)
            
    print("Done rendering all!")

if __name__ == "__main__":
    main()
