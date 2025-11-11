// משתנים גלובליים לחידון
let currentQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let currentUserDetails = null;

// משתנים לניהול סאונדים
let backgroundSound = null;
let isSoundEnabled = true;
let soundToggleButton = null;

async function startQuiz(userDetails) {
    // בדיקה אם החידון זמין
    if (!CONFIG.quiz.isAvailable) {
        window.location.href = 'quiz-unavailable.html';
        return;
    }

    if (!userDetails || !userDetails.userName || !userDetails.branch || !userDetails.phone) {
        showModal({
            title: 'שגיאת טופס',
            message: 'אנא מלא את כל פרטי המשתמש',
            icon: 'warning'
        });
        return;
    }

    // בדיקת תקינות הסניף
    if (!validateBranch(document.getElementById('branch'))) {
        showModal({
            title: 'שגיאת טופס',
            message: 'אנא בחר סניף מהרשימה',
            icon: 'warning'
        });
        return;
    }

    showLoading();
    try {
        // אם השאלות עדיין לא נטענו, נטען אותן
        if (!cache.questions) {
            const response = await fetchFromAPI('getQuestions');
            cache.questions = response.data;
        }

        if (!cache.questions || cache.questions.length === 0) {
            throw new Error('לא נמצאו שאלות לחידון');
        }

        // שמירת פרטי המשתמש
        currentUserDetails = userDetails;

        // איתחול מערך התשובות
        currentQuestions = cache.questions;
        userAnswers = new Array(currentQuestions.length).fill(null);
        currentQuestionIndex = 0;

        // עדכון מספר השאלות הכולל
        document.getElementById('totalQuestions').textContent = currentQuestions.length;

        // הסתרת טופס ההרשמה והצגת החידון
        const registrationForm = document.getElementById('registration-form');
        const quizSection = document.getElementById('quiz-section');
        
        console.log('Hiding registration form, showing quiz section');
        registrationForm.style.display = 'none';
        quizSection.style.display = 'block';
        quizSection.classList.remove('hidden');

        // יצירת אינדיקטורים לשאלות
        createQuestionIndicators();

        // הצגת השאלה הראשונה
        showQuestion(0);

        // התחלת נגינת סאונד רקע
        startBackgroundSound();

    } catch (error) {
        console.error('שגיאה בהתחלת החידון:', error);
        showModal({
            title: 'שגיאה',
            message: error.message || 'אירעה שגיאה בטעינת החידון, נסה שוב בעוד כמה דקות או צור קשר עם האחראי',
            icon: 'error'
        });
    } finally {
        hideLoading();
    }
}

async function submitQuiz() {
    // שמירת התשובה האחרונה לפני הגשה
    saveCurrentAnswer();

    // בדיקה אם יש שאלות שלא נענו
    const unansweredCount = userAnswers.filter(answer => answer === null || answer === '').length;
    if (unansweredCount > 0) {
        // יצירת דיאלוג מותאם אישית
        const confirmDialogHTML = `
            <div id="confirm-dialog" class="custom-dialog">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <span class="material-icons warning-icon">warning</span>
                        <h2>שאלות ללא מענה</h2>
                    </div>
                    <p>נותרו ${unansweredCount} שאלות ללא מענה. האם ברצונך להגיש את החידון?</p>
                    <div class="dialog-buttons">
                        <button id="cancel-submit" class="secondary-button">חזור לחידון</button>
                        <button id="confirm-submit" class="primary-button">הגש חידון</button>
                    </div>
                </div>
            </div>
        `;
        
        // הוספת הדיאלוג לדף
        document.body.insertAdjacentHTML('beforeend', confirmDialogHTML);
        
        // הוספת מאזיני אירועים לכפתורים
        document.getElementById('confirm-submit').addEventListener('click', () => {
            document.getElementById('confirm-dialog').remove();
            submitQuizToServer();
        });
        
        document.getElementById('cancel-submit').addEventListener('click', () => {
            document.getElementById('confirm-dialog').remove();
        });
        return;
    }

    submitQuizToServer();
}

