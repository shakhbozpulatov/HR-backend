export interface HcApiResponse<T = any> {
    errorCode: string | number;
    message: string;
    data?: T;
}
export interface HcPersonData {
    personId: string;
    personCode?: string;
    firstName?: string;
    lastName?: string;
    gender?: number;
    phone?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
}
export interface HcTerminalBindData {
    personId: string;
    terminalId: string;
    [key: string]: any;
}
export interface HcApiRequestOptions {
    endpoint: string;
    data: any;
    timeout?: number;
}
export interface IHcService {
    createUserOnCabinet(dto: any): Promise<HcApiResponse<HcPersonData>>;
    bindUserWithTerminal?(personId: string, accessLevelIdList: string[]): Promise<HcApiResponse>;
}
