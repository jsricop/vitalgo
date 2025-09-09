"""
Integration tests for the complete patient flow in VitalGo

Tests the end-to-end functionality:
1. Patient registration
2. Medical data management (allergies, illnesses, surgeries)
3. QR code generation and access
4. Authentication and authorization
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, date
import json

from slices.main import app

client = TestClient(app)

# Test data
TEST_PATIENT_DATA = {
    "email": "test.patient@example.com",
    "password": "testpassword123",
    "first_name": "Juan",
    "last_name": "Pérez",
    "phone": "+57300123456",
    "document_type": "CC",
    "document_number": "12345678",
    "birth_date": "1985-06-15",
    "gender": "M",
    "blood_type": "O+",
    "eps": "SURA",
    "emergency_contact_name": "María Pérez",
    "emergency_contact_phone": "+57300987654",
    "address": "Calle 123 #45-67",
    "city": "Bogotá"
}

TEST_ALLERGY_DATA = {
    "allergen": "Penicilina",
    "severity": "CRITICA",
    "symptoms": "Erupciones cutáneas severas, dificultad respiratoria",
    "treatment": "Evitar penicilina, usar antihistamínicos en caso de reacción",
    "notes": "Alergia confirmada en 2020"
}

TEST_ILLNESS_DATA = {
    "name": "Hipertensión Arterial",
    "diagnosed_date": "2023-01-15T10:00:00",
    "cie10_code": "I10",
    "symptoms": "Dolor de cabeza, mareos ocasionales",
    "treatment": "Losartán 50mg diario",
    "prescribed_by": "Dr. García",
    "is_chronic": True
}

TEST_SURGERY_DATA = {
    "name": "Apendicectomía",
    "surgery_date": "2022-08-20T14:30:00",
    "surgeon": "Dr. Rodríguez",
    "hospital": "Hospital San Juan de Dios",
    "description": "Cirugía laparoscópica para extracción de apéndice inflamado",
    "anesthesia_type": "General",
    "surgery_duration_minutes": 45
}


class TestPatientRegistrationFlow:
    """Test patient registration and profile management"""
    
    def test_patient_registration_success(self):
        """Test successful patient registration"""
        response = client.post("/api/v1/auth/register/patient", json=TEST_PATIENT_DATA)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Patient registered successfully"
        assert data["user"]["email"] == TEST_PATIENT_DATA["email"]
        assert data["user"]["role"] == "patient"
        assert data["patient"]["document_number"] == TEST_PATIENT_DATA["document_number"]
        assert data["patient"]["blood_type"] == TEST_PATIENT_DATA["blood_type"]
    
    def test_duplicate_email_registration(self):
        """Test that duplicate email registration fails"""
        # First registration
        client.post("/api/v1/auth/register/patient", json=TEST_PATIENT_DATA)
        
        # Second registration with same email
        response = client.post("/api/v1/auth/register/patient", json=TEST_PATIENT_DATA)
        
        assert response.status_code == 400
        assert "Email already registered" in response.json()["detail"]
    
    def test_invalid_blood_type_registration(self):
        """Test registration with invalid blood type"""
        invalid_data = TEST_PATIENT_DATA.copy()
        invalid_data["blood_type"] = "X+"
        
        response = client.post("/api/v1/auth/register/patient", json=invalid_data)
        
        assert response.status_code == 400


class TestAuthenticationFlow:
    """Test authentication and authorization"""
    
    @pytest.fixture(autouse=True)
    def setup_patient(self):
        """Setup a test patient for authentication tests"""
        client.post("/api/v1/auth/register/patient", json=TEST_PATIENT_DATA)
    
    def test_successful_login(self):
        """Test successful patient login"""
        login_data = {
            "email": TEST_PATIENT_DATA["email"],
            "password": TEST_PATIENT_DATA["password"]
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["token_type"] == "bearer"
        assert "access_token" in data
        assert data["role"] == "patient"
        assert data["user"]["email"] == TEST_PATIENT_DATA["email"]
    
    def test_invalid_login_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": TEST_PATIENT_DATA["email"],
            "password": "wrongpassword"
        }
        
        response = client.post("/api/v1/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]
    
    def test_get_current_user(self):
        """Test getting current user information"""
        # Login first
        login_response = client.post("/api/v1/auth/login", json={
            "email": TEST_PATIENT_DATA["email"],
            "password": TEST_PATIENT_DATA["password"]
        })
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == TEST_PATIENT_DATA["email"]
        assert data["role"] == "patient"


class TestMedicalDataManagement:
    """Test medical data CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup_authenticated_patient(self):
        """Setup authenticated patient for medical data tests"""
        # Register patient
        client.post("/api/v1/auth/register/patient", json=TEST_PATIENT_DATA)
        
        # Login and get token
        login_response = client.post("/api/v1/auth/login", json={
            "email": TEST_PATIENT_DATA["email"],
            "password": TEST_PATIENT_DATA["password"]
        })
        
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_add_allergy(self):
        """Test adding allergy to patient"""
        response = client.post(
            "/api/v1/patients/me/allergies",
            json=TEST_ALLERGY_DATA,
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Allergy added successfully"
        assert data["allergy"]["allergen"] == TEST_ALLERGY_DATA["allergen"]
        assert data["allergy"]["severity"] == TEST_ALLERGY_DATA["severity"]
        assert data["allergy"]["is_critical"] == True
    
    def test_get_allergies(self):
        """Test retrieving patient allergies"""
        # First add an allergy
        client.post(
            "/api/v1/patients/me/allergies",
            json=TEST_ALLERGY_DATA,
            headers=self.headers
        )
        
        # Then retrieve allergies
        response = client.get("/api/v1/patients/me/allergies", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "allergies" in data
        assert len(data["allergies"]) > 0
        assert data["allergies"][0]["allergen"] == TEST_ALLERGY_DATA["allergen"]
    
    def test_add_illness(self):
        """Test adding illness to patient"""
        response = client.post(
            "/api/v1/patients/me/illnesses",
            json=TEST_ILLNESS_DATA,
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Illness added successfully"
        assert data["illness"]["name"] == TEST_ILLNESS_DATA["name"]
        assert data["illness"]["is_chronic"] == True
        assert data["illness"]["status"] == "CRONICA"
    
    def test_add_surgery(self):
        """Test adding surgery to patient"""
        response = client.post(
            "/api/v1/patients/me/surgeries",
            json=TEST_SURGERY_DATA,
            headers=self.headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["message"] == "Surgery added successfully"
        assert data["surgery"]["name"] == TEST_SURGERY_DATA["name"]
        assert data["surgery"]["surgeon"] == TEST_SURGERY_DATA["surgeon"]
        assert data["surgery"]["hospital"] == TEST_SURGERY_DATA["hospital"]
    
    def test_get_medical_summary(self):
        """Test retrieving complete medical summary"""
        # Add medical data
        client.post("/api/v1/patients/me/allergies", json=TEST_ALLERGY_DATA, headers=self.headers)
        client.post("/api/v1/patients/me/illnesses", json=TEST_ILLNESS_DATA, headers=self.headers)
        client.post("/api/v1/patients/me/surgeries", json=TEST_SURGERY_DATA, headers=self.headers)
        
        # Get summary
        response = client.get("/api/v1/patients/me/summary", headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "patient" in data
        assert "allergies" in data
        assert "illnesses" in data
        assert "surgeries" in data
        assert "statistics" in data
        
        # Verify statistics
        stats = data["statistics"]
        assert stats["total_allergies"] >= 1
        assert stats["critical_allergies"] >= 1
        assert stats["chronic_illnesses"] >= 1
        assert stats["total_surgeries"] >= 1


class TestQRCodeGeneration:
    """Test QR code generation and emergency access"""
    
    @pytest.fixture(autouse=True)
    def setup_patient_with_medical_data(self):
        """Setup patient with complete medical data"""
        # Register and login
        client.post("/api/v1/auth/register/patient", json=TEST_PATIENT_DATA)
        login_response = client.post("/api/v1/auth/login", json={
            "email": TEST_PATIENT_DATA["email"],
            "password": TEST_PATIENT_DATA["password"]
        })
        
        self.token = login_response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Add medical data
        client.post("/api/v1/patients/me/allergies", json=TEST_ALLERGY_DATA, headers=self.headers)
        client.post("/api/v1/patients/me/illnesses", json=TEST_ILLNESS_DATA, headers=self.headers)
        client.post("/api/v1/patients/me/surgeries", json=TEST_SURGERY_DATA, headers=self.headers)
    
    def test_generate_qr_code(self):
        """Test QR code generation for patient"""
        response = client.post("/api/v1/qr/generate", json={}, headers=self.headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "qr_token" in data
        assert "qr_image" in data
        assert "access_url" in data
        assert data["qr_image"].startswith("data:image/png;base64,")
        assert "vitalgo.app" in data["access_url"]
    
    def test_qr_emergency_page_access(self):
        """Test accessing QR emergency page"""
        # Generate QR first
        qr_response = client.post("/api/v1/qr/generate", json={}, headers=self.headers)
        qr_token = qr_response.json()["qr_token"]
        
        # Access emergency page
        response = client.get(f"/api/v1/qr/emergency/{qr_token}")
        
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
        assert "VitalGo - Acceso de Emergencia" in response.text
    
    def test_unauthorized_qr_generation(self):
        """Test that non-patients cannot generate QR codes"""
        # This would require a paramedic token, but for now just test without auth
        response = client.post("/api/v1/qr/generate", json={})
        
        assert response.status_code == 401


class TestEndToEndFlow:
    """Test complete end-to-end patient journey"""
    
    def test_complete_patient_journey(self):
        """Test the complete patient journey from registration to QR access"""
        
        # 1. Register patient
        registration_response = client.post("/api/v1/auth/register/patient", json=TEST_PATIENT_DATA)
        assert registration_response.status_code == 200
        
        # 2. Login
        login_response = client.post("/api/v1/auth/login", json={
            "email": TEST_PATIENT_DATA["email"],
            "password": TEST_PATIENT_DATA["password"]
        })
        assert login_response.status_code == 200
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 3. Add medical data
        allergy_response = client.post("/api/v1/patients/me/allergies", json=TEST_ALLERGY_DATA, headers=headers)
        assert allergy_response.status_code == 200
        
        illness_response = client.post("/api/v1/patients/me/illnesses", json=TEST_ILLNESS_DATA, headers=headers)
        assert illness_response.status_code == 200
        
        surgery_response = client.post("/api/v1/patients/me/surgeries", json=TEST_SURGERY_DATA, headers=headers)
        assert surgery_response.status_code == 200
        
        # 4. Get medical summary
        summary_response = client.get("/api/v1/patients/me/summary", headers=headers)
        assert summary_response.status_code == 200
        
        summary_data = summary_response.json()
        assert len(summary_data["allergies"]) >= 1
        assert len(summary_data["illnesses"]) >= 1
        assert len(summary_data["surgeries"]) >= 1
        
        # 5. Generate QR code
        qr_response = client.post("/api/v1/qr/generate", json={}, headers=headers)
        assert qr_response.status_code == 200
        
        qr_data = qr_response.json()
        assert "qr_token" in qr_data
        assert "qr_image" in qr_data
        
        # 6. Access emergency page
        emergency_response = client.get(f"/api/v1/qr/emergency/{qr_data['qr_token']}")
        assert emergency_response.status_code == 200
        
        print("✅ Complete patient journey test passed successfully!")
        print(f"   - Patient registered: {TEST_PATIENT_DATA['first_name']} {TEST_PATIENT_DATA['last_name']}")
        print(f"   - Medical records added: {len(summary_data['allergies'])} allergies, {len(summary_data['illnesses'])} illnesses, {len(summary_data['surgeries'])} surgeries")
        print(f"   - QR code generated: {qr_data['access_url']}")


if __name__ == "__main__":
    # Run a quick integration test
    test_flow = TestEndToEndFlow()
    test_flow.test_complete_patient_journey()