async function submitQuizToServer() {
    showLoading();
    try {
        if (!currentUserDetails) {
            hideLoading();
            alert('לא נמצאו פרטי משתמש');
            return;
        }

        // עצירת סאונד הרקע לפני הגשת החידון
        stopBackgroundSound();

        const result = await fetchFromAPI('submitQuiz', 'POST', {
            userDetails: currentUserDetails,
            answers: userAnswers
        });
        
        if (result.success) {
            // קודם נסתיר את מסך הטעינה
            hideLoading();
            
            // נשנה את תצוגת הדף להודעת הצלחה
            document.body.innerHTML = `
                <div class="success-page">
                    <canvas id="confetti-canvas"></canvas>
                    <div class="success-container">
                        <div class="success-icon-wrapper">
                            <span class="material-icons success-icon">celebration</span>
                            <div class="success-sparkles">
                                <span class="sparkle sparkle-1">✨</span>
                                <span class="sparkle sparkle-2">⭐</span>
                                <span class="sparkle sparkle-3">✨</span>
                                <span class="sparkle sparkle-4">⭐</span>
                            </div>
                        </div>
                        <h1 class="success-title">אשריך!</h1>
                        <div class="success-message">
                            <p class="message-line">התשובות נקלטו בהצלחה!</p>
                            <p class="message-line">נתראה בחידון הבא</p>
                            <p class="message-line highlight">הזוכים יפורסמו באתר במהלך שבוע הבא</p>
                        </div>
                        <button class="success-button" onclick="window.location.href='index.html'">
                            <span class="material-icons">home</span>
                            חזרה לדף הבית
                        </button>
                    </div>
                </div>
                <style>
                    .success-page {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        background: linear-gradient(135deg, #8B0000 0%, #A0522D 50%, #B8860B 100%);
                        font-family: 'Heebo', sans-serif;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    #confetti-canvas {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                        z-index: 1;
                    }
                    
                    .success-container {
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 248, 220, 0.98) 100%);
                        border-radius: 30px;
                        padding: 3rem 2.5rem;
                        max-width: 90%;
                        width: 600px;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(255, 215, 0, 0.3);
                        position: relative;
                        z-index: 2;
                        border: 3px solid #FFD700;
                        animation: successFadeIn 0.8s ease-out;
                    }
                    
                    @keyframes successFadeIn {
                        from {
                            opacity: 0;
                            transform: scale(0.8) translateY(30px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                    
                    .success-icon-wrapper {
                        position: relative;
                        display: inline-block;
                        margin-bottom: 1.5rem;
                    }
                    
                    .success-icon {
                        font-size: 100px;
                        color: #FFD700;
                        text-shadow: 0 4px 20px rgba(255, 215, 0, 0.6);
                        animation: iconBounce 1s ease-in-out infinite;
                        display: block;
                    }
                    
                    @keyframes iconBounce {
                        0%, 100% { transform: translateY(0) scale(1); }
                        50% { transform: translateY(-10px) scale(1.1); }
                    }
                    
                    .success-sparkles {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        pointer-events: none;
                    }
                    
                    .sparkle {
                        position: absolute;
                        font-size: 30px;
                        animation: sparkleFloat 2s ease-in-out infinite;
                    }
                    
                    .sparkle-1 {
                        top: -20px;
                        left: 20%;
                        animation-delay: 0s;
                    }
                    
                    .sparkle-2 {
                        top: -20px;
                        right: 20%;
                        animation-delay: 0.5s;
                    }
                    
                    .sparkle-3 {
                        bottom: -20px;
                        left: 30%;
                        animation-delay: 1s;
                    }
                    
                    .sparkle-4 {
                        bottom: -20px;
                        right: 30%;
                        animation-delay: 1.5s;
                    }
                    
                    @keyframes sparkleFloat {
                        0%, 100% {
                            transform: translateY(0) rotate(0deg);
                            opacity: 0.7;
                        }
                        50% {
                            transform: translateY(-15px) rotate(180deg);
                            opacity: 1;
                        }
                    }
                    
                    .success-title {
                        color: #8B0000;
                        margin: 0 0 1.5rem 0;
                        font-size: 3rem;
                        font-weight: 900;
                        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                        animation: titleGlow 2s ease-in-out infinite;
                    }
                    
                    @keyframes titleGlow {
                        0%, 100% {
                            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1), 0 0 10px rgba(255, 215, 0, 0.3);
                        }
                        50% {
                            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1), 0 0 20px rgba(255, 215, 0, 0.6);
                        }
                    }
                    
                    .success-message {
                        margin-bottom: 2.5rem;
                    }
                    
                    .message-line {
                        color: #2c3e50;
                        margin-bottom: 0.8rem;
                        line-height: 1.8;
                        font-size: 1.2rem;
                        font-weight: 500;
                        animation: messageFadeIn 0.6s ease-out backwards;
                    }
                    
                    .message-line:nth-child(1) {
                        animation-delay: 0.2s;
                    }
                    
                    .message-line:nth-child(2) {
                        animation-delay: 0.4s;
                    }
                    
                    .message-line:nth-child(3) {
                        animation-delay: 0.6s;
                    }
                    
                    @keyframes messageFadeIn {
                        from {
                            opacity: 0;
                            transform: translateX(-20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }
                    
                    .message-line.highlight {
                        color: #B8860B;
                        font-weight: 700;
                        font-size: 1.3rem;
                        margin-top: 1rem;
                    }
                    
                    .success-button {
                        background: linear-gradient(135deg, #B8860B 0%, #FFD700 50%, #B8860B 100%);
                        color: #8B0000;
                        border: 2px solid #FFD700;
                        padding: 1rem 2.5rem;
                        border-radius: 50px;
                        font-size: 1.2rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.5rem;
                        box-shadow: 0 8px 25px rgba(184, 134, 11, 0.4);
                        animation: buttonPulse 2s ease-in-out infinite;
                    }
                    
                    @keyframes buttonPulse {
                        0%, 100% {
                            box-shadow: 0 8px 25px rgba(184, 134, 11, 0.4);
                        }
                        50% {
                            box-shadow: 0 8px 35px rgba(184, 134, 11, 0.6), 0 0 20px rgba(255, 215, 0, 0.4);
                        }
                    }
                    
                    .success-button:hover {
                        transform: translateY(-3px);
                        box-shadow: 0 12px 40px rgba(184, 134, 11, 0.6), 0 0 30px rgba(255, 215, 0, 0.5);
                    }
                    
                    .success-button:active {
                        transform: translateY(-1px);
                    }
                    
                    .success-button .material-icons {
                        font-size: 1.5rem;
                    }
                    
                    @media (max-width: 768px) {
                        .success-container {
                            padding: 2rem 1.5rem;
                            width: 95%;
                        }
                        
                        .success-icon {
                            font-size: 80px;
                        }
                        
                        .success-title {
                            font-size: 2.2rem;
                        }
                        
                        .message-line {
                            font-size: 1.1rem;
                        }
                        
                        .message-line.highlight {
                            font-size: 1.2rem;
                        }
                        
                        .success-button {
                            padding: 0.9rem 2rem;
                            font-size: 1.1rem;
                        }
                        
                        .sparkle {
                            font-size: 24px;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .success-container {
                            padding: 1.5rem 1rem;
                        }
                        
                        .success-icon {
                            font-size: 70px;
                        }
                        
                        .success-title {
                            font-size: 1.8rem;
                        }
                        
                        .message-line {
                            font-size: 1rem;
                        }
                        
                        .message-line.highlight {
                            font-size: 1.1rem;
                        }
                        
                        .success-button {
                            padding: 0.8rem 1.5rem;
                            font-size: 1rem;
                            width: 100%;
                            max-width: 300px;
                        }
                    }
                </style>
            `;
            
            // נגינת סאונד מחיאות כפיים למשך 4 שניות
            playApplauseSound();
            
            // יצירת אפקט קונפטי אחרי שהדף נטען
            setTimeout(() => {
                createConfetti();
            }, 100);
        } else {
            throw new Error('שגיאה בהגשת החידון');
        }
    } catch (error) {
        console.error('שגיאה בהגשת החידון:', error);
        hideLoading();
        alert('שגיאה בהגשת החידון: ' + (error.message || 'אירעה שגיאה בהגשת החידון. אנא נסה שוב.'));
    }
}

