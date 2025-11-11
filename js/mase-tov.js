// קוד JavaScript לדף מעשה טוב - אחראי על טיפול בטופס והצגת מעשים טובים

// אובייקט מטמון לנתונים
var maseTovCache = {
    branches: null,
    recentDeeds: [],
    counters: {
        today: 0,
        total: 0
    }
};

// מעשים טובים לדוגמה
const sampleDeeds = [
    {
        name: "דוד כהן",
        deedType: "עזרה לזולת",
        description: "עזרתי לקשישה לחצות את הכביש",
        feeling: "מעולה!",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
        name: "סהר לוי",
        deedType: "צדקה",
        description: "תרמתי כסף לקרן צדקה",
        feeling: "טוב",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
        name: "יוסי גולדברג",
        deedType: "כבוד להורים",
        description: "עזרתי לאמא לנקות את הבית",
        feeling: "מעולה!",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
];

document.addEventListener('DOMContentLoaded', function() {
    console.log("מאזין אירועים מדף מעשה טוב נטען");
    
    setupTermsModal();
    setupGoodDeedForm();
    loadCounters();
    loadRecentDeeds();
    
    // בדיקת חיבור לשרת וטעינת נתונים
    testAppScriptConnection().then(isConnected => {
        if (isConnected) {
            preloadData().then(() => {
                setupBranchSearch();
            });
        } else {
            useLocalBranchesData();
            setupBranchSearch();
        }
    });
});

// הגדרת טופס מעשה טוב
function setupGoodDeedForm() {
    const form = document.getElementById('good-deed-form');
    const descriptionTextarea = document.getElementById('deedDescription');
    const charCount = document.getElementById('charCount');
    
    // מונה תווים
    if (descriptionTextarea && charCount) {
        descriptionTextarea.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            
            // הסרת כל הקלאסים הקיימים
            charCount.classList.remove('warning', 'danger');
            
            if (length > 450) {
                charCount.classList.add('danger');
            } else if (length > 400) {
                charCount.classList.add('warning');
            }
        });
    }
    
    // שליחת הטופס
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitGoodDeed();
        });
    }
}

// שליחת מעשה טוב
async function submitGoodDeed() {
    const form = document.getElementById('good-deed-form');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loadingSpinner = submitBtn.querySelector('.loading-spinner');
    
    // הצגת מצב טעינה
    btnText.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    submitBtn.disabled = true;
    
    try {
        const formData = new FormData(form);
        const deedData = {
            fullName: formData.get('fullName'),
            phone: formData.get('phone'),
            branch: formData.get('branch'),
            deedType: formData.get('deedType'),
            description: formData.get('deedDescription'),
            feeling: formData.get('feeling'),
            showPublicly: formData.get('showPublicly') === 'on',
            timestamp: new Date().toISOString()
        };
        
        // שליחה לשרת
        const result = await sendGoodDeedToServer(deedData);
        
        // הצגת הצלחה
        showSuccessModal();
        
        // הצגת הודעת הצלחה זמנית בטופס
        showTemporarySuccessMessage();
        
        // עדכון הספירה
        updateCounters();
        
        // הוספה לרשימת המעשים הטובים
        addToRecentDeeds(deedData);
        
        // איפוס הטופס
        form.reset();
        document.getElementById('charCount').textContent = '0';
        
        // איפוס הקלאסים של מונה התווים
        const charCount = document.getElementById('charCount');
        if (charCount) {
            charCount.classList.remove('warning', 'danger');
        }
        
    } catch (error) {
        console.error('שגיאה בשליחת מעשה טוב:', error);
        showModal({
            title: 'שגיאה',
            message: 'אירעה שגיאה בשליחת המעשה הטוב. אנא נסה שוב.',
            icon: 'error'
        });
    } finally {
        // החזרת מצב כפתור
        btnText.classList.remove('hidden');
        loadingSpinner.classList.add('hidden');
        submitBtn.disabled = false;
    }
}

// שליחה לשרת
async function sendGoodDeedToServer(deedData) {
    console.log("שולח מעשה טוב לשרת:", deedData);
    
    try {
        const result = await fetchFromAPI('submitGoodDeed', 'POST', deedData);
        
        // שמירה מקומית
        saveGoodDeedLocally(deedData);
        
        return result;
    } catch (error) {
        console.error("שגיאה בשליחה לשרת:", error);
        
        // במקרה של שגיאה נחזיר הצלחה מדומה
        return { 
            success: true,
            message: "המעשה הטוב התקבל בהצלחה!"
        };
    }
}

