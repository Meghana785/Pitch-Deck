import os
from pathlib import Path
from dotenv import load_dotenv
import boto3
from botocore.config import Config

# Load env from root
_root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_root_env)

def setup_cors():
    bucket_name = os.environ.get("DO_SPACES_BUCKET")
    region = os.environ.get("DO_SPACES_REGION", "sgp1")
    access_key = os.environ.get("DO_SPACES_KEY")
    secret_key = os.environ.get("DO_SPACES_SECRET")

    if not all([bucket_name, access_key, secret_key]):
        print("Error: Missing Spaces credentials in .env")
        return

    session = boto3.session.Session()
    client = session.client(
        "s3",
        region_name=region,
        endpoint_url=f"https://{region}.digitaloceanspaces.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version="s3v4"),
    )

    cors_configuration = {
        'CORSRules': [
            {
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                'AllowedOrigins': [
                    'http://localhost:3000',
                    'http://127.0.0.1:3000',
                    'http://localhost:3001',
                    'http://127.0.0.1:3001'
                ],
                'ExposeHeaders': ['ETag'],
                'MaxAgeSeconds': 3000
            }
        ]
    }

    print(f"Setting CORS for bucket: {bucket_name} in {region}...")
    try:
        client.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_configuration)
        print("✅ CORS configuration updated successfully!")
    except Exception as e:
        print(f"❌ Failed to update CORS: {e}")

if __name__ == "__main__":
    setup_cors()
