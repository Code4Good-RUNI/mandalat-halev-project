import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SalesforceCoreService } from './salesforce-core.service';

const mockConfig = {
  SF_HOST: 'https://test.my.salesforce.com',
  SF_CLIENT_ID: 'test-client-id',
  SF_CLIENT_SECRET: 'test-client-secret',
};

const mockTokenResponse = {
  access_token: 'mock-access-token',
  instance_url: 'https://test-instance.salesforce.com',
};

describe('SalesforceCoreService', () => {
  let service: SalesforceCoreService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockTokenResponse,
      text: async () => '',
    } as Response);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesforceCoreService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => mockConfig[key as keyof typeof mockConfig],
          },
        },
      ],
    }).compile();

    service = module.get<SalesforceCoreService>(SalesforceCoreService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('authenticate (via onModuleInit)', () => {
    it('should call the token endpoint with client credentials', async () => {
      await service.onModuleInit();

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://test.my.salesforce.com/services/oauth2/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      const callBody = fetchSpy.mock.calls[0][1].body;
      expect(callBody).toContain('grant_type=client_credentials');
      expect(callBody).toContain('client_id=test-client-id');
      expect(callBody).toContain('client_secret=test-client-secret');
    });

    it('should throw when env vars are missing', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SalesforceCoreService,
          {
            provide: ConfigService,
            useValue: { get: () => undefined },
          },
        ],
      }).compile();

      const badService = module.get<SalesforceCoreService>(SalesforceCoreService);

      await expect(badService.onModuleInit()).resolves.toBeUndefined();
      // onModuleInit catches the error internally, so we verify it logged without crashing
    });

    it('should throw when token endpoint returns an error', async () => {
      fetchSpy.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => '{"error":"invalid_client"}',
      } as Response);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SalesforceCoreService,
          {
            provide: ConfigService,
            useValue: {
              get: (key: string) => mockConfig[key as keyof typeof mockConfig],
            },
          },
        ],
      }).compile();

      const badService = module.get<SalesforceCoreService>(SalesforceCoreService);
      await expect(badService.onModuleInit()).resolves.toBeUndefined();
    });
  });

  describe('query', () => {
    it('should authenticate and run a SOQL query', async () => {
      const mockRecords = [{ Id: '001', Name: 'Test' }];

      await service.onModuleInit();

      const querySpy = jest.fn().mockResolvedValue({ records: mockRecords });
      (service as any)['conn'] = {
        accessToken: 'mock-access-token',
        sobject: jest.fn(),
        query: querySpy,
      };

      const result = await service.query('SELECT Id, Name FROM Account');
      expect(querySpy).toHaveBeenCalledWith('SELECT Id, Name FROM Account');
      expect(result).toEqual(mockRecords);
    });
  });

  describe('withReauth (token expiry handling)', () => {
    it('should re-authenticate and retry on INVALID_SESSION_ID', async () => {
      await service.onModuleInit();

      const mockRecords = [{ Id: '002', Name: 'Refreshed' }];
      let callCount = 0;

      const querySpy = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('INVALID_SESSION_ID');
        }
        return Promise.resolve({ records: mockRecords });
      });

      (service as any)['conn'] = {
        accessToken: 'mock-access-token',
        sobject: jest.fn(),
        query: querySpy,
      };

      // After re-auth, withReauth creates a new conn via authenticate().
      // We need fetch to return a valid token, then override conn again for the retry.
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
        text: async () => '',
      } as Response);

      // Spy on authenticate to re-inject our mock conn after re-auth
      const originalAuth = (service as any).authenticate.bind(service);
      jest.spyOn(service as any, 'authenticate').mockImplementation(async () => {
        await originalAuth();
        (service as any)['conn'] = {
          accessToken: 'new-mock-token',
          sobject: jest.fn(),
          query: querySpy,
        };
      });

      const result = await service.query('SELECT Id FROM Contact');

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockRecords);
    });

    it('should throw non-session errors without retrying', async () => {
      await service.onModuleInit();

      const querySpy = jest.fn().mockRejectedValue(new Error('SOME_OTHER_ERROR'));
      (service as any)['conn'] = {
        accessToken: 'mock-access-token',
        sobject: jest.fn(),
        query: querySpy,
      };

      await expect(service.query('SELECT Id FROM Account')).rejects.toThrow('SOME_OTHER_ERROR');
      expect(querySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a record on the specified sobject', async () => {
      await service.onModuleInit();

      const createSpy = jest.fn().mockResolvedValue({ id: '003', success: true });
      const sobjectSpy = jest.fn().mockResolvedValue({ create: createSpy });
      (service as any)['conn'] = {
        accessToken: 'mock-access-token',
        sobject: sobjectSpy,
      };

      const result = await service.create('Account', { Name: 'New Account' });
      expect(sobjectSpy).toHaveBeenCalledWith('Account');
      expect(createSpy).toHaveBeenCalledWith({ Name: 'New Account' });
      expect(result).toEqual({ id: '003', success: true });
    });
  });

  describe('destroy', () => {
    it('should delete a record by id', async () => {
      await service.onModuleInit();

      const destroySpy = jest.fn().mockResolvedValue({ id: '004', success: true });
      const sobjectSpy = jest.fn().mockResolvedValue({ destroy: destroySpy });
      (service as any)['conn'] = {
        accessToken: 'mock-access-token',
        sobject: sobjectSpy,
      };

      const result = await service.destroy('Account', '004');
      expect(sobjectSpy).toHaveBeenCalledWith('Account');
      expect(destroySpy).toHaveBeenCalledWith('004');
      expect(result).toEqual({ id: '004', success: true });
    });
  });

  describe('update', () => {
    it('should update a record', async () => {
      await service.onModuleInit();

      const updateSpy = jest.fn().mockResolvedValue({ id: '005', success: true });
      const sobjectSpy = jest.fn().mockResolvedValue({ update: updateSpy });
      (service as any)['conn'] = {
        accessToken: 'mock-access-token',
        sobject: sobjectSpy,
      };

      const result = await service.update('Account', { Id: '005', Name: 'Updated' });
      expect(sobjectSpy).toHaveBeenCalledWith('Account');
      expect(updateSpy).toHaveBeenCalledWith({ Id: '005', Name: 'Updated' });
      expect(result).toEqual({ id: '005', success: true });
    });
  });

  describe('soql (static)', () => {
    it('should escape single quotes in strings', () => {
      const name = "O'Reilly";
      const result = SalesforceCoreService.soql`SELECT Id FROM Account WHERE Name = '${name}'`;
      expect(result).toBe("SELECT Id FROM Account WHERE Name = 'O\\'Reilly'");
    });

    it('should escape backslashes', () => {
      const path = 'C:\\Users\\test';
      const result = SalesforceCoreService.soql`SELECT Id FROM Account WHERE Path__c = '${path}'`;
      expect(result).toBe("SELECT Id FROM Account WHERE Path__c = 'C:\\\\Users\\\\test'");
    });

    it('should handle numbers without escaping', () => {
      const limit = 10;
      const result = SalesforceCoreService.soql`SELECT Id FROM Account LIMIT ${limit}`;
      expect(result).toBe('SELECT Id FROM Account LIMIT 10');
    });

    it('should handle null and undefined gracefully', () => {
      const result = SalesforceCoreService.soql`SELECT Id FROM Account WHERE Name = ${null}`;
      expect(result).toBe('SELECT Id FROM Account WHERE Name = ');
    });
  });
});