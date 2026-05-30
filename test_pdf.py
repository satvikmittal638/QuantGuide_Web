import fitz

doc = fitz.open('/Users/dmitt/Desktop/QuantGuide_Web/a-practical-guide-to-quantitative-finance-interviews.pdf')
print("Total pages:", len(doc))
for i in range(50, min(55, len(doc))):
    print(f"--- Page {i} ---")
    page = doc[i]
    images = page.get_images()
    print("Number of images:", len(images))