function createQuestionIndicators() {
    // מחיקת אינדיקטורים קיימים אם יש
    const existingContainer = document.querySelector('.questions-status');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    const container = document.createElement('div');
    container.className = 'questions-status';
    
    for (let i = 0; i < currentQuestions.length; i++) {
        const indicator = document.createElement('div');
        indicator.className = 'question-indicator';
        if (i === 0) {
            indicator.classList.add('current');
        }
        indicator.addEventListener('click', () => {
            saveCurrentAnswer();
            if (currentQuestionIndex !== i) {
                playSound('next');
            }
            currentQuestionIndex = i;
            showQuestion(i);
        });
        container.appendChild(indicator);
    }
    
    document.querySelector('.progress-container').after(container);
}

function updateQuestionIndicators() {
    const indicators = document.querySelectorAll('.question-indicator');
    indicators.forEach((indicator, index) => {
        indicator.classList.remove('answered', 'current');
        if (userAnswers[index] !== null) {
            indicator.classList.add('answered');
        }
        if (index === currentQuestionIndex) {
            indicator.classList.add('current');
        }
    });
}

async function testAppScriptConnection() {
    showLoading();
    try {
        const result = await fetchFromAPI('testConnection');
        if (result && result.status === 'success') {
            return true;
        }
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
                message: 'אירעה שגיאה בהתחברות למערכת. אנא נסה שוב מאוחר יותר, אם הבעיה ממשיכה אנא צרו קשר.',
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

function updateBranchList(branches) {
    const input = document.getElementById('branch');
    const resultsContainer = input.parentElement.querySelector('.branch-results');

    // פונקציה לסינון והצגת תוצאות
    function filterBranches(searchText) {
        const filtered = branches.filter(branch => 
            branch.toLowerCase().includes(searchText.toLowerCase())
        );

        console.log('Filtering branches:', searchText, 'Found:', filtered.length);

        resultsContainer.innerHTML = filtered.map(branch => `
            <div class="branch-option">
                <span class="material-icons">location_on</span>
                <span class="branch-name">${branch}</span>
            </div>
        `).join('');
        
        // הצגת או הסתרת הרשימה בהתאם לתוצאות
        if (filtered.length > 0) {
            resultsContainer.style.display = 'block';
            console.log('Showing branch results');
        } else {
            resultsContainer.style.display = 'none';
            console.log('Hiding branch results');
        }
    }

    // מאזיני אירועים
    input.addEventListener('input', (e) => {
        const searchText = e.target.value.trim();
        if (searchText) {
            filterBranches(searchText);
        } else {
            resultsContainer.innerHTML = '';
        }
    });

    // בחירת סניף מהרשימה
    resultsContainer.addEventListener('click', (e) => {
        const option = e.target.closest('.branch-option');
        if (option) {
            const branchName = option.querySelector('.branch-name').textContent;
            input.value = branchName;
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
            validateBranch(input);
        }
    });

    // סגירת הרשימה בלחיצה מחוץ לאזור החיפוש
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.branch-search-container')) {
            resultsContainer.innerHTML = '';
            resultsContainer.style.display = 'none';
        }
    });
}

