document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    fetchAndDisplayWinners();
});

let currentWinners = [];

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
    
    if (!winners || winners.length === 0) {
        if (winnersList) winnersList.style.display = 'none';
        if (noWinners) noWinners.style.display = 'flex';
        return;
    }
    
    if (noWinners) noWinners.style.display = 'none';
    if (winnersList) {
        winnersList.style.display = 'flex';
        winnersList.innerHTML = winners.map(winner => `
            <div class="winner-card">
                <div class="winner-medal">
                    <span class="material-icons">emoji_events</span>
                </div>
                <div class="winner-info">
                    <h3>${winner.name || 'לא צוין שם'}</h3>
                    <div class="winner-details">
                        <div class="winner-detail">
                            <span class="material-icons">location_on</span>
                            <span>סניף: ${winner.branch || 'לא צוין סניף'}</span>
                        </div>
                        ${winner.prize ? `
                        <div class="winner-detail">
                            <span class="material-icons">card_giftcard</span>
                            <span>זכייה: ${winner.prize}</span>
                        </div>
                        ` : ''}
                        ${winner.quiz ? `
                        <div class="winner-detail">
                            <span class="material-icons">quiz</span>
                            <span>עבור: ${winner.quiz}</span>
                        </div>
                        ` : ''}
                        ${winner.date ? `
                        <div class="winner-detail">
                            <span class="material-icons">event</span>
                            <span>תאריך: ${winner.date}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function displayError(message) {
    const winnersList = document.getElementById('winnersList');
    const noWinners = document.getElementById('noWinners');
    
    if (winnersList) {
        winnersList.style.display = 'block';
        winnersList.innerHTML = `
            <div class="error-message">
                <span class="material-icons">error</span>
                <p>${message}</p>
            </div>
        `;
    }
    if (noWinners) noWinners.style.display = 'none';
} 