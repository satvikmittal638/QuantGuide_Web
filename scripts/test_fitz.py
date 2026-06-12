import fitz
doc = fitz.open('/Users/dmitt/Desktop/QuantGuide_Web/(Important) QuantProf.pdf')
for i in range(1, 10):
    text = doc[i].get_text()
    if "Non-empty" in text:
        print("Found on page", i)
        blocks = doc[i].get_text("blocks")
        for b in blocks[:10]:
            print("BLOCK:", repr(b[4]))
        break
