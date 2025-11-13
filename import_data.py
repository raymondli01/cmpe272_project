#!/usr/bin/env python3
"""
Import CSV data into Supabase database using REST API
"""
import csv
import os
import json
import urllib.request
import urllib.error

# Load environment variables from .env file
def load_env():
    env_vars = {}
    env_path = '.env'
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    env_vars[key] = value
    return env_vars

env_vars = load_env()

# Initialize Supabase credentials
SUPABASE_URL = env_vars.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = env_vars.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase credentials in .env file")

# REST API headers
HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def clean_value(value):
    """Clean CSV value - remove extra whitespace and handle empty strings"""
    if value is None:
        return None
    if not isinstance(value, str):
        return value  # Return non-string values as-is
    value = value.strip()
    return value if value else None

def parse_bool(value):
    """Parse boolean values from CSV"""
    if value is None or value == '':
        return None
    return value.lower() in ('true', 't', '1', 'yes')

def import_csv(file_path, table_name, transform_fn=None):
    """Import CSV file into Supabase table using REST API"""
    print(f"\n📊 Importing {table_name} from {os.path.basename(file_path)}...")

    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Use semicolon as delimiter (based on CSV format)
            reader = csv.DictReader(f, delimiter=';')
            rows = list(reader)

            if not rows:
                print(f"⚠️  No data found in {file_path}")
                return

            # Transform rows if transformation function provided
            if transform_fn:
                rows = [transform_fn(row) for row in rows]

            # Clean all values
            rows = [{k: clean_value(v) for k, v in row.items()} for row in rows]

            # Delete existing data using REST API
            print(f"🗑️  Clearing existing {table_name} data...")
            delete_url = f"{SUPABASE_URL}/rest/v1/{table_name}?id=neq.00000000-0000-0000-0000-000000000000"
            try:
                req = urllib.request.Request(delete_url, headers=HEADERS, method='DELETE')
                urllib.request.urlopen(req)
            except urllib.error.HTTPError:
                print(f"⚠️  Warning: Could not clear existing data (this is OK if table is empty)")

            # Insert new data in batches using REST API
            batch_size = 100
            insert_url = f"{SUPABASE_URL}/rest/v1/{table_name}"

            for i in range(0, len(rows), batch_size):
                batch = rows[i:i + batch_size]
                data = json.dumps(batch).encode('utf-8')

                req = urllib.request.Request(insert_url, data=data, headers=HEADERS, method='POST')

                try:
                    response = urllib.request.urlopen(req)
                    print(f"  Inserted {min(i + batch_size, len(rows))}/{len(rows)} rows")
                except urllib.error.HTTPError as e:
                    error_msg = e.read().decode('utf-8')
                    print(f"❌ Error inserting batch: {e.code}")
                    print(f"Response: {error_msg}")
                    raise Exception(f"Failed to insert batch: {error_msg}")

            print(f"✅ Successfully imported {len(rows)} rows into {table_name}")

    except Exception as e:
        print(f"❌ Error importing {table_name}: {str(e)}")
        raise

def transform_energy_prices(row):
    """Transform energy_prices row"""
    return {
        **row,
        'is_off_peak': parse_bool(row['is_off_peak']),
        'price_per_kwh': float(row['price_per_kwh']) if row['price_per_kwh'] else None
    }

def transform_nodes(row):
    """Transform nodes row"""
    return {
        **row,
        'x': float(row['x']) if row['x'] else None,
        'y': float(row['y']) if row['y'] else None,
        'elevation': float(row['elevation']) if row['elevation'] else None,
        'pressure': float(row['pressure']) if row['pressure'] else None
    }

def transform_edges(row):
    """Transform edges row"""
    return {
        **row,
        'length_m': float(row['length_m']) if row['length_m'] else None,
        'diameter_mm': float(row['diameter_mm']) if row['diameter_mm'] else None,
        'flow_lps': float(row['flow_lps']) if row['flow_lps'] else None
    }

def transform_sensors(row):
    """Transform sensors row"""
    return {
        **row,
        'value': float(row['value']) if row['value'] else None
    }

def transform_valves_pumps(row):
    """Transform valves_pumps row"""
    return {
        **row,
        'setpoint': float(row['setpoint']) if row['setpoint'] and row['setpoint'].strip() else None
    }

def main():
    print("🚀 Starting data import to Supabase...")
    print(f"📡 Supabase URL: {SUPABASE_URL}")

    base_path = "supabase"

    # Import in correct order (respecting foreign key dependencies)
    import_steps = [
        (f"{base_path}/nodes-export-2025-11-12_23-07-02.csv", "nodes", transform_nodes),
        (f"{base_path}/edges-export-2025-11-12_23-06-18.csv", "edges", transform_edges),
        (f"{base_path}/valves_pumps-export-2025-11-12_23-08-56.csv", "valves_pumps", transform_valves_pumps),
        (f"{base_path}/sensors-export-2025-11-12_23-08-18.csv", "sensors", transform_sensors),
        (f"{base_path}/agents-export-2025-11-12_23-05-36.csv", "agents", None),
        (f"{base_path}/events-export-2025-11-12_23-06-52.csv", "events", None),
        (f"{base_path}/energy_prices-export-2025-11-12_23-06-37.csv", "energy_prices", transform_energy_prices),
        # Skip profiles as it's managed by auth
    ]

    for file_path, table_name, transform_fn in import_steps:
        import_csv(file_path, table_name, transform_fn)

    print("\n" + "="*50)
    print("✅ Data import completed successfully!")
    print("="*50)

if __name__ == "__main__":
    main()
