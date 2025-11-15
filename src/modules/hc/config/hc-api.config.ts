import { Injectable } from '@nestjs/common';

/**
 * HC API Configuration Service
 * Centralized configuration for HC API endpoints and settings
 */
@Injectable()
export class HcApiConfig {
  private readonly baseUrl: string;
  private readonly appKey: string;
  private readonly secretKey: string;

  constructor() {
    this.baseUrl = process.env.HC_API_URL || '';
    this.appKey = process.env.HC_APP_KEY || '';
    this.secretKey = process.env.HC_SECRET_KEY || '';
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getAppKey(): string {
    return this.appKey;
  }

  getSecretKey(): string {
    return this.secretKey;
  }

  getDefaultTimeout(): number {
    return 10000; // 10 seconds
  }

  /**
   * Get headers for HC API requests
   * Note: Token is managed by HcAuthService and injected by HcApiClient
   */
  getHeaders(accessToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers.token = accessToken;
    }

    return headers;
  }

  /**
   * HC API Endpoints
   */
  getEndpoints() {
    return {
      person: {
        add: '/person/v1/persons/add',
        update: '/person/v1/persons/update',
        delete: '/person/v1/persons/delete',
        get: '/person/v1/persons/get',
        list: '/person/v1/persons/list',
        'upload-photo': '/person/v1/persons/photo',
      },
      terminal: {
        bind: '/acspm/v1/accesslevel/person/add',
        unbind: '/terminal/v1/unbind',
      },
      mq: {
        subscribe: '/combine/v1/mq/subscribe',
        messages: '/combine/v1/mq/messages',
        complete: '/combine/v1/mq/messages/complete',
      },
      acs: {
        certificateRecords: '/acs/v1/event/certificaterecords/search',
      },
      // Easy to add more endpoints in future
    };
  }

  /**
   * Validate configuration on initialization
   */
  validate(): void {
    if (!this.baseUrl) {
      throw new Error('HC_API_URL environment variable is required');
    }

    if (!this.appKey) {
      throw new Error('HC_APP_KEY environment variable is required');
    }

    if (!this.secretKey) {
      throw new Error('HC_SECRET_KEY environment variable is required');
    }
  }
}