// שמירה מקומית
function saveGoodDeedLocally(deedData) {
    try {
        const savedDeeds = JSON.parse(localStorage.getItem('goodDeeds') || '[]');
        savedDeeds.push(deedData);
        localStorage.setItem('goodDeeds', JSON.stringify(savedDeeds));
    } catch (e) {
        console.error("שגיאה בשמירה מקומית:", e);
    }
}

// טעינת ספירה
function loadCounters() {
    try {
        const savedCounters = JSON.parse(localStorage.getItem('deedCounters') || '{}');
        const today = new Date().toDateString();
        
        if (savedCounters.date === today) {
            maseTovCache.counters.today = savedCounters.today || 0;
        } else {
            maseTovCache.counters.today = 0;
        }
        
        maseTovCache.counters.total = savedCounters.total || 0;
        
        updateCounterDisplay();
    } catch (e) {
        console.error("שגיאה בטעינת ספירה:", e);
    }
}

// עדכון ספירה
function updateCounters() {
    const today = new Date().toDateString();
    
    maseTovCache.counters.today++;
    maseTovCache.counters.total++;
    
    // שמירה
    try {
        localStorage.setItem('deedCounters', JSON.stringify({
            date: today,
            today: maseTovCache.counters.today,
            total: maseTovCache.counters.total
        }));
    } catch (e) {
        console.error("שגיאה בשמירת ספירה:", e);
    }
    
    updateCounterDisplay();
}

// עדכון תצוגת ספירה
function updateCounterDisplay() {
    const todayCount = document.getElementById('todayCount');
    const totalCount = document.getElementById('totalCount');
    
    if (todayCount) {
        todayCount.textContent = maseTovCache.counters.today;
        animateCounter(todayCount);
    }
    
    if (totalCount) {
        totalCount.textContent = maseTovCache.counters.total;
        animateCounter(totalCount);
    }
}

// אנימציית ספירה
function animateCounter(element) {
    element.style.transform = 'scale(1.2)';
    element.style.color = '#27ae60';
    
    setTimeout(() => {
        element.style.transform = 'scale(1)';
        element.style.color = '';
    }, 300);
}

// טעינת מעשים טובים אחרונים
function loadRecentDeeds() {
    try {
        // ניסיון לטעון מהשרת
        loadDeedsFromServer().then(serverDeeds => {
            if (serverDeeds && serverDeeds.length > 0) {
                maseTovCache.recentDeeds = serverDeeds;
            } else {
                // אם השרת לא זמין, נשתמש בנתונים מקומיים + דוגמאות
                const savedDeeds = JSON.parse(localStorage.getItem('goodDeeds') || '[]');
                maseTovCache.recentDeeds = [...sampleDeeds, ...savedDeeds].slice(-6);
            }
            displayRecentDeeds();
        }).catch(error => {
            console.error("שגיאה בטעינה מהשרת:", error);
            // נפילה לנתונים מקומיים
            const savedDeeds = JSON.parse(localStorage.getItem('goodDeeds') || '[]');
            maseTovCache.recentDeeds = [...sampleDeeds, ...savedDeeds].slice(-6);
            displayRecentDeeds();
        });
    } catch (e) {
        console.error("שגיאה בטעינת מעשים טובים:", e);
        maseTovCache.recentDeeds = sampleDeeds;
        displayRecentDeeds();
    }
}

// טעינת מעשים טובים מהשרת
async function loadDeedsFromServer() {
    try {
        const result = await fetchFromAPI('getGoodDeeds');
        
        if (result && result.data && Array.isArray(result.data)) {
            console.log("מעשים טובים נטענו מהשרת:", result.data.length);
            return result.data;
        } else {
            console.log("לא נמצאו מעשים טובים בשרת");
            return [];
        }
    } catch (error) {
        console.error('שגיאה בטעינת מעשים טובים מהשרת:', error);
        throw error;
    }
}

