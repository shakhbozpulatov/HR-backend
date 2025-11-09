import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HcApiConfig } from '../config/hc-api.config';
import {
  HcApiResponse,
  HcApiRequestOptions,
} from '../interfaces/hc-api.interface';

/**
 * HC API HTTP Client
 * Single Responsibility: Handle HTTP communication with HC API
 * Open/Closed: Easy to extend with new methods, no need to modify existing code
 */
@Injectable()
export class HcApiClient {
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly config: HcApiConfig) {
    this.axiosInstance = axios.create({
      baseURL: this.config.getBaseUrl(),
      timeout: this.config.getDefaultTimeout(),
      headers: this.config.getHeaders(),
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors for logging
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log('🔄 HC API Request:', {
          url: config.url,
          method: config.method?.toUpperCase(),
          data: config.data,
        });
        return config;
      },
      (error) => {
        console.error('❌ HC API Request Error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log('📥 HC API Response:', {
          status: response.status,
          data: response.data,
        });
        return response;
      },
      (error) => {
        console.error('❌ HC API Response Error:', error.response?.data);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Generic POST request to HC API
   * @param options - Request options
   * @returns HC API response
   */
  async post<T = any>(
    options: HcApiRequestOptions,
  ): Promise<HcApiResponse<T>> {
    try {
      const requestConfig: AxiosRequestConfig = {
        timeout: options.timeout || this.config.getDefaultTimeout(),
      };

      const response = await this.axiosInstance.post(
        options.endpoint,
        options.data,
        requestConfig,
      );

      // Validate HC API response
      return this.validateResponse<T>(response.data);
    } catch (error) {
      throw this.handleError(error, options);
    }
  }

  /**
   * Generic GET request to HC API
   */
  async get<T = any>(
    endpoint: string,
    params?: any,
  ): Promise<HcApiResponse<T>> {
    try {
      const response = await this.axiosInstance.get(endpoint, { params });
      return this.validateResponse<T>(response.data);
    } catch (error) {
      throw this.handleError(error, { endpoint, data: params });
    }
  }

  /**
   * Validate HC API response
   * HC API always returns 200, but errorCode determines success/failure
   */
  private validateResponse<T>(
    responseData: HcApiResponse<T>,
  ): HcApiResponse<T> {
    const { errorCode, message } = responseData;

    // Check if errorCode is success (0 or "0")
    if (errorCode !== '0' && errorCode !== 0) {
      console.error('❌ HC API Error (errorCode not 0):', {
        errorCode,
        message,
        fullResponse: responseData,
      });

      throw new HttpException(
        {
          message: 'HC API returned an error',
          error: message || 'Unknown error from HC system',
          errorCode,
          details: responseData,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    console.log('✅ HC API Success (errorCode: 0):', {
      data: responseData.data,
    });

    return responseData;
  }

  /**
   * Handle errors from HC API
   */
  private handleError(
    error: any,
    options: HcApiRequestOptions,
  ): HttpException {
    // If it's already an HttpException (from validateResponse), re-throw
    if (error instanceof HttpException) {
      return error;
    }

    // Handle network/axios errors
    const errorDetails = {
      message: error.message,
      endpoint: options.endpoint,
      requestData: options.data,
      responseStatus: error.response?.status,
      responseData: error.response?.data,
    };

    console.error('❌ HC API Error Details:', JSON.stringify(errorDetails, null, 2));

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unknown error occurred';

    return new HttpException(
      {
        message: 'Failed to communicate with HC system',
        error: errorMessage,
        details: error.response?.data,
      },
      error.response?.status || HttpStatus.BAD_GATEWAY,
    );
  }
}