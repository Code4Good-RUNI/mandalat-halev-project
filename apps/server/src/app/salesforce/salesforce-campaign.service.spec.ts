import { Test, TestingModule } from '@nestjs/testing';
import { SalesforceCampaignService } from './salesforce-campaign.service';
import { SalesforceCoreService } from './salesforce-core.service';

const mockCoreService = {
  query: jest.fn(),
  sobject: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
};

describe('SalesforceCampaignService', () => {
  let service: SalesforceCampaignService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesforceCampaignService,
        { provide: SalesforceCoreService, useValue: mockCoreService },
      ],
    }).compile();

    service = module.get<SalesforceCampaignService>(SalesforceCampaignService);
  });

  describe('getFutureCampaigns', () => {
    it('should return mapped future campaigns with membership status', async () => {
      const contactId = '003b000001MKWDVAA5';

      mockCoreService.query.mockResolvedValue([
        {
          Id: '701XX0000004abc',
          Name: 'Summer Art Workshop',
          Description: 'A creative workshop for kids',
          IsActive: true,
          StartDate: '2026-07-01',
          EndDate: '2026-07-15',
          Chug_Type__c: 'Art',
          Activities_Days_And_Hours__c: 'Sun-Thu 09:00-12:00',
          ActivityLocation__c: 'Community Center, Tel Aviv',
          max_participants__c: 25,
          NumberOfContacts: 12,
          AdvisorName__r: { Name: 'David Cohen' },
          CampaignMembers: {
            records: [{ Status: 'Confirmed' }],
          },
        },
        {
          Id: '701XX0000004def',
          Name: 'Basketball League',
          Description: null,
          IsActive: true,
          StartDate: '2026-08-01',
          EndDate: '2026-09-30',
          Chug_Type__c: 'Sport',
          Activities_Days_And_Hours__c: 'Mon, Wed 16:00-18:00',
          ActivityLocation__c: null,
          max_participants__c: 15,
          CampaignMembers: {
            records: [{ Status: 'Registered' }],
          },
        },
        {
          Id: '701XX0000004ghi',
          Name: 'Music Class',
          Description: 'Piano and guitar lessons',
          IsActive: true,
          StartDate: '2026-06-15',
          EndDate: '2026-12-31',
          Chug_Type__c: 'Music',
          Activities_Days_And_Hours__c: null,
          ActivityLocation__c: 'School Hall',
          max_participants__c: null,
          CampaignMembers: null,
        },
      ]);

      const result = await service.getFutureCampaigns(contactId);

      // Verify query was called with correct SOQL
      expect(mockCoreService.query).toHaveBeenCalledTimes(1);
      const queryStr = mockCoreService.query.mock.calls[0][0];
      expect(queryStr).toContain('FROM Campaign');
      expect(queryStr).toContain('EndDate >= TODAY');
      expect(queryStr).toContain('IsActive = true');
      expect(queryStr).toContain(contactId);

      // Verify result count
      expect(result).toHaveLength(3);

      // First campaign — confirmed membership
      expect(result[0]).toEqual({
        id: '701XX0000004abc',
        name: 'Summer Art Workshop',
        description: 'A creative workshop for kids',
        imageUrl: '',
        startDate: '01/07/2026',
        endDate: '15/07/2026',
        durationInHours: 336,
        locationAddress: 'Community Center, Tel Aviv',
        locationCity: 'Community Center, Tel Aviv',
        numOfParticipants: 25,
        numOfParticipantsRegistered: 12,
        host: 'David Cohen',
        isActive: true,
        isRelevantToUser: true,
        isUserRegistered: true,
        userApprovalStatus: 'approved',
      });

      // Second campaign — registered (pending)
      expect(result[1]).toEqual({
        id: '701XX0000004def',
        name: 'Basketball League',
        description: '',
        imageUrl: '',
        startDate: '01/08/2026',
        endDate: '30/09/2026',
        durationInHours: 1440,
        locationAddress: '',
        locationCity: '',
        numOfParticipants: 15,
        numOfParticipantsRegistered: 0,
        host: '',
        isActive: true,
        isRelevantToUser: true,
        isUserRegistered: true,
        userApprovalStatus: 'pending',
      });

      // Third campaign — no membership record
      expect(result[2]).toEqual({
        id: '701XX0000004ghi',
        name: 'Music Class',
        description: 'Piano and guitar lessons',
        imageUrl: '',
        startDate: '15/06/2026',
        endDate: '31/12/2026',
        durationInHours: 4776,
        locationAddress: 'School Hall',
        locationCity: 'School Hall',
        numOfParticipants: 0,
        numOfParticipantsRegistered: 0,
        host: '',
        isActive: true,
        isRelevantToUser: true,
        isUserRegistered: true,
        userApprovalStatus: 'pending',
      });
    });

    it('should return empty array when no campaigns found', async () => {
      mockCoreService.query.mockResolvedValue([]);

      const result = await service.getFutureCampaigns('003000000000000AAA');

      expect(result).toEqual([]);
    });

    it('should handle campaigns with null dates gracefully', async () => {
      mockCoreService.query.mockResolvedValue([
        {
          Id: '701XX0000004xyz',
          Name: 'No Dates Campaign',
          Description: null,
          IsActive: true,
          StartDate: null,
          EndDate: null,
          Chug_Type__c: null,
          Activities_Days_And_Hours__c: null,
          ActivityLocation__c: null,
          max_participants__c: null,
          CampaignMembers: {
            records: [{ Status: 'Rejected' }],
          },
        },
      ]);

      const result = await service.getFutureCampaigns('003b000001MKWDVAA5');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '701XX0000004xyz',
        name: 'No Dates Campaign',
        description: '',
        imageUrl: '',
        startDate: '',
        endDate: '',
        durationInHours: 0,
        locationAddress: '',
        locationCity: '',
        numOfParticipants: 0,
        numOfParticipantsRegistered: 0,
        host: '',
        isActive: true,
        isRelevantToUser: true,
        isUserRegistered: true,
        userApprovalStatus: 'rejected',
      });
    });
  });

  describe('getPastCampaigns', () => {
    it('should return mapped past campaigns the contact was registered to', async () => {
      const contactId = '003b000001MKWDVAA5';

      mockCoreService.query.mockResolvedValue([
        {
          Id: '701XX0000004past1',
          Name: 'Winter Swimming',
          Description: 'Heated pool sessions',
          IsActive: false,
          StartDate: '2025-12-01',
          EndDate: '2026-02-28',
          Chug_Type__c: 'Sport',
          Activities_Days_And_Hours__c: 'Tue, Thu 14:00-16:00',
          ActivityLocation__c: 'City Pool, Haifa',
          max_participants__c: 20,
        },
        {
          Id: '701XX0000004past2',
          Name: 'Cooking Class',
          Description: null,
          IsActive: false,
          StartDate: '2025-09-01',
          EndDate: '2025-12-15',
          Chug_Type__c: 'Cooking',
          Activities_Days_And_Hours__c: null,
          ActivityLocation__c: null,
          max_participants__c: 10,
        },
      ]);

      const result = await service.getPastCampaigns(contactId);

      // Verify query
      expect(mockCoreService.query).toHaveBeenCalledTimes(1);
      const queryStr = mockCoreService.query.mock.calls[0][0];
      expect(queryStr).toContain('EndDate < TODAY');
      expect(queryStr).toContain(contactId);
      expect(queryStr).toContain('ORDER BY EndDate DESC');

      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        id: '701XX0000004past1',
        name: 'Winter Swimming',
        description: 'Heated pool sessions',
        imageUrl: '',
        startDate: '01/12/2025',
        endDate: '28/02/2026',
        durationInHours: 2136,
        locationAddress: 'City Pool, Haifa',
        locationCity: 'City Pool, Haifa',
        numOfParticipants: 20,
        numOfParticipantsRegistered: 0,
        host: '',
        isActive: false,
        hasUserParticipated: true,
      });

      expect(result[1]).toEqual({
        id: '701XX0000004past2',
        name: 'Cooking Class',
        description: '',
        imageUrl: '',
        startDate: '01/09/2025',
        endDate: '15/12/2025',
        durationInHours: 2520,
        locationAddress: '',
        locationCity: '',
        numOfParticipants: 10,
        numOfParticipantsRegistered: 0,
        host: '',
        isActive: false,
        hasUserParticipated: true,
      });
    });

    it('should return empty array when no past campaigns found', async () => {
      mockCoreService.query.mockResolvedValue([]);

      const result = await service.getPastCampaigns('003000000000000AAA');

      expect(result).toEqual([]);
    });

    it('should handle campaigns with null dates', async () => {
      mockCoreService.query.mockResolvedValue([
        {
          Id: '701XX0000004past3',
          Name: 'Old Event',
          Description: null,
          IsActive: false,
          StartDate: null,
          EndDate: null,
          Chug_Type__c: null,
          Activities_Days_And_Hours__c: null,
          ActivityLocation__c: null,
          max_participants__c: null,
        },
      ]);

      const result = await service.getPastCampaigns('003b000001MKWDVAA5');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '701XX0000004past3',
        name: 'Old Event',
        description: '',
        imageUrl: '',
        startDate: '',
        endDate: '',
        durationInHours: 0,
        locationAddress: '',
        locationCity: '',
        numOfParticipants: 0,
        numOfParticipantsRegistered: 0,
        host: '',
        isActive: false,
        hasUserParticipated: true,
      });
    });
  });
});