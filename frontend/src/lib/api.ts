const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

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
  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    this.saveToken(response.access_token)
    return response
  }

  async registerPatient(data: any) {
    return await this.request<{ access_token: string; user: any }>('/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async registerParamedic(data: any) {
    return await this.request<{ message: string }>('/auth/register/paramedic', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async logout() {
    this.clearToken()
  }

  // Patient Medical Data
  async getPatientProfile() {
    return await this.request<any>('/patients/profile')
  }

  async updatePatientProfile(data: any) {
    return await this.request<any>('/patients/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Allergies
  async getAllergies() {
    return await this.request<any[]>('/patients/allergies')
  }

  async createAllergy(data: any) {
    return await this.request<any>('/patients/allergies', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAllergy(id: string, data: any) {
    return await this.request<any>(`/patients/allergies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAllergy(id: string) {
    return await this.request<void>(`/patients/allergies/${id}`, {
      method: 'DELETE',
    })
  }

  // Illnesses
  async getIllnesses() {
    return await this.request<any[]>('/patients/illnesses')
  }

  async createIllness(data: any) {
    return await this.request<any>('/patients/illnesses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateIllness(id: string, data: any) {
    return await this.request<any>(`/patients/illnesses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteIllness(id: string) {
    return await this.request<void>(`/patients/illnesses/${id}`, {
      method: 'DELETE',
    })
  }

  // Surgeries
  async getSurgeries() {
    return await this.request<any[]>('/patients/surgeries')
  }

  async createSurgery(data: any) {
    return await this.request<any>('/patients/surgeries', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSurgery(id: string, data: any) {
    return await this.request<any>(`/patients/surgeries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteSurgery(id: string) {
    return await this.request<void>(`/patients/surgeries/${id}`, {
      method: 'DELETE',
    })
  }

  // QR Code
  async generateQR() {
    return await this.request<{ qr_code: string; qr_url: string }>('/patients/qr/generate')
  }

  async getQR() {
    return await this.request<{ qr_code: string; qr_url: string }>('/patients/qr')
  }

  // Emergency Access
  async getEmergencyData(qrCode: string) {
    return await this.request<any>(`/emergency/${qrCode}`)
  }

  // Paramedic
  async getPatientByQR(qrCode: string) {
    return await this.request<any>(`/paramedic/patient/${qrCode}`)
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