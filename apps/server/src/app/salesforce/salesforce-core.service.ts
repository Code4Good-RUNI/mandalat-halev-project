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
  }

  // Private method to authenticate to Salesforce's server (Server-to-Server)
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

  // Generic SOQL query to server, includes renew token if expired
  async query<T>(soql: string): Promise<T[]> {
    if (!this.accessToken || !this.instanceUrl) {
      await this.authenticate();
    }

    const url = `${this.instanceUrl}/services/data/v60.0/query`;

    try {
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          params: { q: soql },
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }),
      );

      // Salesforce's results
      return data.records as T[];
    } catch (error) {
      // When token expired - error 401
      if (isAxiosError(error) && error.response?.status === 401) {
        this.logger.warn('Salesforce token expired during query. Retrying...');
        await this.authenticate();
        return this.query<T>(soql);
      }

      // Other errors
      if (isAxiosError(error)) {
        this.logger.error(`SOQL Query failed: ${soql}`, error.response?.data);
      } else {
        this.logger.error('Unexpected error during Salesforce query', error);
      }
      throw new InternalServerErrorException(
        'Failed to fetch data from Salesforce',
      );
    }
  }
}
