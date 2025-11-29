from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_health_check():
    # Assuming we might add a health endpoint, but for now just checking if app loads
    assert app.title == "Generic Configuration Service"
