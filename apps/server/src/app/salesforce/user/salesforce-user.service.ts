import { Injectable, Logger } from '@nestjs/common';
import { LoginRequestDto, UserProfileDto } from '@mandalat-halev-project/api-interfaces';
import { SalesforceCoreService } from '../core/salesforce-core.service';
import { SalesforceMapper } from '../salesforce.mapper';

// Contact fields available in the External Customer App
const CONTACT_FIELDS = ['Id', 'Name', 'Email', 'Phone', 'MobilePhone', 'RegisteredID__c', 'StreetName__c', 'CityName__c', 'Birthdate'];

@Injectable()
export class SalesforceUserService {
  private readonly logger = new Logger(SalesforceUserService.name);

  constructor(private readonly core: SalesforceCoreService) {}

  // ---------------------------------------------------------------------------------------------
  // ----------------------------------For testing------------------------------------------------

  async onModuleInit() {
    this.logger.log('🚀 [Sandbox] Fetching all Salesforce Contact fields...');
    //await this.debugPrintAllContactFields();
    //await this.findFamilyIdentifierAdvancedSandbox();
  }

  private async debugPrintAllContactFields() {
    try {
      // גישה לאובייקט ה-Contact
      const contactObj = await this.core.sobject('Contact');

      // פקודת ה-Describe מושכת את כל המטא-דאטה של הטבלה מסיילספורס
      const metadata = await contactObj.describe();

      // חילוץ השמות של השדות והסוג שלהם (למשל: Email, Phone, custom__c)
      const allFields = metadata.fields.map(
        (field) => `${field.name} (${field.type})`,
      );

      this.logger.debug(`==================================================`);
      this.logger.debug(
        `Found ${allFields.length} fields in Salesforce Contact table:`,
      );
      this.logger.debug(`==================================================`);

      // הדפסת המערך המלא בצורה קריאה לטרמינל
      console.dir(allFields, { maxArrayLength: null });

      this.logger.debug(`==================================================`);
    } catch (error) {
      this.logger.error(
        '❌ [Sandbox] Failed to fetch Salesforce metadata',
        error,
      );
    }
  }

  public async printAllUsersAccountData(): Promise<void> {
    try {
      this.logger.log('🔄 [Sandbox] Fetching ALL users from Salesforce...');
      const contactObj = await this.core.sobject('Contact');

      const records = await contactObj
        .find({}, [
          'Id',
          'Name',
          'RegisteredID__c',
          'npe01__Type_of_Account__c',
          'npo02__Household__c', // משתמשים בזה במקום AccountId שחסום כרגע
        ])
        .execute();

      this.logger.debug(`==================================================`);
      this.logger.debug(
        `📊 Found ${records.length} total users in Salesforce Contact table:`,
      );
      this.logger.debug(`==================================================`);

      console.dir(records, { depth: null, colors: true, maxArrayLength: null });

      this.logger.debug(`==================================================`);
    } catch (error) {
      this.logger.error(
        '❌ [Sandbox] Error fetching all users account data',
        error,
      );
    }
  }


