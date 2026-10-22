import json, gzip, re

raw = gzip.decompress(open('nsb_level1', 'rb').read())
s = raw.decode('utf-8')
d, _ = json.JSONDecoder().raw_decode(s[s.index('{'):])

c = open('all_cars.txt', encoding='utf-8').read()
c = re.sub(r'}\s*\n(\s*)\{', r'},\n\1{', c)
c = re.sub(r',\s*\]', '\n]', c)

dec = json.JSONDecoder()
cars = []
i = 0
while i < len(c):
    while i < len(c) and c[i] in ' \t\n\r,':
        i += 1
    if i >= len(c):
        break
    if c[i] != '{':
        i = c.find('{', i)
        if i == -1:
            break
        continue
    try:
        obj, i = dec.raw_decode(c, i)
        cars.append(obj)
    except json.JSONDecodeError:
        i = c.find('{', i + 1)
        if i == -1:
            break

d['caow'] = cars
d['agprlv'] = 5776

with open('nsb.txt', 'w', encoding='utf-8') as f:
    json.dump(d, f, separators=(',', ':'))

print(f"Done. {len(cars)} cars, level 5776")   
