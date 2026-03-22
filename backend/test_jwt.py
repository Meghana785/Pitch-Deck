import urllib.request
import json
import jwt
from jwt import PyJWKClient

# We use the pre-installed env or a virtual env
url = "https://ep-mute-thunder-akxvaj66.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth/.well-known/jwks.json"
jwks_client = PyJWKClient(url)
print("JWKS Client created.")
print("Fetching keys:", jwks_client.get_jwk_set().keys)