  public async findFamilyIdentifierAdvancedSandbox(): Promise<void> {
    try {
      const contactObj = await this.core.sobject('Contact');

      // 1. משיכת כל השדות האפשריים דינמית מה-Describe Call
      this.logger.log('🧬 Fetching complete Contact schema metadata...');
      const metadata = await contactObj.describe();
      const allFields = metadata.fields.map(f => f.name);

      this.logger.log(`Found ${allFields.length} possible fields to scan.`);

      // 2. שליפת כל הרשומות מהדאטה-בייס עם כל השדות שגילינו
      this.logger.log('📥 Downloading all records for mass analysis...');
      const records = await contactObj.find({}, allFields).execute();
      this.logger.log(`Loaded ${records.length} records successfully.`);

      // 3. חלוקה ראשונית לחבורות (Clusters) לפי שם משפחה + רחוב
      const clusters: Record<string, any[]> = {};
      records.forEach((rcrd: any) => {
        const lastName = (rcrd.LastName || '').trim();
        const street = (rcrd.StreetName__c || '').trim();

        if (lastName && street) {
          const key = `${lastName}_${street}`;
          if (!clusters[key]) clusters[key] = [];
          clusters[key].push(rcrd);
        }
      });

      // סינון רק של חבורות אמיתיות (לפחות שני אנשים באותו בית)
      const validClusters = Object.values(clusters).filter(c => c.length > 1);
      this.logger.log(`Identified ${validClusters.length} distinct multi-person family clusters.`);

      // 4. מנוע ההצלבה: נבדוק עבור כל שדה בכמה חבורות יש התאמה מלאה
      const fieldMatchStats: Record<string, number> = {};

      allFields.forEach(fieldName => {
        let matchingClustersCount = 0;

        validClusters.forEach(members => {
          const firstMemberValue = members[0][fieldName];

          // תנאי להתאמה: הערך קיים (לא ריק/null/undefined) וזהה לחלוטין אצל כל בני החבורה
          const isValueValueValid = firstMemberValue !== undefined && firstMemberValue !== null && firstMemberValue !== '';
          const isIdenticalAcrossCluster = isValueValueValid && members.every(m => m[fieldName] === firstMemberValue);

          if (isIdenticalAcrossCluster) {
            matchingClustersCount++;
          }
        });

        // שומרים את הסטטיסטיקה רק לשדות שהיו להם התאמות בפועל
        if (matchingClustersCount > 0) {
          fieldMatchStats[fieldName] = matchingClustersCount;
        }
      });

      // 5. מיון התוצאות מהגבוה לנמוך והצגה בטבלה קריאה
      const sortedResults = Object.entries(fieldMatchStats)
        .map(([field, count]) => ({
          'Field Name': field,
          'Matching Clusters Count': count,
          'Success Rate': `${((count / validClusters.length) * 100).toFixed(1)}%`
        }))
        .sort((a, b) => b['Matching Clusters Count'] - a['Matching Clusters Count']);

      this.logger.debug(`======================================================================`);
      this.logger.debug(`🎯 FIELD MATCHING STATISTICS (Sorted by Cluster Match Count)`);
      this.logger.debug(`======================================================================`);
      console.table(sortedResults);
      this.logger.debug(`======================================================================`);

    } catch (error) {
      this.logger.error('❌ [Sandbox] Advanced Engine crashed', error);
    }
  }

  // ---------------------------------------------------------------------------------------------

  async validateLogin(credentials: LoginRequestDto): Promise<string | null> {
    const { phoneNumber, idNumber } = credentials;

    const contactObj = await this.core.sobject('Contact');
    const records = await contactObj
      .find(
        {
          $or: [
            { Phone: SalesforceMapper.formatPhoneNumber(phoneNumber) },
            { MobilePhone: SalesforceMapper.formatPhoneNumber(phoneNumber) },
          ],
          RegisteredID__c: idNumber,
        },
        ['Id'],
      )
      .limit(1)
      .execute();

    // login failed
    if (records.length === 0) {
      this.logger.warn(`Login attempt failed for ID: ${idNumber}`);
      return null;
    }

    return records[0].Id as string;
  }

  async getUserProfile(
    salesforceUserId: string,
  ): Promise<UserProfileDto | null> {
    try {
      const contactObj = await this.core.sobject('Contact');
      const records = await contactObj
        .find({ Id: salesforceUserId }, CONTACT_FIELDS)
        .limit(1)
        .execute();

      if (records.length === 0) {
        this.logger.warn(
          `Profile not found for Salesforce User ID: ${salesforceUserId}`,
        );
        return null;
      }

      const raw = records[0];
      const fullName = (raw.Name as string) || '';
      const spaceIndex = fullName.indexOf(' ');
      const rawPhone =
        (raw.Phone as string) || (raw.MobilePhone as string) || '';

      return {
        salesforceUserId,
        firstName:
          spaceIndex > -1 ? fullName.substring(0, spaceIndex) : fullName,
        lastName: spaceIndex > -1 ? fullName.substring(spaceIndex + 1) : '',
        email: (raw.Email as string) || '',
        phoneNumber: SalesforceMapper.formatPhoneNumber(rawPhone),
        idNumber: (raw.RegisteredID__c as string) || '',
        address: (raw.StreetName__c as string) || '',
        city: (raw.CityName__c as string) || '',
        birthDate: (raw.Birthdate as string) || '',
      };
    } catch (error) {
      this.logger.error(
        `Error fetching profile for user ${salesforceUserId}`,
        error,
      );
      throw error;
    }
  }
}
