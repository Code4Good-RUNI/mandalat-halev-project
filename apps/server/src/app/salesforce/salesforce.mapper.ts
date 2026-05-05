import { CampaignDto } from '@mandalat-halev-project/api-interfaces';

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
      description: '',
      imageUrl: '',
      startDate: this.formatDateToIsraeli(reg.StartDate),
      endDate: this.formatDateToIsraeli(reg.EndDate),
      durationInHours: this.calculateDuration(reg.StartDate, reg.EndDate),
      locationAddress: reg.ActivityLocation__c || '',
      locationCity: '',
      numOfParticipants: 0,
      numOfParticipantsRegistered: 0,
      isActive: true,
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
}