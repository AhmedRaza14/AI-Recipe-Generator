import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "AI Recipe Generator API", "version": "1.0.0"}


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_generate_recipe_missing_dish_name():
    """Test recipe generation with missing dish name"""
    response = client.post("/recipe/generate-recipe", json={})
    assert response.status_code == 422  # Validation error


def test_generate_from_ingredients_empty_list():
    """Test ingredient-based generation with empty list"""
    response = client.post("/recipe/generate-from-ingredients", json={"ingredients": []})
    assert response.status_code == 422  # Validation error


def test_chat_endpoint():
    """Test chat endpoint with cooking query"""
    response = client.post("/chat/", json={"message": "How do I cook rice?"})
    assert response.status_code == 200
    assert "response" in response.json()
