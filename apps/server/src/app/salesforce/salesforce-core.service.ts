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
   * Create an SObject ready to use while ensuring connectivity
   * @param name
   * @returns A Promise that resolves to a SObject
   */
  async sobject(name: string): Promise<jsforce.SObject<any, any>> {
    await this.ensureConnected();
    return this.conn.sobject(name);
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

  /**
   * Gets internal contact ID in salesforce server
   */
  async getInternalContactId(salesforceUserId: number): Promise<string | null> {
    const contactSObject = (await this.sobject(
      'Contact',
    )) as jsforce.SObject<any, any>;
    const records = await contactSObject
      .find({ External_ID__c: salesforceUserId }, ['Id'])
      .limit(1)
      .execute();

    return records[0]?.Id || null;
  }
}