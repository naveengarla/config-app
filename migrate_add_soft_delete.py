"""
Quick migration script to add deleted_at columns to existing database.
Run this once to update your database schema.
"""

import sqlite3
from datetime import datetime

DB_PATH = "config_service.db"

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Starting migration...")
    
    # Add deleted_at to namespaces
    try:
        cursor.execute("ALTER TABLE namespaces ADD COLUMN deleted_at TIMESTAMP NULL")
        print("✓ Added deleted_at to namespaces")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("✓ deleted_at already exists in namespaces")
        else:
            print(f"✗ Error adding deleted_at to namespaces: {e}")
    
    # Add deleted_at to config_schemas
    try:
        cursor.execute("ALTER TABLE config_schemas ADD COLUMN deleted_at TIMESTAMP NULL")
        print("✓ Added deleted_at to config_schemas")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("✓ deleted_at already exists in config_schemas")
        else:
            print(f"✗ Error adding deleted_at to config_schemas: {e}")
    
    # Add deleted_at to config_entries
    try:
        cursor.execute("ALTER TABLE config_entries ADD COLUMN deleted_at TIMESTAMP NULL")
        print("✓ Added deleted_at to config_entries")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("✓ deleted_at already exists in config_entries")
        else:
            print(f"✗ Error adding deleted_at to config_entries: {e}")
    
    conn.commit()
    conn.close()
    
    print("\n✅ Migration complete!")
    print("Restart the server to apply changes.")

if __name__ == "__main__":
    migrate()