// וולידציה של הסניף
function validateBranch(input) {
    const branch = input.value;
    const errorElement = input.parentElement.querySelector('.error-message');
    
    if (!cache.branches) {
        return true; // נאפשר אם הנתונים עדיין לא נטענו
    }
    
    if (!cache.branches.includes(branch)) {
        input.classList.add('invalid');
        if (!errorElement) {
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = 'אנא בחר סניף מהרשימה';
            input.parentElement.appendChild(error);
        }
        return false;
    }
    
    input.classList.remove('invalid');
    if (errorElement) {
        errorElement.remove();
    }
    return true;
}

function initializeEventListeners() {
    // הגשת טופס ההרשמה
    document.getElementById('userDetailsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        // בדיקת תקינות הסניף לפני שליחה
        const branchInput = document.getElementById('branch');
        if (!validateBranch(branchInput)) {
            return;
        }

        const formData = {
            userName: document.getElementById('userName').value,
            branch: document.getElementById('branch').value,
            phone: document.getElementById('phone').value
        };

        // שמירת הפרטים בזיכרון המקומי אם המשתמש ביקש
        if (document.getElementById('rememberMe').checked) {
            localStorage.setItem('userDetails', JSON.stringify(formData));
        } else {
            localStorage.removeItem('userDetails');
        }

        // מעבר לחידון
        startQuiz(formData);
    });

    // וולידציה למספר טלפון
    document.getElementById('phone').addEventListener('input', (e) => {
        const phone = e.target.value.replace(/\D/g, '');
        if (phone.length > 10) {
            e.target.value = phone.slice(0, 10);
        } else {
            e.target.value = phone;
        }
    });

    // וולידציה לשדה הסניף
    const branchInput = document.getElementById('branch');
    branchInput.addEventListener('input', () => {
        validateBranch(branchInput);
    });

    branchInput.addEventListener('blur', () => {
        validateBranch(branchInput);
    });

    // עדכון פונקציית prevQuestion לטיפול בביטול החידון
    document.getElementById('prevQuestion').addEventListener('click', () => {
        if (currentQuestionIndex === 0) {
            // אם זו השאלה הראשונה, נראה חלון אישור לביטול החידון
            // יצירת דיאלוג מותאם אישית לביטול החידון
            const cancelDialogHTML = `
                <div id="cancel-dialog" class="custom-dialog">
                    <div class="dialog-content">
                        <div class="dialog-header">
                            <span class="material-icons warning-icon">warning</span>
                            <h2>ביטול חידון</h2>
                        </div>
                        <p>האם אתה בטוח שברצונך לבטל את החידון?</p>
                        <div class="dialog-buttons">
                            <button id="continue-quiz" class="secondary-button">לא, המשך חידון</button>
                            <button id="cancel-quiz" class="primary-button">כן, בטל חידון</button>
                        </div>
                    </div>
                </div>
            `;
            
            // הוספת הדיאלוג לדף
            document.body.insertAdjacentHTML('beforeend', cancelDialogHTML);
            
            // הוספת מאזיני אירועים לכפתורים
            document.getElementById('cancel-quiz').addEventListener('click', () => {
                document.getElementById('cancel-dialog').remove();
                // עצירת סאונד הרקע
                stopBackgroundSound();
                // חזרה לטופס ההרשמה
                const quizSection = document.getElementById('quiz-section');
                const registrationForm = document.getElementById('registration-form');
                
                quizSection.style.display = 'none';
                quizSection.classList.add('hidden');
                registrationForm.style.display = 'block';
                registrationForm.classList.remove('hidden');
                
                // איפוס נתוני החידון
                currentQuestions = [];
                userAnswers = [];
                currentQuestionIndex = 0;
            });
            
            document.getElementById('continue-quiz').addEventListener('click', () => {
                document.getElementById('cancel-dialog').remove();
            });
            return;
        }

        saveCurrentAnswer();
        playSound('next');
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    });
    
    document.getElementById('nextQuestion').addEventListener('click', () => {
        saveCurrentAnswer();
        if (currentQuestionIndex < currentQuestions.length - 1) {
            playSound('next');
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
        }
    });
    
    document.getElementById('submitQuiz').addEventListener('click', submitQuiz);

    // טיפול בכפתור השתקת הסאונד
    soundToggleButton = document.getElementById('soundToggle');
    if (soundToggleButton) {
        soundToggleButton.addEventListener('click', toggleSound);
    }
}

