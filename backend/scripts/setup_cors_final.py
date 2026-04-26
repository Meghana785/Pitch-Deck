import os
from pathlib import Path
from dotenv import load_dotenv
import boto3
from botocore.config import Config

# Load env from root
_root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_root_env)

def setup_cors_final():
    bucket_name = os.environ.get("DO_SPACES_BUCKET")
    region = os.environ.get("DO_SPACES_REGION", "sgp1")
    access_key = os.environ.get("DO_SPACES_KEY")
    secret_key = os.environ.get("DO_SPACES_SECRET")

    if not all([bucket_name, access_key, secret_key]):
        print("Error: Missing Spaces credentials in .env")
        return

    # Try different addressing styles and regions if necessary
    session = boto3.session.Session()
    
    # DO Spaces often works better with s3v4 and specific addressing
    client = session.client(
        "s3",
        region_name=region,
        endpoint_url=f"https://{region}.digitaloceanspaces.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(
            signature_version="s3v4",
            s3={'addressing_style': 'path'}
        ),
    )

    cors_configuration = {
        'CORSRules': [
            {
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                'AllowedOrigins': ['*'], # Using wildcard temporarily to ensure it works
                'ExposeHeaders': ['ETag'],
                'MaxAgeSeconds': 3000
            }
        ]
    }

    print(f"Targeting Bucket: {bucket_name}")
    print(f"Endpoint: https://{region}.digitaloceanspaces.com")
    
    try:
        client.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_configuration)
        print("✅ CORS configuration updated successfully!")
    except Exception as e:
        print(f"❌ Failed to update CORS: {e}")
        
        # Fallback: Try virtual style
        print("Retrying with virtual style...")
        try:
            client_v = session.client(
                "s3",
                region_name=region,
                endpoint_url=f"https://{region}.digitaloceanspaces.com",
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key,
                config=Config(signature_version="s3v4")
            )
            client_v.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_configuration)
            print("✅ CORS configuration updated successfully (Virtual Style)!")
        except Exception as e2:
            print(f"❌ Failed to update CORS (Virtual Style): {e2}")

if __name__ == "__main__":
    setup_cors_final()
