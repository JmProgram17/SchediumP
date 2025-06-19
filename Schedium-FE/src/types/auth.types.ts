export interface User {
  user_id: number
  id?: number // For compatibility with tests
  username?: string // For compatibility with tests
  email: string
  first_name: string
  last_name: string
  document_number: string
  active: boolean
  is_active?: boolean // For compatibility with tests
  created_at: string
  updated_at: string
  role?: Role
  roles?: Role[] // For compatibility with tests
  role_id?: number
  last_login?: string
}

export interface Role {
  role_id: number
  name: string
  description?: string
  permissions?: Permission[]
}

export interface Permission {
  id: number
  name: string
  resource: string
  action: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}