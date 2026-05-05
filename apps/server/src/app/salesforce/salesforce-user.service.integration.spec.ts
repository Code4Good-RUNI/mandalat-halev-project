import { config as loadEnv } from '@dotenvx/dotenvx';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SalesforceCoreService } from './salesforce-core.service';
import { SalesforceUserService } from './salesforce-user.service';

loadEnv({
  path: 'apps/server/.env.server',
  envKeysFile: 'apps/server/.env.keys',
  ignore: ['MISSING_ENV_FILE'],
  overload: true,
  quiet: true,
});

/**
 * Integration tests for SalesforceUserService against real Salesforce org.
 *
 * Run with:
 *   npx jest --config apps/server/jest.config.cts --testPathPatterns="salesforce-user.service.integration" --no-coverage
 */
describe('SalesforceUserService (integration)', () => {
  let core: SalesforceCoreService;
  let userService: SalesforceUserService;

  let testContactId: string;
  let testContactPhone: string;
  let testContactIdNumber: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [SalesforceCoreService, SalesforceUserService],
    }).compile();

    core = module.get<SalesforceCoreService>(SalesforceCoreService);
    userService = module.get<SalesforceUserService>(SalesforceUserService);

    await core.onModuleInit();

    // Get a real contact with phone and ID number to test login
    const contacts = await core.query<any>(
      "SELECT Id, Phone, MobilePhone, RegisteredID__c FROM Contact WHERE RegisteredID__c != null AND (Phone != null OR MobilePhone != null) LIMIT 1"
    );

    if (contacts.length === 0) {
      throw new Error('No contacts with phone + ID number found — cannot run tests');
    }

    testContactId = contacts[0].Id;
    testContactPhone = contacts[0].Phone || contacts[0].MobilePhone;
    testContactIdNumber = contacts[0].RegisteredID__c;

    console.log(`Test Contact ID: ${testContactId}`);
    console.log(`Test Contact Phone: ${testContactPhone}`);
    console.log(`Test Contact ID Number: ${testContactIdNumber}`);
  }, 15000);

  describe('validateLogin', () => {
    it('should return contact ID for valid credentials', async () => {
      const result = await userService.validateLogin({
        phoneNumber: testContactPhone,
        idNumber: testContactIdNumber,
      });

      expect(result).toBe(testContactId);
      console.log(`validateLogin returned: ${result}`);
    }, 10000);

    it('should return null for invalid credentials', async () => {
      const result = await userService.validateLogin({
        phoneNumber: '0000000000',
        idNumber: '000000000',
      });

      expect(result).toBeNull();
    }, 10000);
  });

  describe('getUserProfile', () => {
    it('should return a profile for a valid contact ID', async () => {
      const profile = await userService.getUserProfile(testContactId);

      expect(profile).not.toBeNull();
      expect(profile!.salesforceUserId).toBe(testContactId);
      expect(profile!.idNumber).toBe(testContactIdNumber);
      expect(profile!.firstName).toBeDefined();
      console.log('User profile:', JSON.stringify(profile, null, 2));
    }, 10000);

    it('should return null for a non-existing contact ID', async () => {
      const profile = await userService.getUserProfile('003000000000000AAA');

      expect(profile).toBeNull();
    }, 10000);
  });
});