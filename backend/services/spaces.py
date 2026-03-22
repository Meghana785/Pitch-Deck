"""
DigitalOcean Spaces service using boto3.

Provides functions to generate presigned URLs for object upload and download,
as well as object deletion.
"""

from __future__ import annotations

import os
import uuid
from typing import Any

import boto3
from botocore.client import BaseClient
from botocore.config import Config

# Allowed content types mapped to extensions for presigned PUT validation
ALLOWED_CONTENT_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
}


def get_spaces_client() -> BaseClient:
    """
    Initialize and return a boto3 S3 client configured for DigitalOcean Spaces.
    
    Reads DO_SPACES_KEY, DO_SPACES_SECRET, and DO_SPACES_REGION from env.
    """
    region = os.environ.get("DO_SPACES_REGION", "nyc3")
    endpoint_url = f"https://{region}.digitaloceanspaces.com"
    
    session = boto3.session.Session()
    client: BaseClient = session.client(
        "s3",
        region_name=region,
        endpoint_url=endpoint_url,
        aws_access_key_id=os.environ.get("DO_SPACES_KEY"),
        aws_secret_access_key=os.environ.get("DO_SPACES_SECRET"),
        config=Config(signature_version="s3v4"),
    )
    return client


def generate_presigned_put(
    user_id: str | uuid.UUID,
    run_id: str | uuid.UUID,
    filename: str,
    content_type: str,
    expires: int = 900,
) -> dict[str, Any]:
    """
    Generate a presigned S3 PUT URL for uploading a file directly to Spaces.
    
    Args:
        user_id: The ID of the user uploading the file.
        run_id: The analysis run ID associated with the upload.
        filename: The original filename.
        content_type: MIME type of the upload (must be one of ALLOWED_CONTENT_TYPES).
        expires: Presigned URL expiration time in seconds (default 900).
        
    Returns:
        dict containing 'presigned_url' and 'object_key'
        
    Raises:
        ValueError if the content_type is not allowed.
    """
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Content type {content_type} is not allowed.")

    bucket = os.environ.get("DO_SPACES_BUCKET", "pitchready-assets")
    object_key = f"uploads/{user_id}/{run_id}_{filename}"

    client = get_spaces_client()
    presigned_url = client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": bucket,
            "Key": object_key,
            "ContentType": content_type,
            "ACL": "private",
        },
        ExpiresIn=expires,
    )

    return {
        "presigned_url": presigned_url,
        "object_key": object_key,
    }


def generate_presigned_get(object_key: str, expires: int = 300) -> str:
    """
    Generate a presigned S3 GET URL for securely downloading/accessing a file.
    """
    bucket = os.environ.get("DO_SPACES_BUCKET", "pitchready-assets")
    client = get_spaces_client()
    url: str = client.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": bucket, "Key": object_key},
        ExpiresIn=expires,
    )
    return url


def delete_object(object_key: str) -> None:
    """
    Delete an object from Spaces. Returns None (fire and forget).
    """
    bucket = os.environ.get("DO_SPACES_BUCKET", "pitchready-assets")
    client = get_spaces_client()
    client.delete_object(Bucket=bucket, Key=object_key)
