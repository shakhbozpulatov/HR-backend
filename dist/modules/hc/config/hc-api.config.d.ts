export declare class HcApiConfig {
    private readonly baseUrl;
    private readonly accessToken;
    constructor();
    getBaseUrl(): string;
    getAccessToken(): string;
    getDefaultTimeout(): number;
    getHeaders(): Record<string, string>;
    getEndpoints(): {
        person: {
            add: string;
            update: string;
            delete: string;
            get: string;
            list: string;
        };
        terminal: {
            bind: string;
            unbind: string;
        };
    };
    validate(): void;
}
