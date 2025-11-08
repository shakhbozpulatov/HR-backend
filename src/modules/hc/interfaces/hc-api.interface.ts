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
 * HC Service Interface
 * Defines the contract for HC service implementations
 * (Dependency Inversion Principle)
 */
export interface IHcService {
  createUserOnCabinet(dto: any): Promise<HcApiResponse<HcPersonData>>;
  bindUserWithTerminal?(data: any): Promise<HcApiResponse>;
  // Easy to add more methods as interface contracts
}