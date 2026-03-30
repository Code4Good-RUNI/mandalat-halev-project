import { Injectable, Logger, InternalServerErrorException, } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios';

@Injectable()
export class SalesforceCoreService {
  private readonly logger = new Logger(SalesforceCoreService.name);
  private accessToken: string | undefined = undefined;
  private instanceUrl: string | undefined = undefined;

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    // ---------------------- test auth ----------------
    //this.authenticate().catch(err => {//
    //});
    //console.log('--- ENV CHECK ---');
    //console.log('SF_HOST:', this.configService.get('SF_HOST'));
    //console.log('------------------');
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
   * Authenticates with Salesforce using the OAuth2 Client Credentials flow
   * Retrieves an access token and the instance URL required for subsequent API calls
   * @throws {InternalServerErrorException} If configuration is missing or the authentication request fails
   */
  private async authenticate(): Promise<void> {
    this.logger.log('Initiating Salesforce authentication...');

    const host = this.configService.get<string>('SF_HOST');
    const clientId = this.configService.get<string>('SF_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SF_CLIENT_SECRET');

    if (!clientId || !clientSecret || !host) {
      this.logger.error('Missing Salesforce configuration in .env');
      throw new InternalServerErrorException('Salesforce configuration error');
    }

    const url = `${host}/services/oauth2/token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const { data } = await firstValueFrom(
        this.httpService.post(url, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      this.accessToken = data.access_token;
      this.instanceUrl = data.instance_url;
      this.logger.log('Salesforce authentication successful.');
    } catch (error) {
      // HTTP error
      if (isAxiosError(error)) {
        const errorData = error.response?.data;
        this.logger.error('Failed to authenticate with Salesforce', errorData);
      } else {
        // General error
        this.logger.error('An unexpected error occurred', error);
      }
      throw new InternalServerErrorException('Salesforce connection failed');
    }
  }

  /**
   * Run SOQL query
   * @param soql - The query
   * @returns A Promise that resolves to an array of records of type T
   */
  async query<T>(soql: string): Promise<T[]> {
    const response = await this.get<{ records: T[] }>('query', { q: soql });
    return response.records;
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
      if (typeof value === 'string') {
        value = value.replace(/'/g, "\\'");
      }
      return result + str + (value ?? '');
    }, '');
  }
}