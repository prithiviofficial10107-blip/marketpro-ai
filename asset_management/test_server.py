from backend.app import create_app
app = create_app()
print("App created successfully")
with app.test_client() as client:
    res = client.get('/api/health')
    print(f"Health check status: {res.status_code}")
    print(f"Health check data: {res.get_json()}")
