import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jsforce from 'jsforce';

@Injectable()
export class SalesforceCoreService {
  private conn: jsforce.Connection;
  private readonly logger = new Logger(SalesforceCoreService.name);

  constructor(private configService: ConfigService) {
    this.conn = new jsforce.Connection({ version: '60.0' });
  }

  async onModuleInit() {
    this.logger.log(
      'Attempting to connect to Salesforce via Client Credentials flow...',
    );
    try {
      await this.ensureConnected();
      this.logger.log('Connected to Salesforce successfully.');
    } catch (error) {
      this.logger.error('Could not connect to Salesforce.');
      if (error instanceof Error) {
        this.logger.error(`Reason: ${error.message}`);
      } else {
        this.logger.error(`An unexpected error occurred: ${String(error)}`);
      }
    }
  }


  private async authenticate(): Promise<void> {
    const host = this.configService.get<string>('SF_HOST');
    const clientId = this.configService.get<string>('SF_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SF_CLIENT_SECRET');

    if (!host || !clientId || !clientSecret) {
      throw new Error(
        'SF_HOST, SF_CLIENT_ID, or SF_CLIENT_SECRET missing in .env.server',
      );
    }

    const tokenUrl = `${host}/services/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Client Credentials auth failed (${response.status}): ${errorBody}`,
      );
    }

    const tokenData = (await response.json()) as {
      instance_url: string;
      access_token: string;
    };
    this.conn = new jsforce.Connection({
      instanceUrl: tokenData.instance_url,
      accessToken: tokenData.access_token,
      version: '60.0',
    });

    this.logger.log('Access token acquired via Client Credentials flow ✅');
  }

  private async ensureConnected(): Promise<void> {
    if (!this.conn.accessToken) {
      await this.authenticate();
    }
  }

  private isSessionExpiredError(err: unknown): boolean {
    if (err instanceof Error) {
      const msg = err.message.toUpperCase();
      return (
        msg.includes('INVALID_SESSION_ID') || msg.includes('SESSION EXPIRED')
      );
    }
    return false;
  }

  private isNetworkError(err: unknown): boolean {
    if (err instanceof Error) {
      const msg = err.message.toUpperCase();
      return (
        msg.includes('ECONNRESET') ||
        msg.includes('ECONNREFUSED') ||
        msg.includes('ETIMEDOUT') ||
        msg.includes('SOCKET HANG UP') ||
        msg.includes('FETCH FAILED') ||
        msg.includes('EAI_AGAIN')
      );
    }
    return false;
  }

  private async withRetry<T>(operation: () => Promise<T>, retries = 2): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (err) {
        if (attempt < retries && this.isNetworkError(err)) {
          const delay = Math.pow(2, attempt) * 500;
          this.logger.warn(`Network error, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Retry loop exited unexpectedly');
  }

  private async withReauth<T>(operation: () => Promise<T>): Promise<T> {
    return this.withRetry(async () => {
      try {
        return await operation();
      } catch (err) {
        if (this.isSessionExpiredError(err)) {
          this.logger.warn('Session expired, re-authenticating...');
          this.conn = new jsforce.Connection({ version: '60.0' });
          await this.authenticate();
          return await operation();
        }
        throw err;
      }
    });
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
    return this.withReauth(async () => {
      await this.ensureConnected();
      const result = await this.conn.query<T>(soql);
      return result.records;
    });
  }

  async queryAll<T extends jsforce.Record>(soql: string): Promise<T[]> {
    return this.withReauth(async () => {
      await this.ensureConnected();
      const records: T[] = [];
      const result = await this.conn.query<T>(soql);
      records.push(...result.records);
      let queryResult = result;
      while (!queryResult.done) {
        queryResult = await (queryResult as any).nextRecordsUrl
          ? await this.conn.queryMore<T>((queryResult as any).nextRecordsUrl)
          : { done: true, records: [], totalSize: 0 } as any;
        records.push(...queryResult.records);
      }
      return records;
    });
  }

  /**
   * Creates a new record in Salesforce for the specified SObject
   * @param sobjectName - The name of the SObject
   * @param data - The record data to be created
   * @returns A Promise that resolves to the Salesforce creation result
   */
  async create(sobjectName: string, data: any): Promise<any> {
    return this.withReauth(async () => {
      const obj = await this.sobject(sobjectName);
      return obj.create(data);
    });
  }

  /**
   * Delete a record in Salesforce for the specified SObject
   * @param sobjectName - The name of the SObject
   * @param id - user's salefocre id
   * @returns A Promise that resolves to the Salesforce deletion result
   */
  async destroy(sobjectName: string, id: string): Promise<any> {
    return this.withReauth(async () => {
      const obj = await this.sobject(sobjectName);
      return obj.destroy(id);
    });
  }

  /**
   * Updates a record in Salesforce for the specified SObject
   * @param sobjectName - The name of the SObject
   * @param data - The record data to be updated
   * @returns A Promise that resolves to the Salesforce update result
   */
  async update(sobjectName: string, data: any): Promise<any> {
    return this.withReauth(async () => {
      const obj = await this.sobject(sobjectName);
      return obj.update(data);
    });
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