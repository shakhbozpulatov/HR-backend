/**
 * HC API Response Interface
 * All HC API responses follow this structure
 */
export interface HcApiResponse<T = any> {
  errorCode: string | number;
  message: string;
  data?: T;
}

/**
 * HC Person Data (from API response)
 */
export interface HcPersonData {
  personId: string;
  personCode?: string;
  firstName?: string;
  lastName?: string;
  gender?: number;
  phone?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any; // Allow additional fields
}

/**
 * HC Terminal Binding Data
 */
export interface HcTerminalBindData {
  personId: string;
  terminalId: string;
  [key: string]: any;
}

/**
 * Generic HC API Request Options
 */
export interface HcApiRequestOptions {
  endpoint: string;
  data: any;
  timeout?: number;
}

/**
 * HC Certificate Record Search Request
 */
export interface HcCertificateRecordSearchRequest {
  pageIndex: number;
  pageSize: number;
  searchCreteria: {
    beginTime: string; // ISO format: 2025-11-01T01:52:03Z
    endTime: string; // ISO format: 2025-11-01T01:53:03Z
  };
}

/**
 * HC Certificate Record Response
 */
export interface HcCertificateRecord {
  recordGuid: string;
  elementId: string;
  elementName: string;
  deviceId: string;
  deviceName: string;
  occurTime: string; // ISO format
  deviceTime: string;
  eventType: number; // 80093 = success, 80094 = denied
  swipeAuthResult: number; // 1 = success
  attendanceStatus: number;
  personInfo?: {
    id: string;
    baseInfo: {
      fullPath?: string;
      firstName?: string;
      lastName?: string;
      personCode: string; // Maps to our hcPersonId
      phoneNum?: string;
      photoUrl?: string;
      gender?: string;
      email?: string;
    };
  };
  acsSnapPicList?: Array<{
    snapPicUrl: string;
    snapPicType: number;
  }>;
  temperatureInfo?: {
    temperatureData: string;
    temperatureStatus: number;
    temperatureUnit: number;
  };
  direction: number;
  recordTime: string;
}

export interface HcCertificateRecordSearchResponse {
  totalNum: number;
  pageIndex: number;
  pageSize: number;
  recordList: HcCertificateRecord[];
}

/**
 * HC Token Authentication Interfaces
 */
export interface HcTokenRequest {
  appKey: string;
  secretKey: string;
}

export interface HcTokenResponse {
  accessToken: string;
  expireTime: number; // Unix timestamp in seconds
  userId: string;
  areaDomain: string;
}

export interface HcTokenData {
  token: string;
  expiresAt: number; // Unix timestamp in milliseconds
  userId: string;
  areaDomain: string;
}

/**
 * HC Device Data (from API response)
 */
export interface HcDeviceData {
  deviceId: string;
  deviceName: string;
  deviceType?: number;
  ipAddress?: string;
  port?: number;
  serialNumber?: string;
  firmwareVersion?: string;
  status?: number;
  locationId?: string;
  [key: string]: any;
}

/**
 * HC Device List Response
 */
export interface HcDeviceListResponse {
  totalNum: number;
  pageIndex: number;
  pageSize: number;
  deviceList: HcDeviceData[];
}

/**
 * HC Service Interface
 * Defines the contract for HC service implementations
 * (Dependency Inversion Principle)
 */
export interface IHcService {
  createUserOnCabinet(dto: any): Promise<HcApiResponse<HcPersonData>>;
  bindUserWithTerminal?(
    personId: string,
    accessLevelIdList: string[],
  ): Promise<HcApiResponse>;
  // Easy to add more methods as interface contracts
}
