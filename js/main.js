// שימוש בקונפיגורציה המרכזית
// const API_URL = CONFIG.api.url; // הסרתי את זה כי זה כבר מוגדר ב-config.js

// קאש לנתונים - הועבר ל-common.js
// const cache = {
//     questions: null,
//     branches: null
// };

function showLoading() {
    document.getElementById('loading').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading').classList.add('hidden');
}

// מצב טעינה מינימלי לאלמנטים ספציפיים
function showElementLoading(element) {
    const loader = document.createElement('div');
    loader.className = 'element-loader';
    element.appendChild(loader);
}

function hideElementLoading(element) {
    const loader = element.querySelector('.element-loader');
    if (loader) {
        loader.remove();
    }
}

async function fetchFromAPI(action, method = 'GET', data = null) {
    const url = new URL(CONFIG.api.url);
    url.searchParams.append('action', action);
    
    // עבור GET עם data, נוסיף את הנתונים כפרמטרים בURL
    if (data) {
        url.searchParams.append('data', encodeURIComponent(JSON.stringify(data)));
    }
    
    try {
        const response = await fetch(url.toString(), {
            method: 'GET'  // תמיד נשתמש ב-GET
        });
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        const text = await response.text();
        console.log('Response text:', text);
        
        try {
            const jsonResponse = JSON.parse(text);
            if (jsonResponse.error) {
                throw new Error(jsonResponse.error);
            }
            return jsonResponse;
        } catch (e) {
            console.error('Failed to parse response:', text);
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        console.error('Error fetching from API:', error);
        throw error;
    }
}

async function testAppScriptConnection() {
    showLoading();
    try {
        const result = await fetchFromAPI('testConnection');
        console.log('תוצאת בדיקת החיבור:', result);
        if (result && result.status === 'success') {
            console.log('גיליונות קיימים:', result.sheets);
            return true;
        }
        console.error('שגיאה:', result.message);
        return false;
    } catch (error) {
        console.error('שגיאה בבדיקת החיבור:', error);
        if (error.message.includes('Failed to fetch')) {
            showModal({
                title: 'שגיאת חיבור',
                message: 'לא ניתן להתחבר לשרת. אנא בדוק את החיבור לאינטרנט.',
                icon: 'wifi_off'
            });
        } else {
            showModal({
                title: 'שגיאת מערכת',
                message: 'אירעה שגיאה בהתחברות למערכת. אנא נסה שוב מאוחר יותר.',
                icon: 'error'
            });
        }
        return false;
    } finally {
        hideLoading();
    }
}

// פונקציה לטעינת נתונים ברקע
async function preloadData() {
    try {
        // טעינה מקבילית של שאלות וסניפים
        const [questionsResponse, branchesResponse] = await Promise.all([
            fetchFromAPI('getQuestions'),
            fetchFromAPI('getBranches')
        ]);

        cache.questions = questionsResponse.data;
        cache.branches = branchesResponse.data;
        
        return true;
    } catch (error) {
        console.error('שגיאה בטעינת נתונים מקדימה:', error);
        return false;
    }
}

// פונקציה לזיהוי מובייל
function isMobileDevice() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// טיפול בכפתור הורדת החוברת
function setupDownloadBookletButton() {
    const downloadButton = document.getElementById('download-booklet-nav');
    if (!downloadButton) return;
    
    downloadButton.addEventListener('click', function(e) {
        // אם זה מובייל, הורד ישירות
        if (isMobileDevice()) {
            e.preventDefault();
            const link = document.createElement('a');
            link.href = 'assets/docs/חוברת חנוכה תשפו לניידים.pdf';
            link.download = 'חוברת חנוכה תשפו לניידים.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        // אם זה מחשב, תן לזה לעבוד כרגיל (ניווט ל-#downloads-section)
    });
}

// אתחול בטעינת הדף
document.addEventListener('DOMContentLoaded', () => {
    // אתחול מצב לילה
    initDarkMode();
    
    // טעינת נתונים מקדימה
    preloadData();
    
    // בדיקת חיבור לשרת
    testAppScriptConnection();
    
    // הגדרת כפתור הורדת החוברת
    setupDownloadBookletButton();
});

// מעקב אחר גלילת העמוד
window.addEventListener('scroll', () => {
    document.body.classList.toggle('scrolled', window.scrollY > 50);
}); 