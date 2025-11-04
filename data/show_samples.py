import pandas as pd

df = pd.read_csv('graduation_students.csv')

print('=== SAMPLE STUDENTS FROM EACH PROGRAMME ===\n')
for prog in df['Programme'].unique()[:6]:
    print(f'\n{prog}:')
    sample = df[df['Programme']==prog][['Name','University','Classification']].head(3)
    print(sample.to_string(index=False))

print('\n\n=== FILE STATISTICS ===')
print(f'Total Students: {len(df)}')
print(f'Total Programmes: {df["Programme"].nunique()}')
print(f'Total Centers: {df["University"].nunique()}')
