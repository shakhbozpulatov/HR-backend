import { Injectable, Logger, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios, { AxiosInstance } from 'axios';
import {
  HcTokenRequest,
  HcTokenResponse,
  HcTokenData,
  HcApiResponse,
} from '../interfaces/hc-api.interface';

/**
 * HC Authentication Service
 * Handles token management for HC API authentication
 * - Fetches access token from HC API
 * - Caches token in memory
 * - Auto-refreshes token before expiration
 * - Proactively refreshes token every 6 hours if less than 24 hours remain
 */
@Injectable()
export class HcAuthService implements OnModuleInit {
  private readonly logger = new Logger(HcAuthService.name);
  private tokenData: HcTokenData | null = null;
  private readonly axiosInstance: AxiosInstance;
  private readonly TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry
  private readonly PROACTIVE_REFRESH_THRESHOLD = 24 * 60 * 60 * 1000; // Refresh if less than 24 hours remain

  constructor() {
    const baseUrl = process.env.HC_API_URL || '';

    this.axiosInstance = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log('HC Auth Service initialized', { baseUrl });
  }

  /**
   * Get valid access token
   * Returns cached token if valid, otherwise fetches new one
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.isTokenValid()) {
      this.logger.debug('Using cached HC access token');
      return this.tokenData!.token;
    }

    // Fetch new token
    this.logger.log('Fetching new HC access token');
    await this.fetchNewToken();

    return this.tokenData!.token;
  }

  /**
   * Check if current token is valid
   */
  private isTokenValid(): boolean {
    if (!this.tokenData) {
      return false;
    }

    const now = Date.now();
    const expiresWithBuffer =
      this.tokenData.expiresAt - this.TOKEN_REFRESH_BUFFER;

    const isValid = now < expiresWithBuffer;

    if (!isValid) {
      this.logger.warn('HC access token expired or about to expire', {
        expiresAt: new Date(this.tokenData.expiresAt).toISOString(),
        now: new Date(now).toISOString(),
      });
    }

    return isValid;
  }

  /**
   * Fetch new access token from HC API
   */
  private async fetchNewToken(): Promise<void> {
    const appKey = process.env.HC_APP_KEY;
    const secretKey = process.env.HC_SECRET_KEY;

    if (!appKey || !secretKey) {
      throw new HttpException(
        'HC_APP_KEY and HC_SECRET_KEY environment variables are required',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const requestData: HcTokenRequest = {
      appKey,
      secretKey,
    };

    try {
      this.logger.log('Requesting new token from HC API');

      const response = await this.axiosInstance.post<
        HcApiResponse<HcTokenResponse>
      >('/platform/v1/token/get', requestData);

      // Validate response
      if (response.data.errorCode !== '0' && response.data.errorCode !== 0) {
        throw new HttpException(
          {
            message: 'Failed to get HC access token',
            error: response.data.message,
            errorCode: response.data.errorCode,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const tokenResponse = response.data.data!;

      // Convert expireTime from seconds to milliseconds
      const expiresAt = tokenResponse.expireTime * 1000;

      this.tokenData = {
        token: tokenResponse.accessToken,
        expiresAt,
        userId: tokenResponse.userId,
        areaDomain: tokenResponse.areaDomain,
      };

      this.logger.log('Successfully fetched new HC access token', {
        userId: this.tokenData.userId,
        expiresAt: new Date(expiresAt).toISOString(),
        areaDomain: this.tokenData.areaDomain,
      });
    } catch (error) {
      this.logger.error('Failed to fetch HC access token', {
        error: error.message,
        response: error.response?.data,
      });

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          message: 'Failed to authenticate with HC system',
          error: error.message,
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Force token refresh
   * Useful for testing or manual token refresh
   */
  async refreshToken(): Promise<void> {
    this.logger.log('Manually refreshing HC access token');
    this.tokenData = null;
    await this.fetchNewToken();
  }

  /**
   * Get token data (for debugging/monitoring)
   */
  getTokenInfo(): { isValid: boolean; expiresAt?: string; userId?: string } {
    if (!this.tokenData) {
      return { isValid: false };
    }

    return {
      isValid: this.isTokenValid(),
      expiresAt: new Date(this.tokenData.expiresAt).toISOString(),
      userId: this.tokenData.userId,
    };
  }

  /**
   * Clear cached token
   */
  clearToken(): void {
    this.logger.log('Clearing cached HC access token');
    this.tokenData = null;
  }

  /**
   * Initialize token on module startup
   */
  async onModuleInit() {
    this.logger.log('Initializing HC Auth Service - fetching initial token');
    try {
      await this.getAccessToken();
      this.logger.log('Initial HC token fetched successfully');
    } catch (error) {
      this.logger.error('Failed to fetch initial HC token', {
        error: error.message,
      });
    }
  }

  /**
   * Proactive token refresh cron job
   * Runs every 6 hours to check if token needs refreshing
   * Refreshes if less than 24 hours remain until expiration
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async handleProactiveTokenRefresh() {
    this.logger.debug('Running proactive token refresh check');

    if (!this.tokenData) {
      this.logger.warn('No token data available, fetching new token');
      try {
        await this.getAccessToken();
      } catch (error) {
        this.logger.error('Failed to fetch token during proactive refresh', {
          error: error.message,
        });
      }
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = this.tokenData.expiresAt - now;
    const hoursUntilExpiry = timeUntilExpiry / (60 * 60 * 1000);

    this.logger.debug('Token status check', {
      expiresAt: new Date(this.tokenData.expiresAt).toISOString(),
      hoursUntilExpiry: hoursUntilExpiry.toFixed(2),
      willRefresh: timeUntilExpiry < this.PROACTIVE_REFRESH_THRESHOLD,
    });

    // Refresh if less than 24 hours remain
    if (timeUntilExpiry < this.PROACTIVE_REFRESH_THRESHOLD) {
      this.logger.log(
        `🔄 Proactively refreshing HC token (${hoursUntilExpiry.toFixed(2)} hours remaining)`,
      );
      try {
        await this.refreshToken();
        this.logger.log('✅ HC token successfully refreshed proactively');
      } catch (error) {
        this.logger.error('❌ Failed to proactively refresh HC token', {
          error: error.message,
        });
      }
    } else {
      this.logger.debug(
        `Token still valid (${hoursUntilExpiry.toFixed(2)} hours remaining)`,
      );
    }
  }
}
