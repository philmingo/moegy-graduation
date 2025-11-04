import pandas as pd
import os
import sys

print('=' * 70)
print('COMPREHENSIVE CSV VALIDATION REPORT')
print('=' * 70)

csv_path = '../graduation_students.csv'

# 1. FILE EXISTENCE AND SIZE
print('\n✓ FILE CHECKS')
print('-' * 70)
if os.path.exists(csv_path):
    print(f'  ✓ File exists: {os.path.abspath(csv_path)}')
    print(f'  ✓ File size: {os.path.getsize(csv_path):,} bytes ({os.path.getsize(csv_path)/1024:.2f} KB)')
else:
    print('  ✗ ERROR: File does not exist!')
    sys.exit(1)

# 2. LOAD AND VALIDATE CSV
print('\n✓ CSV STRUCTURE')
print('-' * 70)
try:
    df = pd.read_csv(csv_path, encoding='utf-8-sig')
    print(f'  ✓ CSV loaded successfully')
    print(f'  ✓ Total rows: {len(df)}')
    print(f'  ✓ Total columns: {len(df.columns)}')
except Exception as e:
    print(f'  ✗ ERROR loading CSV: {e}')
    sys.exit(1)

# 3. COLUMN VALIDATION
print('\n✓ REQUIRED COLUMNS')
print('-' * 70)
required_cols = ['Name', 'Seat No.', 'University', 'Programme', 'Classification']
for col in required_cols:
    exists = col in df.columns
    status = '✓' if exists else '✗'
    print(f'  {status} {col}: {"Present" if exists else "MISSING"}')
    
if not all(col in df.columns for col in required_cols):
    print('\n  ✗ ERROR: Missing required columns!')
    sys.exit(1)

# 4. DATA QUALITY CHECKS
print('\n✓ DATA QUALITY')
print('-' * 70)

# Check for empty names
empty_names = df['Name'].isna().sum()
print(f'  ✓ Empty names: {empty_names} (should be 0)')

# Check for duplicate names
duplicates = df['Name'].duplicated().sum()
print(f'  ✓ Duplicate names: {duplicates} (should be 0)')

# Check name format (should contain space for first + last name)
names_with_space = df['Name'].str.contains(' ', na=False).sum()
print(f'  ✓ Names with space (first + last): {names_with_space}/{len(df)} ({names_with_space/len(df)*100:.1f}%)')

# Check for very short names (potential data issues)
short_names = df[df['Name'].str.len() < 5]
if len(short_names) > 0:
    print(f'  ⚠ Warning: {len(short_names)} names are very short (< 5 chars)')
else:
    print(f'  ✓ All names are reasonable length')

# Check University field
empty_uni = df['University'].isna().sum()
print(f'  ✓ Empty university: {empty_uni} (should be 0)')

# Check Programme field
empty_prog = df['Programme'].isna().sum()
print(f'  ✓ Empty programme: {empty_prog} (should be 0)')

# Check Classification field
empty_class = df['Classification'].isna().sum() + (df['Classification'] == '').sum()
print(f'  ✓ Empty classification: {empty_class} (OK if some are empty)')

# 5. DATA DISTRIBUTION
print('\n✓ DATA DISTRIBUTION')
print('-' * 70)
print(f'\nProgrammes ({df["Programme"].nunique()} unique):')
for prog, count in df['Programme'].value_counts().head(10).items():
    print(f'  • {prog}: {count} students')

print(f'\nUniversities/Centers ({df["University"].nunique()} unique):')
for uni, count in df['University'].value_counts().head(10).items():
    print(f'  • {uni}: {count} students')

print(f'\nClassifications:')
for cls, count in df['Classification'].value_counts().items():
    print(f'  • {cls}: {count} students ({count/len(df)*100:.1f}%)')

# 6. SAMPLE DATA
print('\n✓ SAMPLE DATA (First 5 students)')
print('-' * 70)
print(df.head(5).to_string(index=False))

# 7. FINAL VALIDATION
print('\n' + '=' * 70)
print('FINAL VALIDATION RESULT')
print('=' * 70)

issues = []
if empty_names > 0:
    issues.append('Empty names detected')
if duplicates > 0:
    issues.append('Duplicate names detected')
if names_with_space < len(df) * 0.9:
    issues.append('Many names missing space (first/last separation)')
if empty_uni > 0:
    issues.append('Empty university fields')
if empty_prog > 0:
    issues.append('Empty programme fields')

if len(issues) == 0:
    print('\n✓✓✓ ALL CHECKS PASSED ✓✓✓')
    print('\nYour CSV file is PERFECT and ready for import!')
    print(f'\n📊 Summary: {len(df)} students across {df["Programme"].nunique()} programmes at {df["University"].nunique()} centers')
    print('\n✅ You can confidently upload this file to your graduation system.')
else:
    print('\n⚠ ISSUES FOUND:')
    for issue in issues:
        print(f'  ✗ {issue}')
    print('\nPlease review these issues before importing.')

print('\n' + '=' * 70)
