"""
Command and Query Handlers for Patient operations

Handlers implement the application logic and coordinate between
domain entities and infrastructure services.
"""

from typing import Optional

from ...domain.entities import User, Patient, Allergy, Illness, Surgery
from ...domain.repositories import (
    UserRepository, PatientRepository, AllergyRepository, 
    IllnessRepository, SurgeryRepository
)
from ...domain.value_objects import UUID, Email

from ..commands import (
    CreateUserCommand, UpdateUserCommand, ChangePasswordCommand,
    CreatePatientCommand, UpdatePatientCommand,
    AddAllergyCommand, UpdateAllergyCommand, RecordAllergyReactionCommand,
    AddIllnessCommand, UpdateIllnessCommand, UpdateIllnessStatusCommand,
    AddSurgeryCommand, UpdateSurgeryCommand, AddSurgeryComplicationCommand
)
from ..queries import (
    GetUserByIdQuery, GetUserByEmailQuery, ValidateUserCredentialsQuery,
    GetPatientByIdQuery, GetPatientByUserIdQuery, GetPatientByDocumentQuery,
    GetPatientMedicalSummaryQuery, GetPatientEmergencyInfoQuery,
    GetPatientAllergiesQuery, GetPatientIllnessesQuery, GetPatientSurgeriesQuery,
    UserDTO, PatientDTO, MedicalSummaryDTO, EmergencyInfoDTO
)


