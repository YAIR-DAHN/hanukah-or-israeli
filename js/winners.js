document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    fetchAndDisplayWinners();
});

let currentWinners = [];
let currentActiveTab = null;

// פונקציה גלובלית להחלפת לשונית
window.switchQuizTab = function(quizType) {
    currentActiveTab = quizType;
    
    // עדכון הלשוניות
    const tabs = document.querySelectorAll('.quiz-tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('data-quiz') === quizType) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // הצגת הזוכים של החידון הנבחר
    displayWinnersForQuiz(currentWinners, quizType);
};

async function fetchAndDisplayWinners() {
    try {
        showLoading();
        const response = await fetchFromAPI('getWinners');
        
        if (response && response.data && Array.isArray(response.data)) {
            currentWinners = response.data;
            displayWinners(currentWinners);
        } else {
            throw new Error('שגיאה בטעינת רשימת הזוכים');
        }
    } catch (error) {
        console.error('שגיאה:', error);
        displayError('אירעה שגיאה בטעינת רשימת הזוכים. אנא נסה שוב מאוחר יותר.');
    } finally {
        hideLoading();
    }
}

function displayWinners(winners) {
    const winnersList = document.getElementById('winnersList');
    const noWinners = document.getElementById('noWinners');
    const quizTabsContainer = document.getElementById('quizTabsContainer');
    const quizTabs = document.getElementById('quizTabs');
    
    if (!winners || winners.length === 0) {
        if (winnersList) winnersList.style.display = 'none';
        if (noWinners) noWinners.style.display = 'flex';
        if (quizTabsContainer) quizTabsContainer.style.display = 'none';
        return;
    }
    
    if (noWinners) noWinners.style.display = 'none';
    
    // בדיקה אם יש כמה סוגי חידונים
    const quizTypes = new Set();
    winners.forEach(winner => {
        if (winner.quiz && winner.quiz.trim() !== '') {
            quizTypes.add(winner.quiz.trim());
        }
    });
    
    const uniqueQuizTypes = Array.from(quizTypes);
    
    // אם יש יותר מסוג חידון אחד, יצירת לשוניות
    if (uniqueQuizTypes.length > 1) {
        // מיון מהסוף להתחלה (האחרון ראשון)
        uniqueQuizTypes.reverse();
        
        // יצירת לשוניות
        if (quizTabsContainer && quizTabs) {
            quizTabsContainer.style.display = 'block';
            quizTabs.innerHTML = uniqueQuizTypes.map((quizType, index) => {
                const escapedQuizType = escapeHtml(quizType);
                const jsEscapedQuizType = quizType.replace(/'/g, "\\'");
                return `
                <button class="quiz-tab ${index === 0 ? 'active' : ''}" 
                        data-quiz="${escapedQuizType}"
                        onclick="switchQuizTab('${jsEscapedQuizType}')">
                    <span class="material-icons">quiz</span>
                    <span>${escapedQuizType}</span>
                </button>
            `;
            }).join('');
            
            // הצגת הזוכים של החידון הראשון (האחרון ברשימה)
            currentActiveTab = uniqueQuizTypes[0];
            displayWinnersForQuiz(winners, uniqueQuizTypes[0]);
        }
    } else {
        // אם יש רק סוג חידון אחד או אין חידון, הצגה רגילה
        if (quizTabsContainer) quizTabsContainer.style.display = 'none';
        // אם יש סוג חידון אחד, הצג אותו, אחרת הצג את כל הזוכים
        const quizTypeToShow = uniqueQuizTypes.length === 1 ? uniqueQuizTypes[0] : null;
        displayWinnersForQuiz(winners, quizTypeToShow);
    }
}


function displayWinnersForQuiz(winners, quizType) {
    const winnersList = document.getElementById('winnersList');
    const noWinners = document.getElementById('noWinners');
    
    if (!winnersList) return;
    
    // סינון הזוכים לפי סוג החידון
    let filteredWinners;
    if (quizType) {
        filteredWinners = winners.filter(winner => {
            const winnerQuiz = winner.quiz ? winner.quiz.trim() : '';
            return winnerQuiz === quizType;
        });
    } else {
        // אם אין סוג חידון, הצגת כל הזוכים
        filteredWinners = winners;
    }
    
    if (!filteredWinners || filteredWinners.length === 0) {
        winnersList.style.display = 'none';
        if (noWinners) {
            noWinners.style.display = 'flex';
            noWinners.innerHTML = `
                <span class="material-icons">info</span>
                <p>עדיין אין זוכים ב"${escapeHtml(quizType || 'החידון')}"</p>
                <p>היה הראשון לזכות!</p>
            `;
        }
        return;
    }
    
    if (noWinners) noWinners.style.display = 'none';
    winnersList.style.display = 'flex';
    
    winnersList.innerHTML = filteredWinners.map(winner => `
        <div class="winner-card">
            <div class="winner-medal">
                    <span class="material-icons">emoji_events</span>
                </div>
            <div class="winner-info">
                <h3>${escapeHtml(winner.name || 'לא צוין שם')}</h3>
                <div class="winner-details">
                    <div class="winner-detail">
                        <span class="material-icons">location_on</span>
                        <span>סניף: ${escapeHtml(winner.branch || 'אפרת')}</span>
                    </div>
                    ${winner.prize ? `
                    <div class="winner-detail">
                        <span class="material-icons">card_giftcard</span>
                        <span>זכייה: ${escapeHtml(winner.prize)}</span>
                    </div>
                    ` : ''}
                    ${winner.quiz ? `
                    <div class="winner-detail">
                        <span class="material-icons">quiz</span>
                        <span>עבור: ${escapeHtml(winner.quiz)}</span>
                    </div>
                    ` : ''}
                    ${winner.date ? `
                    <div class="winner-detail">
                        <span class="material-icons">event</span>
                        <span>תאריך: ${escapeHtml(winner.date)}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function displayError(message) {
    const winnersList = document.getElementById('winnersList');
    const noWinners = document.getElementById('noWinners');
    const quizTabsContainer = document.getElementById('quizTabsContainer');
    
    if (quizTabsContainer) quizTabsContainer.style.display = 'none';
    
    if (winnersList) {
        winnersList.style.display = 'block';
        winnersList.innerHTML = `
            <div class="error-message">
                <span class="material-icons">error</span>
                <p>${escapeHtml(message)}</p>
            </div>
        `;
    }
    if (noWinners) noWinners.style.display = 'none';
}
