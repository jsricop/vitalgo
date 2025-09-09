import pytest
from httpx import AsyncClient


class TestHealthCheck:

    @pytest.mark.asyncio
    async def test_basic_health_check(self, test_client: AsyncClient):
        """Test basic health check endpoint."""
        response = await test_client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "backend-api"

    @pytest.mark.asyncio
    async def test_detailed_health_check(self, test_client: AsyncClient):
        """Test detailed health check endpoint."""
        response = await test_client.get("/health/detailed")

        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "services" in data
        assert "api" in data["services"]
        assert "database" in data["services"]
        assert "redis" in data["services"]
