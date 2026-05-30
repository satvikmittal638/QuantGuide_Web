import fitz
import pytesseract
from pytesseract import Output
from PIL import Image
import json

doc = fitz.open('/Users/dmitt/Desktop/QuantGuide_Web/a-practical-guide-to-quantitative-finance-interviews.pdf')
page = doc[50]
pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
img_path = '/tmp/page50.png'
pix.save(img_path)

img = Image.open(img_path)
data = pytesseract.image_to_data(img, output_type=Output.DICT)

words = []
for i in range(len(data['text'])):
    w = data['text'][i].strip()
    if w:
        words.append({
            'text': w,
            'left': data['left'][i],
            'top': data['top'][i],
            'width': data['width'][i],
            'height': data['height'][i]
        })

full_text = " ".join([w['text'] for w in words])
print("TESSERACT TEXT:")
print(full_text)
