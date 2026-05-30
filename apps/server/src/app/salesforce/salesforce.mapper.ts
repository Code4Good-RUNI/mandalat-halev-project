export class SalesforceMapper {
  /**
   * Convert date to Israeli format if needed
   */
  static formatDateToIsraeli(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  /**
   * Maps the fields of CampaignDto
   */
  static mapBaseCampaign(reg: any) {
    return {
      id: reg.Id || '',
      name: reg.Name || '',
      description: reg.Description || '',
      imageUrl: '',
      startDate: this.formatDateToIsraeli(reg.StartDate),
      endDate: this.formatDateToIsraeli(reg.EndDate),
      durationInHours: this.calculateDuration(reg.StartDate, reg.EndDate),
      locationAddress: reg.ActivityLocation__c || '',
      locationCity: reg.ActivityLocation__c || '',
      numOfParticipants: reg.max_participants__c || 0,
      numOfParticipantsRegistered: reg.NumberOfContacts || 0,
      isActive: !!reg.IsActive,
      host: reg.AdvisorName__r?.Name || '',
    };
  }

  /**
   * Gets user approval status
   */
  static mapStatusToApproval(status: string) {
    if (status === 'Confirmed') return 'approved';
    if (status === 'Rejected') return 'rejected';
    return 'pending';
  }

  /**
   * Calculates duration
   */
  static calculateDuration(start: string, end: string): number {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffInMs = endDate.getTime() - startDate.getTime();
    return Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60)));
  }

  /**
   * Convert phone number to be 05X-XXXXXXX
   */
  static formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('972')) {
      cleaned = '0' + cleaned.slice(3);
    }

    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }

    if (cleaned.length === 9 && cleaned.startsWith('0')) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    }

    return cleaned;
  }

  /**
   * returns an array with all the available formats of Israeli PhoneNumber
   */
  static getPhoneVariations(phone: string): string[] {
    if (!phone) return [];

    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('972')) {
      cleaned = '0' + cleaned.slice(3);
    }

    if (cleaned.length !== 10 && cleaned.length !== 9) {
      return Array.from(new Set([phone, cleaned]));
    }

    const isMobile = cleaned.length === 10;
    const prefix = isMobile ? cleaned.slice(0, 3) : cleaned.slice(0, 2);
    const rest = isMobile ? cleaned.slice(3) : cleaned.slice(2);

    // (XXX-XXX-XXXX or XX-XXX-XXXX)
    const mid = isMobile ? cleaned.slice(3, 6) : cleaned.slice(2, 5);
    const end = isMobile ? cleaned.slice(6) : cleaned.slice(5);

    const prefixNoZero = prefix.slice(1);

    const variations = new Set([
      cleaned, // 0541114444
      `${prefix}-${rest}`, // 054-1114444
      `${prefix} ${rest}`, // 054 1114444
      `${prefix}-${mid}-${end}`, // 054-111-4444
      `${prefix} ${mid} ${end}`, // 054 111 4444
      `972${prefixNoZero}${rest}`, // 972541114444
      `+972${prefixNoZero}${rest}`, // +972541114444
      `972-${prefixNoZero}-${rest}`, // 972-54-1114444
      `+972-${prefixNoZero}-${rest}`, // +972-54-1114444
      `972-${prefixNoZero}-${mid}-${end}`, // 972-54-111-4444
      `+972-${prefixNoZero}-${mid}-${end}`, // +972-54-111-4444
      `+972 ${prefixNoZero} ${mid} ${end}`, // +972 54 444 4444
    ]);

    return Array.from(variations);
  }
}