function showQuestion(index) {
    const question = currentQuestions[index];
    const container = document.getElementById('question-container');
    
    // עדכון סרגל התקדמות
    const progressBar = document.querySelector('.progress-bar');
    const progress = ((index + 1) / currentQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    // עדכון מספרי השאלות
    document.getElementById('currentQuestion').textContent = index + 1;
    document.getElementById('totalQuestions').textContent = currentQuestions.length;

    // עדכון עיגולי התקדמות קיימים
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, i) => {
        dot.className = 'progress-dot';
        if (i === index) {
            dot.classList.add('active');
        }
        if (i < index) {
            dot.classList.add('completed');
        }
    });
    
    // עדכון אינדיקטורים
    updateQuestionIndicators();
    
    // הוספת ההקדמה לפני השאלות הראשונות
    let introductionHTML = '';
    if (index === 0 && CONFIG.quiz.introductionText) {
        introductionHTML = `
            <div class="quiz-introduction">
                <h3>הקדמה חשובה לשאלות הבאות</h3>
                <p>${CONFIG.quiz.introductionText}</p>
            </div>
        `;
    }
    
    container.innerHTML = `
        ${introductionHTML}
        <div class="question">
            <h3>${question.question}</h3>
            ${question.type === 'אמריקאי' ? 
                `<div class="options">
                    ${question.options.map((option, i) => `
                        <label class="option">
                            <input type="radio" name="q${index}" value="${option}" 
                                ${userAnswers[index] === option ? 'checked' : ''}>
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>` :
                `<textarea class="open-answer" rows="4">${userAnswers[index] || ''}</textarea>`
            }
        </div>
    `;
    
    // הוספת מאזין אירועים לתשובות אמריקאיות
    if (question.type === 'אמריקאי') {
        const radioInputs = container.querySelectorAll('input[type="radio"]');
        radioInputs.forEach(input => {
            input.addEventListener('change', () => {
                if (isSoundEnabled) {
                    playSound('good');
                }
            });
        });
    }
    
    // עדכון כפתורי הניווט
    const prevButton = document.getElementById('prevQuestion');
    const nextButton = document.getElementById('nextQuestion');
    const submitButton = document.getElementById('submitQuiz');
    
    // הסתרת הכפתורים
    if (index === 0) {
        prevButton.style.display = 'block';
        prevButton.innerHTML = `<span class="material-icons">close</span>ביטול חידון`;
        prevButton.classList.add('cancel-button');
    } else {
        prevButton.style.display = 'block';
        prevButton.classList.remove('cancel-button');
        prevButton.innerHTML = `<span class="material-icons">arrow_forward</span>הקודם`;
    }
    
    if (index === currentQuestions.length - 1) {
        nextButton.style.display = 'none';
    } else {
        nextButton.style.display = 'block';
        nextButton.innerHTML = `הבא<span class="material-icons">arrow_back</span>`;
    }
    
    submitButton.classList.toggle('hidden', index !== currentQuestions.length - 1);
}

function saveCurrentAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    if (!question) return;

    if (question.type === 'אמריקאי') {
        const selected = document.querySelector(`input[name="q${currentQuestionIndex}"]:checked`);
        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        if (selected) {
            selected.closest('.option').classList.add('selected');
            userAnswers[currentQuestionIndex] = selected.value;
        }
    } else {
        const answer = document.querySelector('.open-answer').value.trim();
        userAnswers[currentQuestionIndex] = answer;
    }

    updateQuestionIndicators();
}

// פונקציות ניווט
function nextQuestion() {
    saveCurrentAnswer();
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    }
}

function previousQuestion() {
    saveCurrentAnswer();
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    }
}

// איפוס החידון
function resetQuiz() {
    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuestions.length).fill(null);
    showQuestion(0);
}

// טעינת שאלות החידון
async function loadQuestions() {
    try {
        showLoading();
        const submitButton = document.querySelector('#userDetailsForm button[type="submit"]');
        submitButton.disabled = true;
        submitButton.classList.add('loading-button');
        submitButton.innerHTML = '<div class="spinner"></div>אנא המתן...';

        const response = await fetchFromAPI('getQuestions');
        cache.questions = response.data;
        
        hideLoading();
        submitButton.disabled = false;
        submitButton.classList.remove('loading-button');
        submitButton.innerHTML = 'התחל חידון';
        
        return response.data;
    } catch (error) {
        console.error('Error loading questions:', error);
        showModal({
            title: 'שגיאה',
            message: 'אירעה שגיאה בטעינת השאלות. אנא נסה שוב מאוחר יותר.',
            icon: 'error'
        });
        const submitButton = document.querySelector('#userDetailsForm button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = 'אירעה שגיאה';
    }
}

// עדכון סרגל התקדמות
function updateProgress() {
    const progressBar = document.querySelector('.progress-bar');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const totalQuestionsSpan = document.getElementById('totalQuestions');
    
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;
    
    currentQuestionSpan.textContent = currentQuestionIndex + 1;
    totalQuestionsSpan.textContent = currentQuestions.length;
    
    // עדכון עיגולי התקדמות קיימים במקום ליצור חדשים
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => {
        dot.className = 'progress-dot';
        if (index === currentQuestionIndex) {
            dot.classList.add('active');
        }
        if (index < currentQuestionIndex) {
            dot.classList.add('completed');
        }
    });
}

// מעבר לשאלה הבאה
function showNextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    }
}

// מעבר לשאלה הקודמת
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    }
}

// הצגת השאלה הנוכחית
function showCurrentQuestion() {
    showQuestion(currentQuestionIndex);
}

document.addEventListener('DOMContentLoaded', async () => {
    initDarkMode();

    // טעינת העדפת הסאונד מהזיכרון המקומי
    const savedSoundPreference = localStorage.getItem('quizSoundEnabled');
    if (savedSoundPreference !== null) {
        isSoundEnabled = savedSoundPreference === 'true';
    }
    
    // עדכון כפתור ההשתקה בהתאם להעדפה
    soundToggleButton = document.getElementById('soundToggle');
    if (soundToggleButton) {
        const icon = soundToggleButton.querySelector('.material-icons');
        if (isSoundEnabled) {
            icon.textContent = 'volume_up';
            soundToggleButton.title = 'השתק סאונד';
        } else {
            icon.textContent = 'volume_off';
            soundToggleButton.title = 'הפעל סאונד';
        }
    }

    // וידוא שהטופס מוצג והחידון מוסתר בתחילת הטעינה
    const registrationForm = document.getElementById('registration-form');
    const quizSection = document.getElementById('quiz-section');
    
    registrationForm.style.display = 'block';
    registrationForm.classList.remove('hidden');
    quizSection.style.display = 'none';
    quizSection.classList.add('hidden');

    // טיפול בהודעה לפני החידון
    if (CONFIG.quiz.showAnnouncement) {
        const announcement = document.getElementById('quiz-announcement');
        const closeBtn = document.querySelector('.close-announcement');
        const startQuizBtn = document.querySelector('.start-quiz-btn');
        const announcementText = document.getElementById('announcement-text');
        
        // עדכון תוכן ההודעה מהקונפיגורציה
        if (CONFIG.quiz.announcementText) {
            announcementText.textContent = CONFIG.quiz.announcementText;
        }
        
        // סגירת ההודעה והתחלת החידון
        function closeAnnouncement() {
            announcement.style.opacity = '0';
            setTimeout(() => {
                announcement.style.display = 'none';
            }, 300);
        }
        
        closeBtn.addEventListener('click', closeAnnouncement);
        startQuizBtn.addEventListener('click', closeAnnouncement);
    } else {
        // אם לא צריך להציג הודעה, הסתר אותה
        document.getElementById('quiz-announcement').style.display = 'none';
    }

    // נעילת כפתור התחלת החידון
    const submitButton = document.querySelector('#userDetailsForm button[type="submit"]');
    submitButton.disabled = true;
    submitButton.classList.add('loading-button');
    submitButton.innerHTML = '<div class="spinner"></div>אנא המתן...';

    // בדיקת חיבור ראשונית
    const isConnected = await testAppScriptConnection();
    if (!isConnected) return;

    try {
        // התחלת טעינת נתונים ברקע
        const preloadPromise = preloadData();

        // טיפול בזכירת פרטי המשתמש
        const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
        if (userDetails.userName) {
            document.getElementById('userName').value = userDetails.userName;
            document.getElementById('branch').value = userDetails.branch;
            document.getElementById('phone').value = userDetails.phone;
            document.getElementById('rememberMe').checked = true;
        }

        // המתנה לסיום טעינת הנתונים
        await preloadPromise;
        
        // שחרור כפתור התחלת החידון
        submitButton.disabled = false;
        submitButton.classList.remove('loading-button');
        submitButton.innerHTML = 'התחל חידון';

            // עדכון רשימת הסניפים בממשק
    if (cache.branches) {
        console.log('Branches loaded:', cache.branches.length);
        updateBranchList(cache.branches);
    } else {
        console.log('No branches loaded');
    }

    } catch (error) {
        console.error('שגיאה באתחול:', error);
        submitButton.disabled = true;
        submitButton.innerHTML = 'אירעה שגיאה';
        showModal({
            title: 'שגיאה',
            message: 'אירעה שגיאה בטעינת הנתונים. אנא רענן את הדף.',
            icon: 'error'
        });
    }

    // הוספת מאזיני אירועים
    initializeEventListeners();
});

// הוספת סגנונות לדיאלוגים המותאמים אישית
const customDialogStyles = `
<style id="custom-dialog-styles">
    .custom-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    }
    
    .dialog-content {
        background-color: white;
        border-radius: 8px;
        padding: 30px;
        max-width: 90%;
        width: 500px;
        text-align: center;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    }
    
    .dialog-header {
        margin-bottom: 20px;
    }
    
    .warning-icon {
        font-size: 50px;
        color: #FFC107;
        margin-bottom: 10px;
    }
    
    .dialog-content h2 {
        color: #333;
        margin: 0 0 10px 0;
        font-size: 22px;
    }
    
    .dialog-content p {
        color: #666;
        margin-bottom: 25px;
        line-height: 1.6;
        font-size: 16px;
    }
    
    .dialog-buttons {
        display: flex;
        justify-content: center;
        gap: 15px;
    }
    
    .primary-button {
        background-color: #1abc9c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .secondary-button {
        background-color: #f1f1f1;
        color: #333;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    
    .primary-button:hover {
        background-color: #16a085;
    }
    
    .secondary-button:hover {
        background-color: #e0e0e0;
    }
</style>
`;

// הוספת הסגנונות לדף
document.head.insertAdjacentHTML('beforeend', customDialogStyles);

// פונקציות לניהול סאונדים
function startBackgroundSound() {
    if (!isSoundEnabled) return;
    
    if (backgroundSound) {
        backgroundSound.pause();
        backgroundSound = null;
    }
    
    backgroundSound = new Audio('assets/sound/correctAns.mp3');
    backgroundSound.loop = true;
    backgroundSound.volume = 0.5; // עוצמת קול בינונית
    backgroundSound.play().catch(error => {
        console.log('שגיאה בנגינת סאונד רקע:', error);
    });
}

function stopBackgroundSound() {
    if (backgroundSound) {
        backgroundSound.pause();
        backgroundSound.currentTime = 0;
        backgroundSound = null;
    }
}

function playSound(soundType) {
    if (!isSoundEnabled) return;
    
    let soundFile = '';
    switch(soundType) {
        case 'good':
            soundFile = 'assets/sound/good.mp3';
            break;
        case 'next':
            soundFile = 'assets/sound/next.mp3';
            break;
        default:
            return;
    }
    
    const sound = new Audio(soundFile);
    sound.volume = 0.7;
    sound.play().catch(error => {
        console.log('שגיאה בנגינת סאונד:', error);
    });
}

function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    
    if (soundToggleButton) {
        const icon = soundToggleButton.querySelector('.material-icons');
        if (isSoundEnabled) {
            icon.textContent = 'volume_up';
            soundToggleButton.title = 'השתק סאונד';
            // אם החידון כבר התחיל, נפעיל את סאונד הרקע
            if (document.getElementById('quiz-section') && !document.getElementById('quiz-section').classList.contains('hidden')) {
                startBackgroundSound();
            }
        } else {
            icon.textContent = 'volume_off';
            soundToggleButton.title = 'הפעל סאונד';
            stopBackgroundSound();
        }
    }
    
    // שמירת העדפת המשתמש
    localStorage.setItem('quizSoundEnabled', isSoundEnabled);
}

// פונקציה לנגינת סאונד מחיאות כפיים
function playApplauseSound() {
    if (!isSoundEnabled) return;
    
    const applause = new Audio('assets/sound/applause.mp3');
    applause.volume = 0.8;
    applause.play().catch(error => {
        console.log('שגיאה בנגינת סאונד מחיאות כפיים:', error);
    });
    
    // עצירת הסאונד אחרי 4 שניות
    setTimeout(() => {
        applause.pause();
        applause.currentTime = 0;
    }, 4000);
}

// פונקציה ליצירת אפקט קונפטי
function createConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    
    resizeCanvas();
    
    const confettiColors = ['#FFD700', '#FF8C00', '#8B0000', '#B8860B', '#FFA500', '#FF6347'];
    const confetti = [];
    const confettiCount = Math.min(150, Math.floor(window.innerWidth / 10));
    
    // יצירת חלקיקי קונפטי
    for (let i = 0; i < confettiCount; i++) {
        confetti.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * confettiCount,
            color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncrement: Math.random() * 0.07 + 0.05,
            tiltAngle: 0
        });
    }
    
    let animationId;
    let isAnimating = true;
    
    function draw() {
        if (!isAnimating) return;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confetti.forEach((c, i) => {
            ctx.beginPath();
            ctx.lineWidth = c.r / 2;
            ctx.strokeStyle = c.color;
            ctx.moveTo(c.x + c.tilt + c.r, c.y);
            ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r);
            ctx.stroke();
            
            c.tiltAngle += c.tiltAngleIncrement;
            c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2;
            c.tilt = Math.sin(c.tiltAngle - i / 3) * 15;
            
            if (c.y > canvas.height) {
                confetti[i] = {
                    x: Math.random() * canvas.width,
                    y: -20,
                    r: c.r,
                    d: c.d,
                    color: c.color,
                    tilt: Math.floor(Math.random() * 10) - 10,
                    tiltAngleIncrement: c.tiltAngleIncrement,
                    tiltAngle: 0
                };
            }
        });
        
        animationId = requestAnimationFrame(draw);
    }
    
    draw();
    
    // טיפול בשינוי גודל החלון
    const resizeHandler = () => {
        resizeCanvas();
    };
    window.addEventListener('resize', resizeHandler);
    
    // עצירת האנימציה אחרי 5 שניות
    setTimeout(() => {
        isAnimating = false;
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        window.removeEventListener('resize', resizeHandler);
    }, 5000);
} 