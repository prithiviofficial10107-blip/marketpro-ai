import requests

login_url = "http://127.0.0.1:5001/api/auth/login"
assets_url = "http://127.0.0.1:5001/api/assets/"

try:
    login_res = requests.post(login_url, json={"username": "admin", "password": "admin123"})
    token = login_res.json()['data']['access_token']

    assets_res = requests.get(assets_url, headers={"Authorization": f"Bearer {token}"})
    assets = assets_res.json()['data']

    if assets:
        print("Sample asset data:")
        print(assets[0])
    else:
        print("No assets found.")
except Exception as e:
    print(f"Error: {e}")
