#!/usr/bin/env python3
"""
Script to extract founder data from FoundersDB.xlsx and create a JSON file
"""

import pandas as pd
import json
import re
from collections import defaultdict

def extract_issue_number(sheet_name):
    """Extract issue number from sheet name for determining recency"""
    match = re.search(r'issue_(\d+)', sheet_name)
    return int(match.group(1)) if match else 0

def normalize_name(name):
    """Normalize name for matching duplicates"""
    if pd.isna(name):
        return None
    # Convert to lowercase, remove extra spaces, handle common variations
    normalized = str(name).strip().lower()
    # Remove parentheses and content inside them (like nicknames)
    normalized = re.sub(r'\([^)]*\)', '', normalized).strip()
    return normalized

def clean_value(value):
    """Clean and normalize values"""
    if pd.isna(value):
        return None
    return str(value).strip() if str(value).strip() else None

def merge_founder_data(existing, new_data, new_issue_num, existing_issue_num):
    """Merge founder data, preferring more recent information"""
    merged = existing.copy()
    
    # If new data is more recent, prefer new values over existing ones
    if new_issue_num > existing_issue_num:
        for key, value in new_data.items():
            if value is not None:  # Only update if new value exists
                merged[key] = value
        merged['_issue_number'] = new_issue_num
    else:
        # If existing data is more recent, only fill in missing values
        for key, value in new_data.items():
            if value is not None and (key not in merged or merged[key] is None):
                merged[key] = value
    
    return merged

def main():
    # Read Excel file
    xl = pd.ExcelFile('FoundersDB.xlsx')
    
    # Dictionary to store founders by normalized name
    founders_dict = {}
    
    # Process each sheet
    for sheet_name in xl.sheet_names:
        print(f"Processing {sheet_name}...")
        
        # Extract issue number for recency determination
        issue_num = extract_issue_number(sheet_name)
        
        # Read sheet starting from row 3 (0-indexed row 2)
        df = pd.read_excel('FoundersDB.xlsx', sheet_name=sheet_name, header=2)
        
        # Process each row
        for _, row in df.iterrows():
            name = clean_value(row.get('Name'))
            if not name:
                continue
                
            normalized_name = normalize_name(name)
            if not normalized_name:
                continue
            
            # Extract data from row
            founder_data = {
                'name': name,
                'startup': clean_value(row.get('My current startup')),
                'website': clean_value(row.get('Website')),
                'industry': clean_value(row.get('Industry')),
                'customer_user': clean_value(row.get('Customer/User')),
                'current_stage': clean_value(row.get("Where I'm now")),
                'help_needed': clean_value(row.get('Help I need 🆘')),
                'can_help_with': clean_value(row.get('Things I can help with (my specialization/passion)')),
                'love': clean_value(row.get('ONE thing I love')),
                'about_me': clean_value(row.get('Who I really am and what I love 💙')),
                'email': clean_value(row.get('Email')),
                'linkedin': clean_value(row.get('LinkedIn')),
                '_sheet_name': sheet_name,
                '_issue_number': issue_num
            }
            
            # Merge with existing data if founder already exists
            if normalized_name in founders_dict:
                existing_issue_num = founders_dict[normalized_name].get('_issue_number', 0)
                founders_dict[normalized_name] = merge_founder_data(
                    founders_dict[normalized_name], 
                    founder_data, 
                    issue_num, 
                    existing_issue_num
                )
            else:
                founders_dict[normalized_name] = founder_data
    
    # Convert to list and remove internal fields
    founders_list = []
    for founder_data in founders_dict.values():
        # Remove internal tracking fields
        clean_data = {k: v for k, v in founder_data.items() if not k.startswith('_')}
        founders_list.append(clean_data)
    
    # Sort by name for consistency
    founders_list.sort(key=lambda x: x.get('name', '').lower())
    
    # Write to JSON file
    output_file = 'founders_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(founders_list, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully extracted {len(founders_list)} unique founders to {output_file}")
    print(f"📊 Processed {len(xl.sheet_names)} sheets")
    
    # Show some statistics
    founders_with_email = sum(1 for f in founders_list if f.get('email'))
    founders_with_linkedin = sum(1 for f in founders_list if f.get('linkedin'))
    founders_with_startup = sum(1 for f in founders_list if f.get('startup'))
    
    print(f"📈 Statistics:")
    print(f"   - Founders with email: {founders_with_email}")
    print(f"   - Founders with LinkedIn: {founders_with_linkedin}")
    print(f"   - Founders with startup info: {founders_with_startup}")

if __name__ == "__main__":
    main()