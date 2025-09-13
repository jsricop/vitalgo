const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// TypeScript interfaces for API data structures
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: 'patient' | 'paramedic' | 'admin'
  is_active: boolean
  created_at: string
}

export interface Patient {
  id: string
  user_id: string
  document_type: string
  document_number: string
  birth_date: string
  gender: 'M' | 'F'
  blood_type: string
  eps: string
  emergency_contact_name: string
  emergency_contact_phone: string
  address?: string
  city?: string
  created_at: string
  updated_at: string
}

export interface Paramedic {
  id: string
  user_id: string
  medical_license: string
  specialty: string
  institution: string
  years_experience: number
  license_expiry_date: string
  is_approved: boolean
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface Allergy {
  id: string
  patient_id: string
  allergen: string
  severity: 'MILD' | 'MODERATE' | 'SEVERE'
  symptoms?: string
  diagnosed_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Illness {
  id: string
  patient_id: string
  name: string
  diagnosis_date?: string
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC'
  treatment?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Surgery {
  id: string
  patient_id: string
  procedure_name: string
  date: string
  surgeon?: string
  hospital?: string
  complications?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface QRCodeResponse {
  qr_code: string
  qr_url: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
  role: string
  expires_in: number
}

export interface PatientRegistrationData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  document_type: string
  document_number: string
  birth_date: string
  gender: 'M' | 'F'
  blood_type: string
  eps: string
  emergency_contact_name: string
  emergency_contact_phone: string
  address?: string
  city?: string
}

export interface ParamedicRegistrationData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  medical_license: string
  specialty: string
  institution: string
  years_experience: number
  license_expiry_date: string
}

export interface PatientProfile {
  user: User
  patient: Patient
  allergies: Allergy[]
  illnesses: Illness[]
  surgeries: Surgery[]
}

export interface EmergencyData {
  patient: Patient
  user: User
  allergies: Allergy[]
  illnesses: Illness[]
  surgeries: Surgery[]
  emergency_contact: {
    name: string
    phone: string
  }
}

export interface AllergyInput {
  allergen: string
  severity: 'MILD' | 'MODERATE' | 'SEVERE'
  symptoms?: string
  diagnosed_date?: string
  notes?: string
}

export interface IllnessInput {
  name: string
  diagnosis_date?: string
  status: 'ACTIVE' | 'RESOLVED' | 'CHRONIC'
  treatment?: string
  notes?: string
}

export interface SurgeryInput {
  procedure_name: string
  date: string
  surgeon?: string
  hospital?: string
  complications?: string
  notes?: string
}

export interface ApiError {
  message: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    this.loadToken()
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken')
    }
  }

  private saveToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token)
    }
    this.token = token
  }

  private clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken')
    }
    this.token = null
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken()
          throw new Error('No autorizado')
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error de red')
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    this.saveToken(response.access_token)
    return response
  }

  async registerPatient(data: PatientRegistrationData): Promise<{ message: string; user: User; patient: Patient }> {
    return await this.request<{ message: string; user: User; patient: Patient }>('/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async registerParamedic(data: ParamedicRegistrationData): Promise<{ message: string; user: User; status: string }> {
    return await this.request<{ message: string; user: User; status: string }>('/auth/register/paramedic', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async logout(): Promise<void> {
    this.clearToken()
  }

  // Patient Medical Data
  async getPatientProfile(): Promise<PatientProfile> {
    return await this.request<PatientProfile>('/patients/profile')
  }

  async updatePatientProfile(data: Partial<Patient>): Promise<Patient> {
    return await this.request<Patient>('/patients/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Allergies
  async getAllergies(): Promise<Allergy[]> {
    return await this.request<Allergy[]>('/patients/allergies')
  }

  async createAllergy(data: AllergyInput): Promise<Allergy> {
    return await this.request<Allergy>('/patients/allergies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAllergy(id: string, data: Partial<AllergyInput>): Promise<Allergy> {
    return await this.request<Allergy>(`/patients/allergies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAllergy(id: string): Promise<void> {
    return await this.request<void>(`/patients/allergies/${id}`, {
      method: 'DELETE',
    })
  }

  // Illnesses
  async getIllnesses(): Promise<Illness[]> {
    return await this.request<Illness[]>('/patients/illnesses')
  }

  async createIllness(data: IllnessInput): Promise<Illness> {
    return await this.request<Illness>('/patients/illnesses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateIllness(id: string, data: Partial<IllnessInput>): Promise<Illness> {
    return await this.request<Illness>(`/patients/illnesses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteIllness(id: string): Promise<void> {
    return await this.request<void>(`/patients/illnesses/${id}`, {
      method: 'DELETE',
    })
  }

  // Surgeries
  async getSurgeries(): Promise<Surgery[]> {
    return await this.request<Surgery[]>('/patients/surgeries')
  }

  async createSurgery(data: SurgeryInput): Promise<Surgery> {
    return await this.request<Surgery>('/patients/surgeries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSurgery(id: string, data: Partial<SurgeryInput>): Promise<Surgery> {
    return await this.request<Surgery>(`/patients/surgeries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSurgery(id: string): Promise<void> {
    return await this.request<void>(`/patients/surgeries/${id}`, {
      method: 'DELETE',
    })
  }

  // QR Code
  async generateQR(): Promise<QRCodeResponse> {
    return await this.request<QRCodeResponse>('/patients/qr/generate')
  }

  async getQR(): Promise<QRCodeResponse> {
    return await this.request<QRCodeResponse>('/patients/qr')
  }

  // Emergency Access
  async getEmergencyData(qrCode: string): Promise<EmergencyData> {
    return await this.request<EmergencyData>(`/emergency/${qrCode}`)
  }

  // Paramedic
  async getPatientByQR(qrCode: string): Promise<EmergencyData> {
    return await this.request<EmergencyData>(`/paramedic/patient/${qrCode}`)
  }

  // Utils
  isAuthenticated(): boolean {
    return !!this.token
  }

  getToken(): string | null {
    return this.token
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export default apiClient