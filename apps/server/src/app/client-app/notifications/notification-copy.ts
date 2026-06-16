export const NotificationTemplates = {
  newCampaign: {
    title: 'פעילויות חדשות באפליקציה! 🎉',
    body: 'נפתחו פעילויות חדשות שזמינות עבורך להרשמה. לחצו כאן כדי לצפות.',
  },
  reminder: (campaignName: string, daysUntil: number, firstName: string) => ({
    title: 'תזכורת לפעילות קרובה ⏰',
    body:
      daysUntil === 1
        ? `הפעילות "${campaignName}" של ${firstName} מתחילה מחר! אל תשכחו.`
        : `הפעילות "${campaignName}" של ${firstName} מתחילה בעוד ${daysUntil} ימים.`,
  }),
  statusChange: (campaignName: string, status: string, firstName: string) => {
    const statusHebrew =
      status === 'approved' ? 'אושר' : status === 'rejected' ? 'נדחה' : status;
    return {
      title: 'עדכון סטטוס רישום 📋',
      body: `הרישום של ${firstName} לפעילות "${campaignName}" עודכן לסטטוס: ${statusHebrew}.`,
    };
  },
};
