import os
from pathlib import Path
from dotenv import load_dotenv
import boto3
from botocore.config import Config

# Load env from root
_root_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=_root_env)

def list_buckets():
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
    )

    try:
        response = client.list_buckets()
        print("Buckets found:")
        for bucket in response['Buckets']:
            print(f"  - {bucket['Name']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_buckets()
