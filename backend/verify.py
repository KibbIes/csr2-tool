import json

with open("all_cars.txt", "r", encoding="utf-8") as f:
    content = f.read()

start = content.find('[')
end = content.rfind(']')
data = json.loads(content[start:end+1])

print(f"Total cars: {len(data)}")
print(f"First car: {data[0]['crdb']}")
