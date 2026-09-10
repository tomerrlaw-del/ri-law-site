# DNS - ri-law.co.il - מעבר לנטליפיי

## מה בוצע (05.09.2026, לילה)

הרשומות מנוהלות בלייבדיאנאס (ניהול DNS מתקדם, חינמי). שרתי השמות של הדומיין לא השתנו:
park1.livedns.co.il ו-park2.livedns.co.il.

| Host | Type | Data | TTL | הערה |
|---|---|---|---|---|
| ri-law.co.il | A | 75.2.60.5 | 3600 | שונה. היה 109.176.196.150 (השרת הישן בהוסטינגר) |
| www.ri-law.co.il | CNAME | jade-paprenjak-bed2a5.netlify.app | 3600 | שונה. היה ri-law.co.il |
| ri-law.co.il | MX | 1 smtp.google.com | 3600 | לא נגעו. המייל בגוגל |
| ri-law.co.il | NS | park1.livedns.co.il | 14400 | לא נגעו |
| ri-law.co.il | NS | park2.livedns.co.il | 14400 | לא נגעו |
| ri-law.co.il | TXT | v=spf1 include:_spf.google.com ~all | 3600 | חדש (SPF) |
| _dmarc.ri-law.co.il | TXT | v=DMARC1; p=none; rua=mailto:tomer@ri-law.co.il | 3600 | חדש (DMARC, דיווח בלבד) |

## איך זה עובד

- הכתובת 75.2.60.5 היא נקודת הכניסה של נטליפיי לדומיינים ראשיים (apex). רשומת ה-www מצביעה ישירות לאתר בנטליפיי.
- בנטליפיי הדומיין הראשי הוא ri-law.co.il, ו-www מופנה אליו אוטומטית.
- ברגע שהשינוי מתפשט, נטליפיי מנפיקה תעודת Let's Encrypt לבד ומחדשת אותה אוטומטית. HSTS כבר נשלח מהאתר.
- לייבדיאנאס מצהירים על עדכון תוך 24 שעות. בפועל SPF נראה בעולם תוך דקות; A ו-www עדיין הציגו את הערך הישן בבדיקה הראשונה.

## מה נשאר

- DKIM: במנהל Google Workspace, Apps > Google Workspace > Gmail > Authenticate email, ליצור מפתח ולהוסיף כרשומת TXT בשם google._domainkey. עד אז SPF ו-DMARC לבד כבר משפרים מסירות.
- DMARC במצב p=none רק מדווח. אחרי כמה שבועות של דוחות נקיים אפשר לעבור ל-p=quarantine.
- ההרשמה הישנה ל-Cloudflare Pages (ri-law.pages.dev) לא בשימוש. אפשר להשאיר או למחוק. הטוקן שנחשף בצ'אט צריך להימחק בכל מקרה.

## בדיקה מהירה

בדפדפן: https://dns.google/resolve?name=ri-law.co.il&type=A
צריך להחזיר 75.2.60.5. ל-www: type=CNAME צריך להחזיר את כתובת נטליפיי.
