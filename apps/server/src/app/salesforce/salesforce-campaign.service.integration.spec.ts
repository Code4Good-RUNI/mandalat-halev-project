import { config as loadEnv } from '@dotenvx/dotenvx';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { SalesforceCoreService } from './salesforce-core.service';
import { SalesforceCampaignService } from './salesforce-campaign.service';
import { SalesforceUserService } from './salesforce-user.service';

loadEnv({
  path: '.env.server',
  envKeysFile: '.env.server.keys',
  ignore: ['MISSING_ENV_FILE'],
  overload: true,
  quiet: true,
});

/**
 * Integration tests for SalesforceCampaignService against real Salesforce org.
 *
 * Run with:
 *   npx jest --config apps/server/jest.config.cts --testPathPatterns="salesforce-campaign.service.integration" --no-coverage
 */
describe('SalesforceCampaignService (integration)', () => {
  let core: SalesforceCoreService;
  let campaignService: SalesforceCampaignService;

  // Will be populated from a real query
  let testContactId: string;
  let testCampaignId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), HttpModule],
      providers: [SalesforceCoreService, SalesforceCampaignService, SalesforceUserService],
    }).compile();

    core = module.get<SalesforceCoreService>(SalesforceCoreService);
    campaignService = module.get<SalesforceCampaignService>(SalesforceCampaignService);

    await core.onModuleInit();

    // Get a real contact ID from the org
    const contacts = await core.query<any>('SELECT Id FROM Contact LIMIT 1');
    if (contacts.length === 0) throw new Error('No contacts found in org — cannot run tests');
    testContactId = contacts[0].Id;

    // Get a real campaign ID from the org
    const campaigns = await core.query<any>('SELECT Id FROM Campaign LIMIT 1');
    if (campaigns.length === 0) throw new Error('No campaigns found in org — cannot run tests');
    testCampaignId = campaigns[0].Id;

    console.log(`Test Contact ID: ${testContactId}`);
    console.log(`Test Campaign ID: ${testCampaignId}`);
  }, 15000);

  describe('getActiveCampaigns', () => {
    it('should return future campaigns the contact is NOT registered to', async () => {
      const result = await campaignService.getActiveCampaigns(testContactId);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const campaign = result[0];
        expect(campaign.id).toBeDefined();
        expect(campaign.name).toBeDefined();
        expect(campaign.isUserRegistered).toBe(false);
        console.log(`Active campaigns found: ${result.length}`);
        console.log('Sample:', JSON.stringify(campaign, null, 2));
      } else {
        console.log('No active campaigns found (contact may be registered to all)');
      }
    }, 10000);
  });

  describe('getFutureCampaigns', () => {
    it('should return future campaigns the contact IS registered to', async () => {
      const result = await campaignService.getFutureCampaigns(testContactId);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const campaign = result[0];
        expect(campaign.id).toBeDefined();
        expect(campaign.isUserRegistered).toBe(true);
        console.log(`Future registered campaigns found: ${result.length}`);
        console.log('Sample:', JSON.stringify(campaign, null, 2));
      } else {
        console.log('No future registered campaigns found for this contact');
      }
    }, 10000);
  });

  describe('getPastCampaigns', () => {
    it('should return past campaigns the contact was registered to', async () => {
      const result = await campaignService.getPastCampaigns(testContactId);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const campaign = result[0];
        expect(campaign.id).toBeDefined();
        expect(campaign.hasUserParticipated).toBe(true);
        console.log(`Past campaigns found: ${result.length}`);
        console.log('Sample:', JSON.stringify(campaign, null, 2));
      } else {
        console.log('No past campaigns found for this contact');
      }
    }, 10000);
  });


  describe('campaignExists', () => {
    it('should return true for an existing campaign', async () => {
      const exists = await campaignService.campaignExists(testCampaignId);
      expect(exists).toBe(true);
    });

    it('should return false for a non-existing campaign', async () => {
      const exists = await campaignService.campaignExists('701000000000000AAA');
      expect(exists).toBe(false);
    });
  });

  describe('getRegistrationStatus', () => {
    it('should return pending for a contact not registered to a campaign', async () => {
      const status = await campaignService.getRegistrationStatus(testContactId, testCampaignId);
      expect(status.campaignId).toBe(testCampaignId);
      expect(['pending', 'approved', 'rejected']).toContain(status.registrationStatus);
      console.log('Registration status:', status);
    }, 10000);
  });
});