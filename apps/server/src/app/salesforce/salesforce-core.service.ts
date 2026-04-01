import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jsforce from 'jsforce';

@Injectable()
export class SalesforceCoreService {
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
  async query<T extends jsforce.Record>(soql: string): Promise<T[]> {
    await this.ensureConnected();
    const result = await this.conn.query<T>(soql);
    return result.records;
  }

  /**
   * Creates a new record in Salesforce for the specified SObject
   * @param sobjectName - The name of the SObject
   * @param data - The record data to be created
   * @returns A Promise that resolves to the Salesforce creation result
   */
  async create(sobjectName: string, data: any): Promise<any> {
    const obj = await this.sobject(sobjectName);
    return obj.create(data);
  }

  /**
   * Delete a record in Salesforce for the specified SObject
   * @param sobjectName - The name of the SObject
   * @param id - user's salefocre id
   * @returns A Promise that resolves to the Salesforce deletion result
   */
  async destroy(sobjectName: string, id: string): Promise<any> {
    const obj = await this.sobject(sobjectName);
    return obj.destroy(id);
  }

  /**
   * Updates a record in Salesforce for the specified SObject
   * @param sobjectName - The name of the SObject
   * @param data - The record data to be updated
   * @returns A Promise that resolves to the Salesforce update result
   */ async update(sobjectName: string, data: any): Promise<any> {
    const obj = await this.sobject(sobjectName);
    return obj.update(data);
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