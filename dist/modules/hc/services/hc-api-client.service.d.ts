import { HcApiConfig } from '../config/hc-api.config';
import { HcApiResponse, HcApiRequestOptions } from '../interfaces/hc-api.interface';
export declare class HcApiClient {
    private readonly config;
    private readonly axiosInstance;
    constructor(config: HcApiConfig);
    private setupInterceptors;
    post<T = any>(options: HcApiRequestOptions): Promise<HcApiResponse<T>>;
    get<T = any>(endpoint: string, params?: any): Promise<HcApiResponse<T>>;
    private validateResponse;
    private handleError;
}
