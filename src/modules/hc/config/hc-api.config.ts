import { Injectable } from '@nestjs/common';

/**
 * HC API Configuration Service
 * Centralized configuration for HC API endpoints and settings
 */
@Injectable()
export class HcApiConfig {
  private readonly baseUrl: string;
  private readonly accessToken: string;

  constructor() {
    this.baseUrl = process.env.HC_API_URL || '';
    this.accessToken = process.env.HC_ACCESS_TOKEN || '';
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getAccessToken(): string {
    return this.accessToken;
  }

  getDefaultTimeout(): number {
    return 10000; // 10 seconds
  }

  getHeaders(): Record<string, string> {
    return {
      token: this.accessToken,
      'Content-Type': 'application/json',
    };
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

    if (!this.accessToken) {
      throw new Error('HC_ACCESS_TOKEN environment variable is required');
    }
  }
}
