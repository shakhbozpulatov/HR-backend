import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
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
  private readonly logger = new Logger(HcApiClient.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly MAX_TOKEN_RETRY_ATTEMPTS = 1; // Only retry once to avoid infinite loops
  private readonly MAX_RETRY_ATTEMPTS = 3; // Retry for network errors
  private readonly RETRY_DELAY_MS = 1000; // Base delay between retries

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
   * Generic POST request to HC API with retry logic
   * @param options - Request options
   * @returns HC API response
   */
  async post<T = any>(options: HcApiRequestOptions): Promise<HcApiResponse<T>> {
    return this.executeWithRetry(async () => {
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
    }, options);
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
   * Execute request with retry logic for network errors
   */
  private async executeWithRetry<T>(
    fn: () => Promise<HcApiResponse<T>>,
    options: HcApiRequestOptions,
  ): Promise<HcApiResponse<T>> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        // Don't retry if it's an HttpException (business logic error)
        if (error instanceof HttpException) {
          throw error;
        }

        // Check if it's a network error that we should retry
        const isNetworkError = this.isRetryableNetworkError(error);

        if (!isNetworkError) {
          // Not a network error, throw immediately
          throw this.handleError(error, options);
        }

        // Network error - check if we should retry
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
          this.logger.warn(
            `⚠️ Network error on attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS} for ${options.endpoint}. Retrying in ${delay}ms... Error: ${error.message}`,
          );
          await this.sleep(delay);
        } else {
          this.logger.error(
            `❌ Failed after ${this.MAX_RETRY_ATTEMPTS} attempts for ${options.endpoint}. Error: ${error.message}`,
          );
          throw this.handleError(error, options);
        }
      }
    }

    throw this.handleError(lastError, options);
  }

  /**
   * Check if error is a retryable network error
   */
  private isRetryableNetworkError(error: any): boolean {
    // Check for common network errors
    const networkErrorCodes = [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'ENETUNREACH',
      'EAI_AGAIN',
    ];

    // Check error code
    if (error.code && networkErrorCodes.includes(error.code)) {
      return true;
    }

    // Check if axios error with network-related status
    if (error.response) {
      const status = error.response.status;
      // Retry on 5xx errors (server errors) and 408 (timeout)
      return status >= 500 || status === 408;
    }

    // Check if it's a timeout error
    if (error.message && error.message.toLowerCase().includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * Sleep helper for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      code: error.code,
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