class PatientCommandHandlers:
    """Handlers for patient-related commands"""
    
    def __init__(self, 
                 user_repo: UserRepository,
                 patient_repo: PatientRepository,
                 allergy_repo: AllergyRepository,
                 illness_repo: IllnessRepository,
                 surgery_repo: SurgeryRepository):
        self.user_repo = user_repo
        self.patient_repo = patient_repo
        self.allergy_repo = allergy_repo
        self.illness_repo = illness_repo
        self.surgery_repo = surgery_repo
    
    async def handle_create_user(self, command: CreateUserCommand) -> UserDTO:
        """Handle user creation"""
        # Check if email already exists
        existing_user = await self.user_repo.get_by_email(Email(command.email))
        if existing_user:
            raise ValueError("Email already registered")
        
        # Create new user
        user = User.create(
            email=command.email,
            password=command.password,
            first_name=command.first_name,
            last_name=command.last_name,
            phone=command.phone,
            role=command.role
        )
        
        saved_user = await self.user_repo.create(user)
        return self._user_to_dto(saved_user)
    
    async def handle_update_user(self, command: UpdateUserCommand) -> UserDTO:
        """Handle user profile update"""
        user = await self.user_repo.get_by_id(UUID(command.user_id))
        if not user:
            raise ValueError("User not found")
        
        user.update_profile(
            first_name=command.first_name,
            last_name=command.last_name,
            phone=command.phone
        )
        
        updated_user = await self.user_repo.update(user)
        return self._user_to_dto(updated_user)
    
    async def handle_change_password(self, command: ChangePasswordCommand) -> bool:
        """Handle password change"""
        user = await self.user_repo.get_by_id(UUID(command.user_id))
        if not user:
            raise ValueError("User not found")
        
        if not user.verify_password(command.old_password):
            raise ValueError("Invalid current password")
        
        user.change_password(command.new_password)
        await self.user_repo.update(user)
        return True
    
    async def handle_create_patient(self, command: CreatePatientCommand) -> PatientDTO:
        """Handle patient creation"""
        # Check if document already exists
        existing_patient = await self.patient_repo.get_by_document(
            command.document_type, command.document_number
        )
        if existing_patient:
            raise ValueError("Patient with this document already exists")
        
        # Get user
        user = await self.user_repo.get_by_id(UUID(command.user_id))
        if not user:
            raise ValueError("User not found")
        
        # Create patient
        patient = Patient.create(
            user_id=UUID(command.user_id),
            document_type=command.document_type,
            document_number=command.document_number,
            birth_date=command.birth_date,
            gender=command.gender,
            blood_type=command.blood_type,
            eps=command.eps,
            emergency_contact_name=command.emergency_contact_name,
            emergency_contact_phone=command.emergency_contact_phone,
            address=command.address,
            city=command.city
        )
        
        saved_patient = await self.patient_repo.create(patient)
        return await self._patient_to_dto(saved_patient)
    
    async def handle_update_patient(self, command: UpdatePatientCommand) -> PatientDTO:
        """Handle patient information update"""
        patient = await self.patient_repo.get_by_id(UUID(command.patient_id))
        if not patient:
            raise ValueError("Patient not found")
        
        if command.blood_type or command.eps:
            patient.update_medical_info(
                blood_type=command.blood_type,
                eps=command.eps
            )
        
        if any([command.address, command.city, command.emergency_contact_name, command.emergency_contact_phone]):
            patient.update_contact_info(
                address=command.address,
                city=command.city,
                emergency_contact_name=command.emergency_contact_name,
                emergency_contact_phone=command.emergency_contact_phone
            )
        
        updated_patient = await self.patient_repo.update(patient)
        return await self._patient_to_dto(updated_patient)
    
    # Allergy Handlers
    async def handle_add_allergy(self, command: AddAllergyCommand) -> dict:
        """Handle adding allergy to patient"""
        patient = await self.patient_repo.get_by_id(UUID(command.patient_id))
        if not patient:
            raise ValueError("Patient not found")
        
        allergy = Allergy.create(
            patient_id=UUID(command.patient_id),
            allergen=command.allergen,
            severity=command.severity,
            symptoms=command.symptoms,
            treatment=command.treatment,
            diagnosed_date=command.diagnosed_date,
            notes=command.notes
        )
        
        saved_allergy = await self.allergy_repo.create(allergy)
        patient.add_allergy(saved_allergy.id)
        await self.patient_repo.update(patient)
        
        return saved_allergy.to_dict()
    
    async def handle_update_allergy(self, command: UpdateAllergyCommand) -> dict:
        """Handle allergy update"""
        allergy = await self.allergy_repo.get_by_id(UUID(command.allergy_id))
        if not allergy:
            raise ValueError("Allergy not found")
        
        if command.severity:
            allergy.update_severity(command.severity)
        if command.symptoms:
            allergy.update_symptoms(command.symptoms)
        if command.treatment is not None:
            allergy.update_treatment(command.treatment)
        if command.notes is not None:
            allergy.update_notes(command.notes)
        
        updated_allergy = await self.allergy_repo.update(allergy)
        return updated_allergy.to_dict()
    
    # Illness Handlers
    async def handle_add_illness(self, command: AddIllnessCommand) -> dict:
        """Handle adding illness to patient"""
        patient = await self.patient_repo.get_by_id(UUID(command.patient_id))
        if not patient:
            raise ValueError("Patient not found")
        
        illness = Illness.create(
            patient_id=UUID(command.patient_id),
            name=command.name,
            diagnosed_date=command.diagnosed_date,
            cie10_code=command.cie10_code,
            symptoms=command.symptoms,
            treatment=command.treatment,
            prescribed_by=command.prescribed_by,
            notes=command.notes,
            is_chronic=command.is_chronic
        )
        
        saved_illness = await self.illness_repo.create(illness)
        patient.add_illness(saved_illness.id)
        await self.patient_repo.update(patient)
        
        return saved_illness.to_dict()
    
    async def handle_update_illness(self, command: UpdateIllnessCommand) -> dict:
        """Handle illness update"""
        illness = await self.illness_repo.get_by_id(UUID(command.illness_id))
        if not illness:
            raise ValueError("Illness not found")
        
        if command.symptoms:
            illness.update_symptoms(command.symptoms)
        if command.treatment and command.prescribed_by:
            illness.update_treatment(command.treatment, command.prescribed_by)
        if command.notes is not None:
            illness.update_notes(command.notes)
        if command.cie10_code:
            illness.update_cie10_code(command.cie10_code)
        
        updated_illness = await self.illness_repo.update(illness)
        return updated_illness.to_dict()
    
    async def handle_update_illness_status(self, command: UpdateIllnessStatusCommand) -> dict:
        """Handle illness status update"""
        illness = await self.illness_repo.get_by_id(UUID(command.illness_id))
        if not illness:
            raise ValueError("Illness not found")
        
        illness.update_status(command.status)
        updated_illness = await self.illness_repo.update(illness)
        return updated_illness.to_dict()
    
    # Surgery Handlers
    async def handle_add_surgery(self, command: AddSurgeryCommand) -> dict:
        """Handle adding surgery to patient"""
        patient = await self.patient_repo.get_by_id(UUID(command.patient_id))
        if not patient:
            raise ValueError("Patient not found")
        
        surgery = Surgery.create(
            patient_id=UUID(command.patient_id),
            name=command.name,
            surgery_date=command.surgery_date,
            surgeon=command.surgeon,
            hospital=command.hospital,
            description=command.description,
            diagnosis=command.diagnosis,
            anesthesia_type=command.anesthesia_type,
            surgery_duration_minutes=command.surgery_duration_minutes,
            notes=command.notes
        )
        
        saved_surgery = await self.surgery_repo.create(surgery)
        patient.add_surgery(saved_surgery.id)
        await self.patient_repo.update(patient)
        
        return saved_surgery.to_dict()
    
    async def handle_update_surgery(self, command: UpdateSurgeryCommand) -> dict:
        """Handle surgery update"""
        surgery = await self.surgery_repo.get_by_id(UUID(command.surgery_id))
        if not surgery:
            raise ValueError("Surgery not found")
        
        surgery.update_details(
            description=command.description,
            diagnosis=command.diagnosis,
            anesthesia_type=command.anesthesia_type,
            surgery_duration_minutes=command.surgery_duration_minutes
        )
        
        if command.notes is not None:
            surgery.update_notes(command.notes)
        
        updated_surgery = await self.surgery_repo.update(surgery)
        return updated_surgery.to_dict()
    
    # Helper methods
    def _user_to_dto(self, user: User) -> UserDTO:
        """Convert User entity to DTO"""
        return UserDTO(
            id=str(user.id),
            email=str(user.email),
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at.isoformat()
        )
    
    async def _patient_to_dto(self, patient: Patient) -> PatientDTO:
        """Convert Patient entity to DTO"""
        user = await self.user_repo.get_by_id(patient.user_id)
        
        return PatientDTO(
            id=str(patient.id),
            user=self._user_to_dto(user),
            document_type=patient.document_type.value,
            document_number=patient.document_number,
            birth_date=patient.birth_date.isoformat(),
            age=patient.get_age(),
            gender=patient.gender,
            blood_type=patient.blood_type.value,
            eps=str(patient.eps),
            emergency_contact_name=patient.emergency_contact_name,
            emergency_contact_phone=patient.emergency_contact_phone,
            address=patient.address,
            city=patient.city
        )


