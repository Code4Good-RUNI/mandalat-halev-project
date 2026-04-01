import { Injectable, Logger, InternalServerErrorException, } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';
import * as jsforce from 'jsforce';

@Injectable()
export class SalesforceCoreService {
  //private readonly logger = new Logger(SalesforceCoreService.name);
  //private accessToken: string | undefined = undefined;
  //private instanceUrl: string | undefined = undefined;

  private conn: jsforce.Connection;
  private readonly logger = new Logger(SalesforceCoreService.name);

  constructor(private configService: ConfigService) {
    this.conn = new jsforce.Connection({
      loginUrl: this.configService.get('SF_HOST'),
      version: '60.0',
    });
  }

  /**
   * Authenticates with Salesforce using the OAuth2 Client Credentials flow.
   * Ensures that connection is alive and managing the token refreshing.
   */
  private async ensureConnected(): Promise<void> {
    if (!this.conn.accessToken) {
      const clientId = this.configService.get<string>('SF_CLIENT_ID');
      const clientSecret = this.configService.get<string>('SF_CLIENT_SECRET');

      // ensures that values exist
      if (!clientId || !clientSecret) {
        throw new Error(
          'Salesforce credentials are missing in environment variables',
        );
      }

      this.logger.log('Authenticating with Salesforce...');
      await this.conn.login(clientId, clientSecret);
    }
  }

  /**
   * Handles all kind of requests, includes renew token if expired
   * @param method - Type of request ('GET', 'POST', 'DELETE', 'PATCH')
   * @param endpoint - The relative Salesforce API path
   * @param options - An optional object containing 'params' for URL query strings or 'data' for the request body
   * @returns A Promise that resolves to the response data of type T from Salesforce
   * @throws {InternalServerErrorException} If the request fails after a retry or if a non-401 error occurs
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
    endpoint: string,
    options: { params?: any; data?: any } = {},
  ): Promise<T> {
    // establish connection if doesnt exist
    if (!this.accessToken || !this.instanceUrl) {
      await this.authenticate();
    }

    const url = `${this.instanceUrl}/services/data/v60.0/${endpoint}`;

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method,
          url,
          params: options.params,
          data: options.data,
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      // When token expired - error 401
      if (isAxiosError(error) && error.response?.status === 401) {
        this.logger.warn(
          `Salesforce 401 on ${method} ${endpoint}. Retrying...`,
        );
        await this.authenticate();
        return this.request<T>(method, endpoint, options); // retry
      }

      // Other errors
      const errorData = isAxiosError(error) ? error.response?.data : error;
      this.logger.error(
        `Salesforce API error: ${method} ${endpoint}`,
        errorData,
      );
      throw new InternalServerErrorException('Salesforce operation failed');
    }
  }


  /**
   * Run SOQL query
   * @param soql - The query
   * @returns A Promise that resolves to an array of records of type T
   */
  async query<T>(soql: string): Promise<T[]> {
    await this.ensureConnected();
    const result = await this.conn.query<T>(soql);
    return result.records;
  }

  /**
   * Performs a generic GET request to a Salesforce endpoint
   * @param endpoint - The relative Salesforce API path
   * @param params - Optional query string parameters to append to the URL
   * @returns A Promise that resolves to the response data of type T
   */
  async get<T>(endpoint: string, params?: any): Promise<T> {
    return this.request<T>('GET', endpoint, { params });
  }

  /**
   * Performs a generic POST request to create or update data in Salesforce
   * @param endpoint - The relative Salesforce API path
   * @param body - The JSON payload to be sent in the request body
   * @returns A Promise that resolves to the response data of type T
   */
  async post<T>(endpoint: string, body: any): Promise<T> {
    return this.request<T>('POST', endpoint, { data: body });
  }

  /**
   * Performs a generic DELETE request to remove a resource from Salesforce
   * @param endpoint - The relative Salesforce API path including the record ID
   * @returns A Promise that resolves when the deletion is successful
   */
  async delete(endpoint: string): Promise<void> {
    await this.request('DELETE', endpoint);
  }

  /**
   * Rebuilds the SOQL query to prevent Injection attacks
   * @param strings - The static parts of the SOQL template literal
   * @param values - The dynamic variables injected using ${} syntax
   * @returns Modified SOQL query string ready for execution
   */
  static soql(strings: TemplateStringsArray, ...values: any[]): string {
    return strings.reduce((result, str, i) => {
      let value = values[i];
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          // first clean \ and then '
          value = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        } else if (typeof value === 'number') {
          value = Number(value);
        }
      }
      return result + str + (value ?? '');
    }, '');
  }
}