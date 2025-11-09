import { OnModuleInit } from '@nestjs/common';
import { CreateHCUserDto } from '@/modules/hc/dto/hc-user.dto';
import { HcApiClient } from './services/hc-api-client.service';
import { HcApiConfig } from './config/hc-api.config';
import { HcApiResponse, HcPersonData, IHcService } from './interfaces/hc-api.interface';
export declare class HcService implements IHcService, OnModuleInit {
    private readonly apiClient;
    private readonly config;
    constructor(apiClient: HcApiClient, config: HcApiConfig);
    createUserOnCabinet(dto: CreateHCUserDto): Promise<HcApiResponse<HcPersonData>>;
    updateUserOnCabinet(personId: string, updateData: Partial<CreateHCUserDto>): Promise<HcApiResponse<HcPersonData>>;
    getUserFromCabinet(personId: string): Promise<HcApiResponse<HcPersonData>>;
    deleteUserFromCabinet(personId: string): Promise<HcApiResponse>;
    bindUserWithTerminal(personId: string, accessLevelIdList: string[]): Promise<HcApiResponse>;
    unbindUserFromTerminal(data: {
        personId: string;
        terminalId: string;
    }): Promise<HcApiResponse>;
    uploadUserPhoto(personId: string, photoData: string): Promise<HcApiResponse>;
    onModuleInit(): void;
}
