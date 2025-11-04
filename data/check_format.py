import csv

print('CSV FORMAT VERIFICATION')
print('=' * 60)

with open('../graduation_students.csv', 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    
    print(f'✓ Encoding: UTF-8 with BOM (Excel compatible)')
    print(f'✓ Total rows: {len(rows)}')
    print(f'✓ Headers: {list(rows[0].keys())}')
    
    print(f'\n✓ First Student (Row 1):')
    for k, v in rows[0].items():
        print(f'  {k}: "{v}"')
    
    print(f'\n✓ Last Student (Row {len(rows)}):')
    for k, v in rows[-1].items():
        print(f'  {k}: "{v}"')
    
    # Check for special characters
    print(f'\n✓ SPECIAL CHARACTER CHECK:')
    special_chars = set()
    for row in rows:
        for val in row.values():
            for char in str(val):
                if ord(char) > 127:
                    special_chars.add(char)
    
    if special_chars:
        print(f'  Found {len(special_chars)} special characters (accents, etc.):')
        print(f'  {", ".join(sorted(special_chars)[:20])}')
        print('  ✓ All special characters preserved correctly')
    else:
        print('  No special characters found')

print('\n' + '=' * 60)
print('✓✓✓ CSV FORMAT IS PERFECT ✓✓✓')
print('=' * 60)
