import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { HcApiConfig } from '../config/hc-api.config';
import { HcAuthService } from './hc-auth.service';
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
  private readonly MAX_TOKEN_RETRY_ATTEMPTS = 1; // Only retry once to avoid infinite loops

  constructor(
    private readonly config: HcApiConfig,
    private readonly authService: HcAuthService,
  ) {
    this.axiosInstance = axios.create({
      baseURL: this.config.getBaseUrl(),
      timeout: this.config.getDefaultTimeout(),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request/response interceptors for logging and authentication
   */
  private setupInterceptors(): void {
    // Request interceptor - Add access token to headers
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Get fresh access token before each request
        const accessToken = await this.authService.getAccessToken();

        // Add token to headers
        config.headers.token = accessToken;

        console.log('🔄 HC API Request:', {
          url: config.url,
          method: config.method?.toUpperCase(),
          hasToken: !!accessToken,
          data: config.data,
        });
        return config;
      },
      (error) => {
        console.error('❌ HC API Request Error:', error);
        return Promise.reject(error);
      },
    );

    // Response interceptor - Handle token expiration errors
    this.axiosInstance.interceptors.response.use(
      async (response) => {
        console.log('📥 HC API Response:', {
          status: response.status,
          data: response.data,
        });

        // Check if response contains TOKEN_NOT_FOUND error (OPEN000006)
        const responseData = response.data;
        if (
          responseData.errorCode === 'OPEN000006' &&
          responseData.message?.includes('TOKEN_NOT_FOUND')
        ) {
          // Check retry count to prevent infinite loops
          const retryCount = (response.config as any)._retryCount || 0;

          if (retryCount >= this.MAX_TOKEN_RETRY_ATTEMPTS) {
            console.error(
              '❌ Max token retry attempts reached, failing request',
            );
            return Promise.reject(
              new HttpException(
                {
                  message: 'Authentication failed after token refresh',
                  error: responseData.message,
                  errorCode: responseData.errorCode,
                },
                HttpStatus.UNAUTHORIZED,
              ),
            );
          }

          console.warn(
            `⚠️ Token expired (OPEN000006), refreshing token... (Attempt ${retryCount + 1}/${this.MAX_TOKEN_RETRY_ATTEMPTS})`,
          );

          try {
            // Refresh the access token
            await this.authService.refreshToken();

            // Get new access token
            const accessToken = await this.authService.getAccessToken();

            // Update the original request with new token and increment retry count
            response.config.headers.token = accessToken;
            (response.config as any)._retryCount = retryCount + 1;

            console.log('🔄 Retrying request with new token...');

            // Retry the original request
            return this.axiosInstance.request(response.config);
          } catch (refreshError) {
            console.error('❌ Failed to refresh token:', refreshError);
            return Promise.reject(refreshError);
          }
        }

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
  async post<T = any>(options: HcApiRequestOptions): Promise<HcApiResponse<T>> {
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
  private handleError(error: any, options: HcApiRequestOptions): HttpException {
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

    console.error(
      '❌ HC API Error Details:',
      JSON.stringify(errorDetails, null, 2),
    );

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
