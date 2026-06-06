export const NotificationTemplates = {
  newCampaign: {
    title: 'פתחנו פעילויות חדשות באפליקציה',
    body: 'לחצו כדי לצפות ולהרשם לפעילויות החדשות!',
  },
  reminder: (campaignName: string, daysUntil: number) => ({
    title: 'תזכורת לפעילות קרובה',
    body: daysUntil === 1 
      ? `הפעילות "${campaignName}" מתחילה מחר! אל תשכחו.` 
      : `הפעילות "${campaignName}" מתחילה בעוד ${daysUntil} ימים.`,
  }),
  statusChange: (campaignName: string, status: string) => {
    const statusHebrew = status === 'approved' ? 'אושר' : status === 'rejected' ? 'נדחה' : status;
    return {
      title: 'עדכון סטטוס רישום',
      body: `הרישום שלך לפעילות "${campaignName}" עודכן לסטטוס: ${statusHebrew}.`,
    };
  },
};
