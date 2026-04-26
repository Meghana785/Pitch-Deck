import os
from pathlib import Path
from dotenv import load_dotenv
import boto3
from botocore.config import Config

# Load env from root
_root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_root_env)

def check_bucket_path_style():
    bucket_name = os.environ.get("DO_SPACES_BUCKET")
    region = os.environ.get("DO_SPACES_REGION", "sgp1")
    access_key = os.environ.get("DO_SPACES_KEY")
    secret_key = os.environ.get("DO_SPACES_SECRET")

    session = boto3.session.Session()
    client = session.client(
        "s3",
        region_name=region,
        endpoint_url=f"https://{region}.digitaloceanspaces.com",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(s3={'addressing_style': 'path'})
    )

    try:
        client.head_bucket(Bucket=bucket_name)
        print(f"✅ Bucket '{bucket_name}' exists and is accessible (Path Style)!")
    except Exception as e:
        print(f"❌ Cannot access bucket '{bucket_name}' (Path Style): {e}")

if __name__ == "__main__":
    check_bucket_path_style()
