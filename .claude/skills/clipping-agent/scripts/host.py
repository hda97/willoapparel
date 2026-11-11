#!/usr/bin/env python
"""Upload a local clip to a Blotato presigned URL (HTTP PUT of raw bytes).

Usage: python host.py <local_file> <presigned_url> [content_type]

The agent first calls the MCP tool blotato_create_presigned_upload_url to get
{presignedUrl, publicUrl}, then runs this to upload, then uses publicUrl in
blotato_create_post. (Both vidIQ output and local clips end up here.)
"""
import sys
import httpx


def upload(local_path, presigned_url, content_type="application/octet-stream"):
    with open(local_path, "rb") as f:
        data = f.read()
    r = httpx.put(presigned_url, content=data,
                  headers={"Content-Type": content_type}, timeout=600)
    r.raise_for_status()
    return len(data)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        raise SystemExit("usage: host.py <local_file> <presigned_url> [content_type]")
    ct = sys.argv[3] if len(sys.argv) > 3 else "application/octet-stream"
    n = upload(sys.argv[1], sys.argv[2], ct)
    print(f"[host] uploaded {n} bytes")
