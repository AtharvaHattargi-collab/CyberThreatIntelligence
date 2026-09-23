import requests
from auth_utils import create_access_token

base_url = "http://127.0.0.1:8000"

print("Health:", requests.get(f"{base_url}/api/health").status_code)
print("DB Health:", requests.get(f"{base_url}/api/database/health").status_code)

access_token = create_access_token(data={"sub": "admin"})
headers = {"Authorization": f"Bearer {access_token}"}

print("ML Status:", requests.get(f"{base_url}/api/ml/status", headers=headers).status_code)
print("ML Performance:", requests.get(f"{base_url}/api/ml/performance", headers=headers).status_code)
print("ML Feature Importance:", requests.get(f"{base_url}/api/ml/feature-importance", headers=headers).status_code)

response = requests.get(f"{base_url}/api/ml/sample", headers=headers)
print("ML Sample:", response.status_code)

if response.status_code == 200:
    sample_data = response.json()["sample"]
    pred = requests.post(f"{base_url}/api/ml/predict", json=sample_data, headers=headers)
    print("ML Predict:", pred.status_code, pred.json())
