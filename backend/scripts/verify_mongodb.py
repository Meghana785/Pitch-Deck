import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env (two levels up from scripts/)
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

from db.models import create_db_client, get_db, init_db

async def check():
    print("Testing MongoDB connection...")
    try:
        client = await create_db_client()
        db = get_db(client)
        
        # Ping
        await client.admin.command('ping')
        print("✅ MongoDB Connection Successful!")
        
        # Init
        print("Initializing database collections and indexes...")
        await init_db(db)
        print("✅ Database Initialized!")
        
        # List collections
        collections = await db.list_collection_names()
        print(f"Collections: {collections}")
        
        client.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())
