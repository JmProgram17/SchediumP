import { AxiosRequestConfig } from 'axios'
import { ApiResponse, PaginatedResponse } from '@/types'
import { axiosClient, checkRateLimit } from './axios-client'

export abstract class BaseApiService {
  protected abstract baseUrl: string

  protected async get<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    if (!checkRateLimit(`GET-${this.baseUrl}${endpoint}`)) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    
    const response = await axiosClient.get<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      config
    )
    return response.data
  }

  protected async post<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    if (!checkRateLimit(`POST-${this.baseUrl}${endpoint}`)) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    
    const response = await axiosClient.post<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      config
    )
    return response.data
  }

  protected async put<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    if (!checkRateLimit(`PUT-${this.baseUrl}${endpoint}`)) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    
    const response = await axiosClient.put<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      config
    )
    return response.data
  }

  protected async patch<T, D = unknown>(
    endpoint: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    if (!checkRateLimit(`PATCH-${this.baseUrl}${endpoint}`)) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    
    const response = await axiosClient.patch<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      data,
      config
    )
    return response.data
  }

  protected async delete<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    if (!checkRateLimit(`DELETE-${this.baseUrl}${endpoint}`)) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }
    
    const response = await axiosClient.delete<ApiResponse<T>>(
      `${this.baseUrl}${endpoint}`,
      config
    )
    return response.data
  }

  protected async getPaginated<T>(
    endpoint: string,
    config?: AxiosRequestConfig
  ): Promise<PaginatedResponse<T>> {
    const response = await this.get<PaginatedResponse<T>>(endpoint, config)
    return response.data!
  }
}