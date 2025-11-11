const CONFIG = {
    // הגדרות API
    api: {
        url: 'https://script.google.com/macros/s/AKfycbxNg9QNRje44nNqydXhilxxayyORarRyQpE6rVfPswfmgSlXZWp2CoQjKyiVWHc538/exec'
    },

    // הגדרות חידון חנוכה
    quiz: {
        // isAvailable: false,  // האם החידון זמין כרגע
        isAvailable: true,  //   לא עובד!!!         nextQuizDate: '2025-01-15',  // תאריך החידון הבא
        hebrewDate: "יום רביעי",  // תאריך עברי
        displayDate: "15.1",  // תאריך לתצוגה
        showAnnouncement: true,  // האם להציג הודעה לפני החידון
        announcementText: "ברוכים הבאים לחידון חנוכה! \nמידי שבוע נערוך חידון בנושא חנוכה, תתקיים הגרלה על פרסים יקרי ערך מבין המשתתפים\n בהצלחה מרובה!",
        introductionText: "ברוכים הבאים לחידון חנוכה!\n\nבחידון זה נבדוק את הידע שלכם בחידון חנוכה - הדלקת הנרות, ברכות, מנהגים ועוד.\n\nהזכרו: 'נר חנוכה מצווה להניחו על פתח ביתו מבחוץ' - ברכה והצלחה!"
    },

    // הגדרות כלליות
    general: {
        projectName: 'חידון חנוכה',
        organizationName: 'אור ישראלי'
    }
};

// מניעת שינויים בקונפיגורציה
Object.freeze(CONFIG);

// ייצוא הקונפיגורציה לשימוש בקבצים אחרים
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} 