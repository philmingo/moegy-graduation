import pandas as pd
import re
import os

# Change to the students directory
os.chdir('c:/Users/XpJayy/Documents/Code/Project/Graduation/students')

# Read the Excel file
df = pd.read_excel('Binder1.pdf.xlsx', sheet_name='Table 1', header=None)

# Initialize variables
students = []
current_programme = ""
current_university = ""

# List of known locations/centers
locations = [
    'belladrum', 'georgetown', 'moruca', 'new amsterdam', 'rose hall',
    'albouystown', 'skeldon', 'georgetown center', 'rose hall center',
    'albouystown center', 'skeldon center', 'lethem', 'linden',
    'mahaica', 'mahaicony', 'essequibo', 'berbice', 'demerara'
]

# Distance education types
distance_types = ['primary', 'secondary', 'pre-vocational', 'pre vocational', 'prevocational']

def is_location_header(text):
    """Check if text is a location/center header"""
    if pd.isna(text):
        return False
    text_lower = str(text).lower().strip()
    return any(loc in text_lower for loc in locations)

def is_programme_header(text):
    """Check if text is a programme header"""
    if pd.isna(text):
        return False
    text_str = str(text).upper().strip()
    # Programme headers typically contain these keywords
    keywords = ['ASSOCIATE DEGREE', 'CERTIFICATE', 'DIPLOMA', 'PROGRAMME', 
                'DISTANCE EDUCATION', 'GRADUATE TEACHER EDUCATION']
    return any(keyword in text_str for keyword in keywords)

def extract_distance_type(programme_text):
    """Extract distance education type if present (PRIMARY, SECONDARY, PRE-VOCATIONAL)"""
    if pd.isna(programme_text):
        return None
    text_upper = str(programme_text).upper()
    if 'PRIMARY' in text_upper:
        return 'Primary'
    elif 'SECONDARY' in text_upper:
        return 'Secondary'
    elif 'PRE-VOCATIONAL' in text_upper or 'PRE VOCATIONAL' in text_upper or 'PREVOCATIONAL' in text_upper:
        return 'Pre-Vocational'
    return None

def clean_programme_name(programme_text):
    """Clean and standardize programme name"""
    if pd.isna(programme_text):
        return ""
    # Remove extra spaces and standardize
    clean = ' '.join(str(programme_text).split())
    
    # Simplify common programme names
    # Keep ASSOCIATE DEGREE IN at the beginning for clarity
    if 'TECHNICAL' in clean.upper() and 'TEACHER' in clean.upper():
        return "Associate Degree in Technical Teachers Education"
    
    if 'GRADUATE TEACHER EDUCATION' in clean.upper():
        return "Associate Degree in Graduate Teacher Education"
    
    if 'SPECIAL EDUCATION' in clean.upper() and 'EARLY CHILDHOOD' in clean.upper():
        distance_type = extract_distance_type(clean)
        base = "Associate Degree in Special Education - Early Childhood"
        return f"{base} ({distance_type})" if distance_type else base
    
    if 'DISTANCE EDUCATION' in clean.upper():
        # Extract the type (PRIMARY, SECONDARY, etc.)
        types = []
        if 'PRIMARY' in clean.upper():
            types.append('Primary')
        if 'SECONDARY' in clean.upper():
            types.append('Secondary')
        if 'PRE-VOCATIONAL' in clean.upper() or 'PRE VOCATIONAL' in clean.upper():
            types.append('Pre-Vocational')
        if 'ACADEMIC' in clean.upper():
            types.append('Academic')
        
        type_str = ' '.join(types) if types else ''
        return f"Associate Degree in Special Education - {type_str}".strip()
    
    return clean.strip()

# Process each row
print("Processing Excel data...")
for idx, row in df.iterrows():
    # Check first column for programme or location header
    first_col = row[0]
    
    # Check if it's a programme header
    if is_programme_header(first_col):
        current_programme = clean_programme_name(first_col)
        print(f"\nFound programme: {current_programme}")
        continue
    
    # Check if it's a location header
    if is_location_header(first_col):
        current_university = str(first_col).strip().title()
        # Standardize center naming
        if 'center' not in current_university.lower():
            current_university = f"{current_university} Center"
        print(f"  Found location: {current_university}")
        continue
    
    # Try to find student data
    # Look for Last Name and First Name in the row
    last_name = None
    first_name = None
    classification = None
    
    # Search through columns for names and classification
    for col_idx, cell in enumerate(row):
        if pd.isna(cell):
            continue
        
        cell_str = str(cell).strip()
        
        # Skip if it's a number or too short
        if cell_str.isdigit() or len(cell_str) < 2:
            continue
        
        # Skip common non-name values
        if cell_str.upper() in ['R', 'G', 'M', 'F', 'NAN', 'NO.']:
            continue
        
        # Check for classification
        if cell_str.upper() in ['CREDIT', 'DISTINCTION', 'PASS', 'MERIT']:
            classification = cell_str.title()
            continue
        
        # Check if it looks like a name (contains letters, not a header)
        if re.match(r'^[A-Za-z\s\-\']+$', cell_str) and not is_location_header(cell_str) and not is_programme_header(cell_str):
            # First name found is likely last name
            if last_name is None:
                last_name = cell_str
            elif first_name is None:
                first_name = cell_str
    
    # If we found both names, add the student
    if last_name and first_name:
        full_name = f"{first_name} {last_name}"
        
        # Skip header rows with "First Name" and "Last Name"
        if first_name.upper() == "FIRST NAME" or last_name.upper() == "LAST NAME":
            continue
        
        # Skip if no university is set
        if not current_university:
            continue
        
        # Build programme name with distance type if applicable
        final_programme = current_programme
        
        student = {
            'Name': full_name,
            'Seat No.': '',
            'University': current_university,
            'Programme': final_programme,
            'Classification': classification if classification else ''
        }
        students.append(student)
        print(f"    Added: {full_name} | {current_university} | {final_programme} | {classification}")

print(f"\n\nTotal students found: {len(students)}")

# Create DataFrame
students_df = pd.DataFrame(students)

# Save to CSV
output_file = 'graduation_students.csv'
students_df.to_csv(output_file, index=False, encoding='utf-8-sig')
print(f"\n✅ CSV file created: {output_file}")
print(f"   Total students: {len(students_df)}")

# Display summary
print("\n📊 Summary by Location:")
print(students_df['University'].value_counts())
print("\n📊 Summary by Programme:")
print(students_df['Programme'].value_counts())
print("\n📊 Summary by Classification:")
print(students_df['Classification'].value_counts())

# Show first few rows
print("\n🔍 First 10 students:")
print(students_df.head(10).to_string(index=False))
