"""
Cloudflare R2 service using boto3.

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


def get_r2_client() -> BaseClient:
    """
    Initialize and return a boto3 S3 client configured for Cloudflare R2.
    
    Reads R2_ACCOUNT_ID, R2_ACCESS_KEY, and R2_SECRET_KEY from env.
    """
    account_id = os.environ.get("R2_ACCOUNT_ID")
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
    
    session = boto3.session.Session()
    client: BaseClient = session.client(
        "s3",
        region_name="auto",
        endpoint_url=endpoint_url,
        aws_access_key_id=os.environ.get("R2_ACCESS_KEY"),
        aws_secret_access_key=os.environ.get("R2_SECRET_KEY"),
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
    Generate a presigned S3 PUT URL for uploading a file directly to R2.
    
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

    bucket = os.environ.get("R2_BUCKET", "pitch-ready")
    object_key = f"uploads/{user_id}/{run_id}_{filename}"

    client = get_r2_client()
    presigned_url = client.generate_presigned_url(
        ClientMethod="put_object",
        Params={
            "Bucket": bucket,
            "Key": object_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires,
    )

    return {
        "presigned_url": presigned_url,
        "object_key": object_key,
    }


def generate_presigned_get(object_key: str, expires: int = 300) -> str:
    """
    Generate a presigned S3 GET URL for securely downloading/accessing a file from R2.
    """
    bucket = os.environ.get("R2_BUCKET", "pitch-ready")
    client = get_r2_client()
    url: str = client.generate_presigned_url(
        ClientMethod="get_object",
        Params={"Bucket": bucket, "Key": object_key},
        ExpiresIn=expires,
    )
    return url


def delete_object(object_key: str) -> None:
    """
    Delete an object from R2. Returns None (fire and forget).
    """
    bucket = os.environ.get("R2_BUCKET", "pitch-ready")
    client = get_r2_client()
    client.delete_object(Bucket=bucket, Key=object_key)
