import fitz
import re

doc = fitz.open('/Users/dmitt/Desktop/QuantGuide_Web/QUANT_GUIDE[1].pdf')
text = ""
for page in doc:
    text += page.get_text()

q_matches = re.findall(r'Question (\d+):', text)
s_matches = re.findall(r'Solution to Question (\d+):', text)

print(f"Total questions found by regex: {len(q_matches)}")
print(f"Total solutions found by regex: {len(s_matches)}")

unique_qs = set(q_matches)
unique_ss = set(s_matches)
print(f"Unique questions: {len(unique_qs)}")
print(f"Unique solutions: {len(unique_ss)}")

max_q = max(int(q) for q in unique_qs) if unique_qs else 0
print(f"Max question number: {max_q}")