class PatientQueryHandlers:
    """Handlers for patient-related queries"""
    
    def __init__(self,
                 user_repo: UserRepository,
                 patient_repo: PatientRepository,
                 allergy_repo: AllergyRepository,
                 illness_repo: IllnessRepository,
                 surgery_repo: SurgeryRepository):
        self.user_repo = user_repo
        self.patient_repo = patient_repo
        self.allergy_repo = allergy_repo
        self.illness_repo = illness_repo
        self.surgery_repo = surgery_repo
    
    async def handle_get_user_by_id(self, query: GetUserByIdQuery) -> Optional[UserDTO]:
        """Handle get user by ID query"""
        user = await self.user_repo.get_by_id(UUID(query.user_id))
        if not user:
            return None
        
        return UserDTO(
            id=str(user.id),
            email=str(user.email),
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at.isoformat()
        )
    
    async def handle_validate_credentials(self, query: ValidateUserCredentialsQuery) -> Optional[UserDTO]:
        """Handle credential validation query"""
        user = await self.user_repo.get_by_email(Email(query.email))
        if not user or not user.verify_password(query.password):
            return None
        
        return UserDTO(
            id=str(user.id),
            email=str(user.email),
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            role=user.role,
            is_active=user.is_active,
            created_at=user.created_at.isoformat()
        )
    
    async def handle_get_patient_medical_summary(self, query: GetPatientMedicalSummaryQuery) -> Optional[MedicalSummaryDTO]:
        """Handle get complete medical summary query"""
        patient = await self.patient_repo.get_by_id(UUID(query.patient_id))
        if not patient:
            return None
        
        user = await self.user_repo.get_by_id(patient.user_id)
        
        # Get medical records
        allergies = await self.allergy_repo.get_by_patient_id(patient.id)
        illnesses = await self.illness_repo.get_by_patient_id(patient.id)
        surgeries = await self.surgery_repo.get_by_patient_id(patient.id)
        
        # Filter active records if requested
        if not query.include_inactive:
            allergies = [a for a in allergies if a.is_active]
            illnesses = [i for i in illnesses if i.is_active()]
        
        # Build statistics
        statistics = {
            'total_allergies': len(allergies),
            'critical_allergies': len([a for a in allergies if a.is_critical()]),
            'total_illnesses': len(illnesses),
            'chronic_illnesses': len([i for i in illnesses if i.is_chronic]),
            'total_surgeries': len(surgeries),
            'recent_surgeries': len([s for s in surgeries if s.is_recent()])
        }
        
        return MedicalSummaryDTO(
            patient=PatientDTO(
                id=str(patient.id),
                user=UserDTO(
                    id=str(user.id),
                    email=str(user.email),
                    first_name=user.first_name,
                    last_name=user.last_name,
                    phone=user.phone,
                    role=user.role,
                    is_active=user.is_active,
                    created_at=user.created_at.isoformat()
                ),
                document_type=patient.document_type.value,
                document_number=patient.document_number,
                birth_date=patient.birth_date.isoformat(),
                age=patient.get_age(),
                gender=patient.gender,
                blood_type=patient.blood_type.value,
                eps=str(patient.eps),
                emergency_contact_name=patient.emergency_contact_name,
                emergency_contact_phone=patient.emergency_contact_phone,
                address=patient.address,
                city=patient.city
            ),
            allergies=[a.to_dict() for a in allergies],
            illnesses=[i.to_dict() for i in illnesses],
            surgeries=[s.to_dict() for s in surgeries],
            statistics=statistics,
            last_updated=patient.updated_at.isoformat()
        )