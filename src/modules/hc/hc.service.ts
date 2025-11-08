import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateHCUserDto } from '@/modules/hc/dto/hc-user.dto';
import { HcApiClient } from './services/hc-api-client.service';
import { HcApiConfig } from './config/hc-api.config';
import { HcDateFormatter } from './utils/hc-date.util';
import {
  HcApiResponse,
  HcPersonData,
  IHcService,
} from './interfaces/hc-api.interface';

@Injectable()
export class HcService implements IHcService, OnModuleInit {
  constructor(
    private readonly apiClient: HcApiClient,
    private readonly config: HcApiConfig,
  ) {}

  /**
   * Create user on HC Cabinet
   * @param dto - User data to create
   * @returns HC API response with person data
   */
  async createUserOnCabinet(
    dto: CreateHCUserDto,
  ): Promise<HcApiResponse<HcPersonData>> {
    const endpoint = this.config.getEndpoints().person.add;

    // Format dates using utility
    const formattedDto = {
      ...dto,
      startDate: HcDateFormatter.toHcFormat(dto.startDate),
      endDate: dto.endDate
        ? HcDateFormatter.toHcFormat(dto.endDate)
        : undefined,
    };

    // Use API client for request (handles logging, validation, errors)
    return this.apiClient.post<HcPersonData>({
      endpoint,
      data: formattedDto,
    });
  }

  /**
   * Update user on HC Cabinet
   * Easy to add new methods following the same pattern
   */
  async updateUserOnCabinet(
    personId: string,
    updateData: Partial<CreateHCUserDto>,
  ): Promise<HcApiResponse<HcPersonData>> {
    const endpoint = this.config.getEndpoints().person.update;

    // Format dates if provided
    const formattedDto: any = { ...updateData, personId };
    if (updateData.startDate) {
      formattedDto.startDate = HcDateFormatter.toHcFormat(updateData.startDate);
    }
    if (updateData.endDate) {
      formattedDto.endDate = HcDateFormatter.toHcFormat(updateData.endDate);
    }

    return this.apiClient.post<HcPersonData>({
      endpoint,
      data: formattedDto,
    });
  }

  /**
   * Get user from HC Cabinet
   */
  async getUserFromCabinet(
    personId: string,
  ): Promise<HcApiResponse<HcPersonData>> {
    const endpoint = this.config.getEndpoints().person.get;

    return this.apiClient.post<HcPersonData>({
      endpoint,
      data: { personId },
    });
  }

  /**
   * Delete user from HC Cabinet
   */
  async deleteUserFromCabinet(personId: string): Promise<HcApiResponse> {
    const endpoint = this.config.getEndpoints().person.delete;

    return this.apiClient.post({
      endpoint,
      data: { personId },
    });
  }

  /**
   * Bind user with terminal (access level)
   * @param personId - HC person ID
   * @param accessLevelIdList - List of access level IDs for terminals
   * @returns HC API response
   */
  async bindUserWithTerminal(
    personId: string,
    accessLevelIdList: string[],
  ): Promise<HcApiResponse> {
    const endpoint = this.config.getEndpoints().terminal.bind;

    const requestData = {
      personList: [
        {
          personId,
          accessLevelIdList,
        },
      ],
    };

    console.log('🔗 Binding user to terminal:', {
      personId,
      accessLevelIdList,
    });

    return this.apiClient.post({
      endpoint,
      data: requestData,
    });
  }

  /**
   * Unbind user from terminal
   */
  async unbindUserFromTerminal(data: {
    personId: string;
    terminalId: string;
  }): Promise<HcApiResponse> {
    const endpoint = this.config.getEndpoints().terminal.unbind;

    return this.apiClient.post({
      endpoint,
      data,
    });
  }

  /**
   * Validate configuration on module initialization
   */
  onModuleInit() {
    try {
      this.config.validate();
      console.log('✅ HC Service initialized successfully', {
        baseUrl: this.config.getBaseUrl(),
        hasToken: !!this.config.getAccessToken(),
      });
    } catch (error) {
      console.error('❌ HC Service initialization failed:', error.message);
      throw error;
    }
  }
}

/**
 * HC Service
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles business logic for HC operations
 * - Open/Closed: Easy to add new methods without modifying existing code
 * - Liskov Substitution: Implements IHcService interface
 * - Interface Segregation: Uses focused interfaces
 * - Dependency Inversion: Depends on abstractions (HcApiClient, HcApiConfig)
 *
 * Benefits:
 * - Clean separation of concerns
 * - Easy to test (mockable dependencies)
 * - Easy to extend with new HC API methods
 * - Reusable components
 */
