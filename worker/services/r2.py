"""
Cloudflare R2 file download service for PitchReady worker.

Uses boto3 to generate a fresh presigned GET URL, then downloads
the file bytes asynchronously via httpx.
"""

from __future__ import annotations

import logging
import os

import boto3
import httpx
from botocore.config import Config

logger = logging.getLogger(__name__)


def _get_r2_client():
    """
    Build and return a boto3 S3 client pointed at Cloudflare R2.

    Reads R2_ACCOUNT_ID, R2_ACCESS_KEY, and R2_SECRET_KEY from the environment.
    """
    account_id = os.environ.get("R2_ACCOUNT_ID")
    endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"

    session = boto3.session.Session()
    return session.client(
        "s3",
        region_name="auto",
        endpoint_url=endpoint_url,
        aws_access_key_id=os.environ.get("R2_ACCESS_KEY"),
        aws_secret_access_key=os.environ.get("R2_SECRET_KEY"),
        config=Config(signature_version="s3v4"),
    )


async def download_file(object_key: str, expires: int = 300) -> tuple[bytes, str]:
    """
    Download a file from Cloudflare R2 and return its raw bytes.

    Generates a fresh presigned GET URL (valid for *expires* seconds),
    then performs an async HTTP GET via httpx.

    Args:
        object_key: The full R2 object key (e.g. 'uploads/user/run_deck.pdf').
        expires:    How long the presigned URL should be valid (default 300s).

    Returns:
        A tuple of (file_bytes, filename) where filename is the final
        path segment of object_key.

    Raises:
        RuntimeError: If the presigned URL generation or HTTP download fails.
    """
    bucket = os.environ.get("R2_BUCKET", "pitch-ready")
    filename = object_key.rsplit("/", 1)[-1]

    logger.info("Generating presigned GET URL for %s", object_key)
    try:
        client = _get_r2_client()
        presigned_url: str = client.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": bucket, "Key": object_key},
            ExpiresIn=expires,
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to generate presigned GET URL for '{object_key}': {exc}") from exc

    logger.info("Downloading file '%s' from R2", filename)
    try:
        async with httpx.AsyncClient(timeout=60) as http_client:
            response = await http_client.get(presigned_url)
            response.raise_for_status()
            file_bytes = response.content
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"HTTP {exc.response.status_code} downloading '{object_key}'"
        ) from exc
    except Exception as exc:
        raise RuntimeError(f"Failed to download '{object_key}': {exc}") from exc

    logger.info("Downloaded %d bytes for file '%s'", len(file_bytes), filename)
    return file_bytes, filename