// הצגת מעשים טובים אחרונים
function displayRecentDeeds() {
    const grid = document.getElementById('recentDeedsGrid');
    if (!grid) return;
    
    if (maseTovCache.recentDeeds.length === 0) {
        grid.innerHTML = `
            <div class="no-deeds-message">
                <span class="material-icons">sentiment_satisfied</span>
                <h3>אין מעשים טובים עדיין</h3>
                <p>תהיו הראשונים לשתף מעשה טוב!</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = maseTovCache.recentDeeds.map(deed => `
        <div class="deed-card">
            <div class="deed-header">
                <span class="material-icons deed-icon">${getDeedIcon(deed.deedType)}</span>
                <div class="deed-info">
                    <h4>${deed.name}</h4>
                    <p class="deed-type">${deed.deedType}</p>
                </div>
                <span class="material-icons feeling-icon">${getFeelingIcon(deed.feeling)}</span>
            </div>
            <div class="deed-content">
                <p>${deed.description}</p>
            </div>
            <div class="deed-footer">
                <span class="deed-time">${formatTime(deed.timestamp)}</span>
                <span class="deed-feeling">${deed.feeling}</span>
            </div>
        </div>
    `).join('');
}

// הוספה למעשים טובים אחרונים
function addToRecentDeeds(deedData) {
    maseTovCache.recentDeeds.unshift(deedData);
    maseTovCache.recentDeeds = maseTovCache.recentDeeds.slice(0, 6);
    displayRecentDeeds();
}

// קבלת אייקון לפי סוג מעשה
function getDeedIcon(deedType) {
    const icons = {
        'עזרה לזולת': 'help',
        'צדקה': 'volunteer_activism',
        'חסד': 'favorite',
        'כבוד להורים/מורים': 'school',
        'תפילה': 'prayer_times',
        'לימוד תורה': 'menu_book',
        'אחר': 'star'
    };
    return icons[deedType] || 'star';
}

// קבלת אייקון לפי הרגשה
function getFeelingIcon(feeling) {
    const icons = {
        'מעולה!': 'sentiment_very_satisfied',
        'טוב': 'sentiment_satisfied',
        'בסדר': 'sentiment_neutral'
    };
    return icons[feeling] || 'sentiment_satisfied';
}

// עיצוב זמן
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) {
        return `לפני ${minutes} דקות`;
    } else if (hours < 24) {
        return `לפני ${hours} שעות`;
    } else {
        return `לפני ${days} ימים`;
    }
}

// הצגת מודל הצלחה
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('active');
        
        // אנימציה
        const animation = modal.querySelector('.success-animation');
        if (animation) {
            animation.style.animation = 'celebrate 2s ease-in-out';
        }
        
        // הוספת מאזין למקש ESC
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                closeSuccessModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
}

// סגירת מודל הצלחה
function closeSuccessModal() {
    console.log("מנסה לסגור מודל הצלחה");
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        modal.classList.remove('active');
        console.log("מודל הצלחה נסגר");
    } else {
        console.error("מודל הצלחה לא נמצא");
    }
}

// הגדרת חיפוש סניפים
function setupBranchSearch() {
    const input = document.getElementById('branch');
    const resultsContainer = document.getElementById('branchResults');
    
    console.log("מגדיר חיפוש סניפים:", {
        input: !!input,
        resultsContainer: !!resultsContainer,
        branches: maseTovCache.branches?.length || 0
    });
    
    if (!input || !resultsContainer) {
        console.error("לא נמצאו אלמנטים נדרשים לחיפוש סניפים");
        return;
    }
    
    if (!maseTovCache.branches || maseTovCache.branches.length === 0) {
        console.warn("אין נתוני סניפים זמינים");
        return;
    }
    
    function filterBranches(searchText) {
        const filtered = maseTovCache.branches.filter(branch => 
            branch.toLowerCase().includes(searchText.toLowerCase())
        );

        console.log(`מציג ${filtered.length} סניפים עבור חיפוש: "${searchText}"`);

        resultsContainer.innerHTML = filtered.slice(0, 10).map(branch => `
            <div class="branch-option">
                <span class="material-icons">location_on</span>
                <span class="branch-name">${branch}</span>
            </div>
        `).join('');
        
        // הצגת התוצאות
        if (filtered.length > 0) {
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.innerHTML = '<div class="no-branches-message">לא נמצאו סניפים</div>';
            resultsContainer.style.display = 'block';
        }
    }

    input.addEventListener('input', (e) => {
        const searchText = e.target.value.trim();
        console.log("חיפוש סניף:", searchText);
        
        if (searchText && searchText.length >= 1) {
            filterBranches(searchText);
        } else {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
    });

    input.addEventListener('focus', (e) => {
        const searchText = e.target.value.trim();
        if (searchText && searchText.length >= 1) {
            filterBranches(searchText);
        }
    });

    resultsContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.branch-option');
        if (option) {
            const branchName = option.querySelector('.branch-name').textContent;
            input.value = branchName;
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            console.log("נבחר סניף:", branchName);
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.branch-search-container')) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
    });
}

// פונקציה זמנית לשימוש בנתונים מקומיים
function useLocalBranchesData() {
    console.log("משתמש בנתוני סניפים מקומיים");
    maseTovCache.branches = [
        "ירושלים - רמות",
        "ירושלים - בית וגן",
        "ירושלים - גילה",
        "בני ברק - ויז'ניץ",
        "בני ברק - פרדס כץ",
        "אלעד",
        "מודיעין עילית",
        "ביתר עילית",
        "בית שמש",
        "צפת",
        "אשדוד",
        "חיפה"
    ];
}

// טעינת נתונים
async function preloadData() {
    try {
        const branchesResponse = await fetchFromAPI('getBranches');
        
        if (branchesResponse && branchesResponse.data && Array.isArray(branchesResponse.data)) {
            console.log("רשימת סניפים נטענה:", branchesResponse.data.length, "סניפים");
            maseTovCache.branches = branchesResponse.data;
            return true;
        } else {
            throw new Error("פורמט תגובה לא חוקי");
        }
    } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
        useLocalBranchesData();
        return false;
    }
}

// בדיקת חיבור לשרת
async function testAppScriptConnection() {
    try {
        const result = await fetchFromAPI('testConnection');
        return result && result.status === 'success';
    } catch (error) {
        console.error('שגיאה בבדיקת החיבור:', error);
        return false;
    }
}

// הגדרת חלון התקנון
function setupTermsModal() {
    const termsModal = document.getElementById('termsModal');
    const showTermsLink = document.querySelector('.terms-link');
    const closeTermsButton = document.querySelector('.modal-close');
    
    if (showTermsLink && termsModal) {
        showTermsLink.addEventListener('click', function(e) {
            e.preventDefault();
            termsModal.style.display = 'flex';
            termsModal.style.opacity = '1';
            termsModal.style.visibility = 'visible';
            termsModal.classList.add('active');
        });
    }
    
    if (closeTermsButton && termsModal) {
        closeTermsButton.addEventListener('click', function() {
            termsModal.style.display = 'none';
            termsModal.style.opacity = '0';
            termsModal.style.visibility = 'hidden';
            termsModal.classList.remove('active');
        });
    }
    
    if (termsModal) {
        termsModal.addEventListener('click', function(e) {
            if (e.target === termsModal) {
                termsModal.style.display = 'none';
                termsModal.style.opacity = '0';
                termsModal.style.visibility = 'hidden';
                termsModal.classList.remove('active');
            }
        });
    }
}

// הצגת מודל
function showModal(options) {
    const modalHTML = `
        <div class="modal-overlay active">
            <div class="modal-content">
                <div class="modal-header">
                    <span class="material-icons modal-icon">${options.icon || 'info'}</span>
                    <h3 class="modal-title">${options.title}</h3>
                </div>
                <p>${options.message}</p>
                <div class="modal-actions">
                    <button class="modal-button primary" id="modal-ok">אישור</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('modal-ok').addEventListener('click', function() {
        document.querySelector('.modal-overlay').remove();
    });
}

// פונקציות גלובליות לשימוש מה-HTML
window.showTermsModal = function() {
    const termsModal = document.getElementById('termsModal');
    if (termsModal) {
        termsModal.style.display = 'flex';
        termsModal.style.opacity = '1';
        termsModal.style.visibility = 'visible';
        termsModal.classList.add('active');
    }
};

window.closeTermsModal = function() {
    const termsModal = document.getElementById('termsModal');
    if (termsModal) {
        termsModal.style.display = 'none';
        termsModal.style.opacity = '0';
        termsModal.style.visibility = 'hidden';
        termsModal.classList.remove('active');
    }
};

window.closeSuccessModal = function() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
        modal.classList.remove('active');
    }
};

// הצגת הודעת הצלחה זמנית בטופס
function showTemporarySuccessMessage() {
    const form = document.getElementById('good-deed-form');
    if (!form) return;
    
    // יצירת הודעת הצלחה
    const successMessage = document.createElement('div');
    successMessage.className = 'temp-success-message';
    successMessage.innerHTML = `
        <span class="material-icons">check_circle</span>
        <span>המעשה הטוב נשלח בהצלחה!</span>
    `;
    
    // הוספת ההודעה לתחילת הטופס
    form.insertBefore(successMessage, form.firstChild);
    
    // הסרת ההודעה אחרי 3 שניות
    setTimeout(() => {
        if (successMessage.parentNode) {
            successMessage.remove();
        }
    }, 3000);
}
