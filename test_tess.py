import fitz
import pytesseract
from PIL import Image

doc = fitz.open('/Users/dmitt/Desktop/QuantGuide_Web/a-practical-guide-to-quantitative-finance-interviews.pdf')
page = doc[50] # Page 50
pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
pix.save('/tmp/page50.png')

text = pytesseract.image_to_string(Image.open('/tmp/page50.png'))
print(text)
