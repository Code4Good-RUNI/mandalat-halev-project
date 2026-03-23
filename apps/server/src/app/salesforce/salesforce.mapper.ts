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
      id: reg.External_ID__c ? Number(reg.External_ID__c) : 0,
      name: reg.Name || '',
      description: reg.Description || '',
      imageUrl: reg.Image_URL__c || '',
      startDate: this.formatDateToIsraeli(reg.StartDate),
      endDate: this.formatDateToIsraeli(reg.EndDate),
      durationInHours: this.calculateDuration(reg.StartDate, reg.EndDate),
      locationAddress: reg.ActivityLocation__c || '', // השדה הנכון מה-Describe
      locationCity: '',
      numOfParticipants: reg.Max_Participants__c || 0,
      numOfParticipantsRegistered: 0,
      isActive: !!reg.IsActive,
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