// Discussion Page JavaScript
// הגדרה גלובלית ל-commentsContainer
let commentsContainer = null;

// פונקציות גלובליות לטעינת אנימציית טעינה
function showCommentsLoading() {
    if (!commentsContainer) commentsContainer = document.getElementById('commentsContainer');
    commentsContainer.innerHTML = `
        <div class="comments-loading">
            <div class="loading-spinner"></div>
            <p>טוען תגובות...</p>
        </div>
    `;
}
function hideCommentsLoading() {
    if (!commentsContainer) commentsContainer = document.getElementById('commentsContainer');
    const loadingElement = commentsContainer.querySelector('.comments-loading');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// פונקציה גלובלית להצגת התראות
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
    `;
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;
    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        margin: 0;
    `;
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    // Add to page
    document.body.appendChild(notification);
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// פונקציה גלובלית להצגת תגובה
function addCommentToDisplay(comment, parentName = null, repliesMap = null) {
    console.log('Adding comment to display:', comment, 'Parent:', parentName);

    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    commentElement.setAttribute('data-comment-id', comment.id);

    // Format the date properly
    let formattedDate = 'תאריך לא ידוע';
    try {
        if (comment.date) {
            // If it's already a formatted string, use it
            if (typeof comment.date === 'string' && comment.date !== 'Invalid Date') {
                formattedDate = comment.date;
            } else {
                // If it's a timestamp or Date object, format it
                const date = new Date(comment.timestamp || comment.date);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleString('he-IL', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error formatting date:', error);
    }

    console.log('Formatted date:', formattedDate);

    // Check if this is a reply to another comment
    const isReply = comment.replyTo && comment.replyTo.toString().trim() !== '';

    // Get reply count for this comment
    const replyCount = repliesMap ? repliesMap.get(comment.id.toString())?.length || 0 : 0;

    commentElement.innerHTML = `
        <div class="comment-header">
            <span class="commenter-name">${escapeHtml(comment.name)}</span>
            <span class="comment-date">${formattedDate}</span>
        </div>
        ${isReply && parentName ? `<div class="reply-indicator" style="color: #007bff; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 500;">↳ תגובה על תגובה של ${escapeHtml(parentName)}</div>` : ''}
        <div class="comment-text" contenteditable="false">${comment.text}</div>
        <div class="comment-actions">
            ${!isReply ? `
                <button class="action-btn reply-btn" onclick="showReplyForm('${comment.id}', '${escapeHtml(comment.name)}')" 
                style="  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    font-weight: 500;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);"
                >
                    <span class="material-icons" style="font-size: 1rem; margin-left: 0.25rem;">reply</span>
                    השב
                </button>
                <button class="action-btn like-btn${hasLiked(comment.id) ? ' liked' : ''}" onclick="toggleLike('${comment.id}')">
                    <span class="material-icons" style="font-size: 1rem; margin-left: 0.25rem;">thumb_up</span>
                    <span class="like-count">${comment.likes || 0}</span>
                </button>
                ${replyCount > 0 ? `
                    <button class="action-btn toggle-replies-btn" onclick="toggleReplies('${comment.id}')">
                        <span class="material-icons" style="font-size: 1rem; margin-left: 0.25rem;">expand_more</span>
                        ${replyCount} תגובות
                    </button>
                ` : ''}
                ${isCommentAuthor(comment.id, comment.name) ? `
                    <button class="action-btn edit-btn" onclick="toggleEdit('${comment.id}')">
                        <span class="material-icons" style="font-size: 1rem; margin-left: 0.25rem;">edit</span>
                        ערוך
                    </button>
                ` : ''}
            ` : `
                <button class="action-btn like-btn${hasLiked(comment.id) ? ' liked' : ''}" onclick="toggleLike('${comment.id}')">
                    <span class="material-icons" style="font-size: 1rem; margin-left: 0.25rem;">thumb_up</span>
                    <span class="like-count">${comment.likes || 0}</span>
                </button>
                ${isCommentAuthor(comment.id, comment.name) ? `
                    <button class="action-btn edit-btn" onclick="toggleEdit('${comment.id}')">
                        <span class="material-icons" style="font-size: 1rem; margin-left: 0.25rem;">edit</span>
                        ערוך
                    </button>
                ` : ''}
            `}
        </div>
        ${!isReply && replyCount > 0 ? `<div class="replies-container" id="replies-${comment.id}" style="display: none;"></div>` : ''}
    `;

    // Add special styling for replies
    if (isReply) {
        commentElement.style.marginLeft = '2rem';
        commentElement.style.borderLeft = '3px solid #007bff';
        commentElement.style.backgroundColor = '#f0f8ff';
        commentElement.style.borderRadius = '8px';
        commentElement.style.padding = '1rem';
        commentElement.style.marginTop = '0.5rem';
        commentElement.style.marginBottom = '0.5rem';
    }

    console.log('Comment HTML created, adding to container');

    // Add to end of container (so they appear in the correct order)
    commentsContainer.appendChild(commentElement);

    // Add animation
    commentElement.style.opacity = '0';
    commentElement.style.transform = 'translateY(-20px)';
    setTimeout(() => {
        commentElement.style.transition = 'all 0.3s ease';
        commentElement.style.opacity = '1';
        commentElement.style.transform = 'translateY(0)';
    }, 10);

    console.log('Comment added successfully');
    updateLikeButtons(); // Update like buttons after adding comment
}

// Function to show no comments message
function showNoCommentsMessage() {
    const noCommentsElement = document.createElement('div');
    noCommentsElement.className = 'no-comments';
    noCommentsElement.innerHTML = `
        <p style="text-align: center; color: #6c757d; font-style: italic; padding: 2rem;">
            עדיין אין תגובות לדיון זה. היה הראשון לשתף את דעתך!
        </p>
    `;
    commentsContainer.appendChild(noCommentsElement);
}

// Function to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}



document.addEventListener('DOMContentLoaded', function () {
    console.log('Discussion page loaded');
    console.log('Discussion ID:', window.DISCUSSION_ID);

    const commentForm = document.getElementById('commentForm');
    commentsContainer = document.getElementById('commentsContainer');

    console.log('Comment form:', commentForm);
    console.log('Comments container:', commentsContainer);

    // Setup sort select
    const sortSelect = document.getElementById('sortCommentsSelect');
    if (sortSelect) {
        sortSelect.value = getSortOrder();
        sortSelect.addEventListener('change', function () {
            console.log('Sort order changed to:', this.value);
            setSortOrder(this.value);
            loadComments();
        });
    }

    // Load existing comments
    console.log('Starting to load comments...');
    if (!window.DISCUSSION_ID) {
        console.error('No discussion ID found!');
        showNotification('שגיאה: מזהה דיון לא נמצא', 'error');
        return;
    }
    loadComments();

    // טעינת שם וטלפון אם קיימים - וודא שהשדות קיימים קודם
    setTimeout(() => {
        const userDetails = loadUserDetailsFromLocalStorage();
        const commenterNameField = document.getElementById('commenterName');
        const commenterPhoneField = document.getElementById('commenterPhone');

        console.log('User details loaded:', userDetails);
        console.log('Name field found:', commenterNameField);
        console.log('Phone field found:', commenterPhoneField);

        if (commenterNameField && userDetails.name) {
            commenterNameField.value = userDetails.name;
            console.log('Set name field value:', userDetails.name);
        }
        if (commenterPhoneField && userDetails.phone) {
            commenterPhoneField.value = userDetails.phone;
            console.log('Set phone field value:', userDetails.phone);
        }
    }, 100);

    // Handle form submission
    commentForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitCommentBtn');
        showLoadingState(submitBtn, true);

        const formData = new FormData(commentForm);
        const commenterName = formData.get('commenterName').trim();
        const commenterPhone = formData.get('commenterPhone').trim();
        const commentText = document.getElementById('commentText').innerHTML.trim();

        if (!commenterName || !commenterPhone || !commentText) {
            showNotification('אנא מלא את כל השדות הנדרשים', 'error');
            showLoadingState(submitBtn, false);
            return;
        }

        // Validate phone number
        const phoneRegex = /^0\d{1,2}-?\d{3}-?\d{4}$/;
        if (!phoneRegex.test(commenterPhone.replace(/-/g, ''))) {
            showNotification('מספר הטלפון אינו תקין', 'error');
            showLoadingState(submitBtn, false);
            return;
        }

        // Create new comment
        const newComment = {
            name: commenterName,
            phone: commenterPhone,
            text: commentText,
            discussionId: window.DISCUSSION_ID || 'default'
        };

        // Save user details to localStorage
        saveUserDetailsToLocalStorage(commenterName, commenterPhone);

        // Save comment to server
        await saveCommentToServer(newComment);
        showLoadingState(submitBtn, false);
    });

    // Function to save comment to server
    async function saveCommentToServer(comment) {
        try {
            console.log('Saving comment for discussion:', comment.discussionId);
            const result = await fetchFromAPI('submitDiscussionComment', 'GET', {
                comment: comment
            });

            if (result.success) {
                // Generate and save token for this comment
                const commentToken = generateCommentToken(comment.name, comment.phone);
                saveCommentToken(result.commentId || comment.id, commentToken);

                // Reset form
                commentForm.reset();
                document.getElementById('commentText').innerHTML = '';
                updateCharCounter();

                // Reload comments to show the new one
                loadComments();

                // Show success message
                showNotification('תגובתך נשלחה בהצלחה!', 'success');
            } else {
                showNotification(result.error || 'שגיאה בשליחת התגובה', 'error');
            }
        } catch (error) {
            console.error('Error saving comment:', error);
            showNotification('שגיאה בחיבור לשרת', 'error');
        }
    }

    // Function to load comments from server
    async function loadComments() {
        // Show loading animation
        showCommentsLoading();

        try {
            const discussionId = window.DISCUSSION_ID || 'default';
            console.log('Loading comments for discussion:', discussionId);
            const result = await fetchFromAPI('getDiscussionComments', 'GET', { discussionId: discussionId });
            console.log('Comments result:', result);

            // Clear existing comments
            commentsContainer.innerHTML = '';

            if (result.data && result.data.length > 0) {
                console.log('Found', result.data.length, 'comments');

                // Filter comments by discussion ID (temporary fix until server is fixed)
                const discussionId = window.DISCUSSION_ID || 'default';
                let comments = result.data.filter(comment => {
                    const commentDiscussionId = comment.discussionId || 'default';
                    const matches = commentDiscussionId === discussionId;
                    if (!matches) {
                        console.log('Filtering out comment from different discussion:', comment.name, 'discussionId:', commentDiscussionId, 'expected:', discussionId);
                    }
                    return matches;
                });
                
                console.log('After filtering, found', comments.length, 'comments for discussion:', discussionId);

                // Get sort order
                const sortOrder = getSortOrder();

                // Sort comments based on selected order
                if (sortOrder === 'newest') {
                    comments.sort((a, b) => b.timestamp - a.timestamp);
                } else if (sortOrder === 'oldest') {
                    comments.sort((a, b) => a.timestamp - b.timestamp);
                } else if (sortOrder === 'mostLiked') {
                    comments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                }

                // Organize comments into hierarchy
                const topLevelComments = [];
                const repliesMap = new Map();

                // Separate top-level comments from replies
                comments.forEach(comment => {
                    console.log('Processing comment:', comment.name, 'ID:', comment.id, 'ReplyTo:', comment.replyTo, 'DiscussionId:', comment.discussionId);
                    if (comment.replyTo && comment.replyTo.toString().trim() !== '') {
                        // This is a reply
                        const parentId = comment.replyTo.toString();
                        console.log('Found reply to parent ID:', parentId);
                        if (!repliesMap.has(parentId)) {
                            repliesMap.set(parentId, []);
                        }
                        repliesMap.get(parentId).push(comment);
                    } else {
                        // This is a top-level comment
                        console.log('Found top-level comment');
                        topLevelComments.push(comment);
                    }
                });

                console.log('Top-level comments:', topLevelComments.map(c => c.name));
                console.log('Replies map:', Array.from(repliesMap.entries()).map(([parentId, replies]) =>
                    `${parentId}: ${replies.map(r => r.name).join(', ')}`
                ));

                // Display top-level comments with their replies
                topLevelComments.forEach(comment => {
                    addCommentToDisplay(comment, null, repliesMap);

                    // Add replies to this comment in the replies container
                    const replies = repliesMap.get(comment.id.toString()) || [];
                    if (replies.length > 0) {
                        // Sort replies according to the selected order
                        const sortOrder = getSortOrder();
                        if (sortOrder === 'newest') {
                            replies.sort((a, b) => {
                                const timeA = a.timestamp || new Date(a.date || 0).getTime() || 0;
                                const timeB = b.timestamp || new Date(b.date || 0).getTime() || 0;
                                return timeB - timeA;
                            });
                        } else if (sortOrder === 'oldest') {
                            replies.sort((a, b) => {
                                const timeA = a.timestamp || new Date(a.date || 0).getTime() || 0;
                                const timeB = b.timestamp || new Date(b.date || 0).getTime() || 0;
                                return timeA - timeB;
                            });
                        } else if (sortOrder === 'mostLiked') {
                            replies.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                        }
                        const repliesContainer = document.getElementById(`replies-${comment.id}`);
                        if (repliesContainer) {
                            replies.forEach(reply => {
                                addReplyToContainer(reply, comment.name, repliesContainer);
                            });
                        }
                    }
                });
                updateLikeButtons(); // Update like buttons after loading all comments
            } else {
                console.log('No comments found, showing no comments message');
                showNoCommentsMessage();
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            showNotification('שגיאה בטעינת התגובות', 'error');
            showNoCommentsMessage();
        } finally {
            // Hide loading animation
            hideCommentsLoading();
        }
    }

    // Function to show loading animation for comments
    // Function to show loading animation for comments

    // Function to add reply to replies container
    function addReplyToContainer(reply, parentName, container) {
        const replyElement = document.createElement('div');
        replyElement.className = 'comment-item reply-item';
        replyElement.setAttribute('data-comment-id', reply.id);

        // Format the date properly
        let formattedDate = 'תאריך לא ידוע';
        try {
            if (reply.date) {
                if (typeof reply.date === 'string' && reply.date !== 'Invalid Date') {
                    formattedDate = reply.date;
                } else {
                    const date = new Date(reply.timestamp || reply.date);
                    if (!isNaN(date.getTime())) {
                        formattedDate = date.toLocaleString('he-IL', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Error formatting date:', error);
        }

        replyElement.innerHTML = `
            <div class="comment-header">
                <span class="commenter-name">${escapeHtml(reply.name)}</span>
                <span class="comment-date">${formattedDate}</span>
            </div>
            <div class="reply-indicator" style="color: #007bff; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 500;">↳ תגובה על תגובה של ${escapeHtml(parentName)}</div>
            <div class="comment-text" contenteditable="false">${reply.text}</div>
            <div class="comment-actions">
                <button class="action-btn like-btn${hasLiked(reply.id) ? ' liked' : ''}" onclick="toggleLike('${reply.id}')">
                    <span class="material-icons" style="font-size: 1rem; margin-left: 0.25rem;">thumb_up</span>
                    <span class="like-count">${reply.likes || 0}</span>
                </button>
                ${isCommentAuthor(reply.id, reply.name) ? `
                    <button class="action-btn edit-btn" onclick="toggleEdit('${reply.id}')">
                        <span class="material-icons" style="font-size: 1rem; margin-left: 0.25rem;">edit</span>
                        ערוך
                    </button>
                ` : ''}
            </div>
        `;

        // Add special styling for replies
        replyElement.style.marginLeft = '1rem';
        replyElement.style.borderLeft = '3px solid #007bff';
        replyElement.style.backgroundColor = '#f0f8ff';
        replyElement.style.borderRadius = '8px';
        replyElement.style.padding = '1rem';
        replyElement.style.marginTop = '0.5rem';
        replyElement.style.marginBottom = '0.5rem';

        container.appendChild(replyElement);
        updateLikeButtons(); // Update like buttons after adding reply
    }

    // Add CSS animations for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .no-comments {
            text-align: center;
            padding: 2rem;
            color: #6c757d;
            font-style: italic;
        }
        
        [data-theme="dark"] .no-comments {
            color: #a0aec0;
        }
        
        .comment-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        
        .action-btn {
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 4px;
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.9rem;
            transition: all 0.2s ease;
        }
        
        .action-btn:hover {
            background-color: #f8f9fa;
            color: #007bff;
        }
        
        .action-btn.liked {
            color: #28a745;
        }
        

        
        .formatting-toolbar {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
            padding: 0.5rem;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        
        .formatting-toolbar button {
            background: #2572c0;
            border: 1px solid #dee2e6;
            padding: 0.25rem 0.5rem;
            border-radius: 3px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        
        .formatting-toolbar button:hover {
            background-color: #2572c0;
        }
        
        .replies-container {
            margin-top: 1rem;
            padding-left: 2rem;
            border-left: 2px solid #e9ecef;
        }
        
        [data-theme="dark"] .action-btn:hover {
            background-color: #2d3748;
        }
        
        [data-theme="dark"] .formatting-toolbar {
            background-color: #2d3748;
        }
        
        [data-theme="dark"] .formatting-toolbar button {
            background-color: #4a5568;
            border-color: #718096;
            color: white;
        }
        
        [data-theme="dark"] .formatting-toolbar button:hover {
            background-color: #718096;
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
            .comment-item {
                margin: 0.5rem 0;
                padding: 0.75rem;
                border-radius: 8px;
            }
            
            .comment-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.25rem;
                margin-bottom: 0.5rem;
            }
            
            .commenter-name {
                font-size: 1rem;
                font-weight: 600;
            }
            
            .comment-date {
                font-size: 0.8rem;
                color: #6c757d;
            }
            
            .comment-text {
                font-size: 0.95rem;
                line-height: 1.4;
                margin-bottom: 0.5rem;
            }
            
            .comment-actions {
                gap: 0.5rem;
                margin-top: 0.75rem;
                flex-wrap: wrap;
            }
            
            .action-btn {
                padding: 0.4rem 0.6rem;
                font-size: 0.85rem;
                min-width: auto;
            }
            
            .action-btn .material-icons {
                font-size: 0.9rem !important;
                margin-left: 0.2rem !important;
            }
            
            .reply-indicator {
                font-size: 0.8rem !important;
                margin-bottom: 0.4rem !important;
            }
            
            /* Reduce indentation for replies on mobile */
            .comment-item[style*="margin-left"] {
                margin-left: 1rem !important;
            }
            
            .replies-container {
                padding-left: 1rem;
                margin-top: 0.5rem;
            }
            
            /* Optimize comment form for mobile */
            .comment-form {
                padding: 1rem;
                margin: 1rem 0;
            }
            
            .comment-form input,
            .comment-form textarea {
                padding: 0.75rem;
                font-size: 1rem;
            }
            
            .comment-form button {
                padding: 0.75rem 1.5rem;
                font-size: 1rem;
            }
            
            /* Optimize reply form for mobile */
            #replyForm {
                padding: 1rem;
                margin: 1rem 0;
            }
            
            #replyForm input,
            #replyForm textarea {
                padding: 0.75rem;
                font-size: 1rem;
            }
            
            #replyForm button {
                padding: 0.75rem 1.5rem;
                font-size: 1rem;
            }
            
            /* Reduce margins and padding for better space usage */
            .comments-container {
                padding: 0.5rem;
            }
            
            .comment-form,
            #replyForm {
                margin: 0.5rem 0;
            }
            
            /* Make buttons more touch-friendly */
            .action-btn {
                min-height: 44px;
                min-width: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            /* Optimize formatting toolbar for mobile */
            .formatting-toolbar {
                gap: 0.25rem;
                padding: 0.4rem;
                flex-wrap: wrap;
            }
            
            .formatting-toolbar button {
                padding: 0.4rem 0.6rem;
                font-size: 0.75rem;
                min-width: 36px;
                min-height: 36px;
            }
        }
        
        /* Extra small screens */
        @media (max-width: 480px) {
            .comment-item {
                padding: 0.5rem;
                margin: 0.25rem 0;
            }
            
            .comment-actions {
                gap: 0.25rem;
            }
            
            .action-btn {
                padding: 0.3rem 0.5rem;
                font-size: 0.8rem;
            }
            
            .comment-text {
                font-size: 0.9rem;
            }
            
            .commenter-name {
                font-size: 0.95rem;
            }
            
            .comment-date {
                font-size: 0.75rem;
            }
            
            /* Reduce indentation even more for very small screens */
            .comment-item[style*="margin-left"] {
                margin-left: 0.5rem !important;
            }
            
            .replies-container {
                padding-left: 0.5rem;
            }
        }
    `;
    document.head.appendChild(style);

    // Add smooth scrolling to sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.scrollMarginTop = '100px';
    });

    // Add source item click effects
    const sourceItems = document.querySelectorAll('.source-item');
    sourceItems.forEach(item => {
        item.addEventListener('click', function () {
            // Add temporary highlight effect
            this.style.transform = 'scale(1.02)';
            this.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.2)';

            setTimeout(() => {
                this.style.transform = '';
                this.style.boxShadow = '';
            }, 200);
        });
    });

    // Add discussion points interaction
    const discussionPoints = document.querySelectorAll('.discussion-points li');
    discussionPoints.forEach(point => {
        point.addEventListener('click', function () {
            // Add temporary highlight
            this.style.background = '#e3f2fd';
            this.style.color = '#1976d2';

            setTimeout(() => {
                this.style.background = '';
                this.style.color = '';
            }, 1000);
        });
    });

    // Add form validation
    const formInputs = commentForm.querySelectorAll('input, textarea');
    formInputs.forEach(input => {
        input.addEventListener('blur', function () {
            if (this.value.trim() === '') {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '';
            }
        });

        input.addEventListener('input', function () {
            if (this.value.trim() !== '') {
                this.style.borderColor = '';
            }
        });
    });

    // Add character counter for textarea
    const textarea = document.getElementById('commentText');
    const charCounter = document.createElement('div');
    charCounter.className = 'char-counter';
    charCounter.style.cssText = `
        font-size: 0.8rem;
        color: #6c757d;
        text-align: left;
        margin-top: 0.5rem;
    `;
    textarea.parentNode.appendChild(charCounter);

    function updateCharCounter() {
        const editor = document.getElementById('commentText');
        const charCounter = document.querySelector('.char-counter');
        if (editor && charCounter) {
            const count = editor.textContent.length;
            const maxLength = 1000;
            charCounter.textContent = `${count}/${maxLength} תווים`;

            if (count > maxLength * 0.9) {
                charCounter.style.color = '#dc3545';
            } else {
                charCounter.style.color = '#6c757d';
            }
        }
    }

    // Add event listeners for contenteditable
    const editor = document.getElementById('commentText');
    if (editor) {
        editor.addEventListener('input', updateCharCounter);
        editor.addEventListener('keyup', updateCharCounter);
        editor.addEventListener('paste', updateCharCounter);
        updateCharCounter(); // Initial count

        // Add placeholder functionality
        editor.addEventListener('focus', function () {
            if (this.textContent === '') {
                this.setAttribute('data-placeholder', 'שתף את דעתך על הדיון...');
            }
        });

        editor.addEventListener('blur', function () {
            if (this.textContent === '') {
                this.removeAttribute('data-placeholder');
            }
        });
    }

    // הצגת שדות שם וטלפון - כעת הם גלויים כברירת מחדל
    setTimeout(() => {
        const commentTextEditor = document.getElementById('commentText');
        const userDetailsFields = document.getElementById('userDetailsFields');
        if (commentTextEditor && userDetailsFields) {
            // וודא שהשדות גלויים
            userDetailsFields.style.display = 'block';
            userDetailsFields.classList.remove('hidden');
            console.log('User details fields should be visible now');

            // אפשרות להסתיר שדות אם התיבת טקסט ריקה (אופציונלי)
            commentTextEditor.addEventListener('input', function () {
                // השדות נשארים גלויים תמיד
            });
        } else {
            console.log('Could not find commentTextEditor or userDetailsFields');
            console.log('commentTextEditor:', commentTextEditor);
            console.log('userDetailsFields:', userDetailsFields);
        }
    }, 100);

    // Add formatting toolbar to reply form
    const replyEditor = document.getElementById('replyText');
    if (replyEditor) {
        replyEditor.addEventListener('focus', function () {
            if (this.textContent === '') {
                this.setAttribute('data-placeholder', 'כתוב את תגובתך...');
            }
        });

        replyEditor.addEventListener('blur', function () {
            if (this.textContent === '') {
                this.removeAttribute('data-placeholder');
            }
        });
    }

    // Dark mode support for char counter
    const darkModeObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                charCounter.style.color = isDark ? '#a0aec0' : '#6c757d';
            }
        });
    });

    darkModeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });

    // Reply form functionality
    const replyForm = document.getElementById('replyForm');
    const replyCommentForm = document.getElementById('replyCommentForm');
    let currentReplyTo = null;

    // Handle reply form submission
    replyCommentForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submitReplyBtn');
        showLoadingState(submitBtn, true);

        const formData = new FormData(replyCommentForm);
        const replyName = formData.get('replyName').trim();
        const replyPhone = formData.get('replyPhone').trim();
        const replyText = document.getElementById('replyText').innerHTML.trim();

        if (!replyName || !replyPhone || !replyText) {
            showNotification('אנא מלא את כל השדות הנדרשים', 'error');
            showLoadingState(submitBtn, false);
            return;
        }

        // Validate phone number
        const phoneRegex = /^0\d{1,2}-?\d{3}-?\d{4}$/;
        if (!phoneRegex.test(replyPhone.replace(/-/g, ''))) {
            showNotification('מספר הטלפון אינו תקין', 'error');
            showLoadingState(submitBtn, false);
            return;
        }

        // Create reply comment
        const replyComment = {
            name: replyName,
            phone: replyPhone,
            text: replyText,
            replyTo: window.currentReplyTo,
            discussionId: window.DISCUSSION_ID || 'default'
        };

        // Generate token for reply
        const replyToken = generateCommentToken(replyComment.name, replyComment.phone);

        // Save reply to server
        await saveReplyToServer(replyComment);
        showLoadingState(submitBtn, false);
    });

    // Function to save reply to server
    async function saveReplyToServer(replyComment) {
        try {
            console.log('Sending reply comment for discussion:', replyComment.discussionId);
            const result = await fetchFromAPI('submitDiscussionReply', 'GET', {
                reply: replyComment
            });

            if (result.success) {
                // Generate and save token for this reply
                const replyToken = generateCommentToken(replyComment.name, replyComment.phone);
                saveCommentToken(result.replyId || replyComment.id, replyToken);

                // Reset form and hide it
                replyCommentForm.reset();
                document.getElementById('replyText').innerHTML = '';
                hideReplyForm();

                // Reload comments to show the new reply
                loadComments();

                // Show success message
                showNotification('תגובתך נשלחה בהצלחה!', 'success');
            } else {
                showNotification(result.error || 'שגיאה בשליחת התגובה', 'error');
            }
        } catch (error) {
            console.error('Error saving reply:', error);
            showNotification('שגיאה בחיבור לשרת', 'error');
        }
    }
});

// Global functions for reply functionality
function showReplyForm(commentId, commenterName) {
    const replyForm = document.getElementById('replyForm');
    const replyTitle = document.querySelector('.reply-title');

    if (!replyForm || !replyTitle) return;

    // Update title to show who we're replying to
    replyTitle.textContent = `השבת על תגובה של ${commenterName}:`;

    // Store the comment ID we're replying to
    window.currentReplyTo = commentId;
    console.log('Set currentReplyTo to:', commentId);

    // Show the form
    replyForm.classList.remove('hidden');

    // Scroll to the form
    replyForm.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Focus on the name field
    document.getElementById('replyName').focus();
}

function cancelReply() {
    hideReplyForm();
}

function hideReplyForm() {
    const replyForm = document.getElementById('replyForm');
    if (replyForm) {
        replyForm.classList.add('hidden');
    }
    window.currentReplyTo = null;
}

// Global functions for new features
function toggleReplies(commentId) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    const toggleBtn = event.target.closest('.toggle-replies-btn');

    if (!repliesContainer || !toggleBtn) return;

    const icon = toggleBtn.querySelector('.material-icons');
    if (!icon) return;

    if (repliesContainer.style.display === 'none') {
        repliesContainer.style.display = 'block';
        icon.textContent = 'expand_less';
        toggleBtn.innerHTML = toggleBtn.innerHTML.replace('תגובות', 'הסתר');
    } else {
        repliesContainer.style.display = 'none';
        icon.textContent = 'expand_more';
        toggleBtn.innerHTML = toggleBtn.innerHTML.replace('הסתר', 'תגובות');
    }
}

// עוזר: בדיקת לייקים ב-localStorage
function getLikedComments() {
    const discussionId = window.DISCUSSION_ID || 'default';
    return JSON.parse(localStorage.getItem(`likedComments_${discussionId}`) || '[]');
}
function setLikedComments(arr) {
    const discussionId = window.DISCUSSION_ID || 'default';
    localStorage.setItem(`likedComments_${discussionId}`, JSON.stringify(arr));
}
function hasLiked(commentId) {
    return getLikedComments().includes(commentId);
}
function addLiked(commentId) {
    const arr = getLikedComments();
    if (!arr.includes(commentId)) {
        arr.push(commentId);
        setLikedComments(arr);
    }
}
function removeLiked(commentId) {
    let arr = getLikedComments();
    arr = arr.filter(id => id !== commentId);
    setLikedComments(arr);
}

// עדכון toggleLike
async function toggleLike(commentId) {
    const likeBtn = event.target.closest('.like-btn');
    if (!likeBtn) return;

    const likeCount = likeBtn.querySelector('.like-count');
    if (!likeCount) return;

    const currentCount = parseInt(likeCount.textContent) || 0;

    // מניעת לייק כפול
    if (!likeBtn.classList.contains('liked') && hasLiked(commentId)) {
        showNotification('כבר עשית לייק לתגובה זו', 'info');
        return;
    }
    likeBtn.disabled = true;
    let optimisticLiked = false;
    try {
        if (likeBtn.classList.contains('liked')) {
            // הורד לייק מיידית
            likeBtn.classList.remove('liked');
            likeCount.textContent = currentCount - 1;
            optimisticLiked = false;
            removeLiked(commentId);
            // קריאה לשרת
            const result = await fetchFromAPI('unlikeComment', 'GET', { commentId });
            if (!result.success) {
                likeBtn.classList.add('liked');
                likeCount.textContent = currentCount;
                addLiked(commentId);
                showNotification(result.error || 'שגיאה בעדכון הלייק', 'error');
            }
        } else {
            // הוסף לייק מיידית
            likeBtn.classList.add('liked');
            likeCount.textContent = currentCount + 1;
            optimisticLiked = true;
            addLiked(commentId);
            // קריאה לשרת
            const result = await fetchFromAPI('likeComment', 'GET', { commentId });
            if (!result.success) {
                likeBtn.classList.remove('liked');
                likeCount.textContent = currentCount;
                removeLiked(commentId);
                showNotification(result.error || 'שגיאה בעדכון הלייק', 'error');
            }
        }
    } catch (error) {
        if (optimisticLiked) {
            likeBtn.classList.remove('liked');
            likeCount.textContent = currentCount;
            removeLiked(commentId);
        } else {
            likeBtn.classList.add('liked');
            likeCount.textContent = currentCount;
            addLiked(commentId);
        }
        showNotification('שגיאה בעדכון הלייק', 'error');
    } finally {
        likeBtn.disabled = false;
    }
    updateLikeButtons(); // Update like buttons after toggling like
}



function toggleEdit(commentId) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentElement) return;

    const commentText = commentElement.querySelector('.comment-text');
    const editBtn = commentElement.querySelector('.edit-btn');

    if (!commentText || !editBtn) return;

    const icon = editBtn.querySelector('.material-icons');
    if (!icon) return;

    if (commentText.contentEditable === 'false') {
        // Enable editing
        commentText.contentEditable = 'true';
        commentText.focus();
        icon.textContent = 'save';
        editBtn.innerHTML = editBtn.innerHTML.replace('ערוך', 'שמור');

        // Add formatting toolbar
        addFormattingToolbar(commentText);
    } else {
        // Save changes
        commentText.contentEditable = 'false';
        icon.textContent = 'edit';
        editBtn.innerHTML = editBtn.innerHTML.replace('שמור', 'ערוך');

        // Remove formatting toolbar
        removeFormattingToolbar();

        // Save to server (you can implement this)
        saveCommentEdit(commentId, commentText.innerHTML);
    }
}

function addFormattingToolbar(commentText) {
    if (!commentText) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'formatting-toolbar';
    toolbar.style.cssText = `
        margin: 10px 0;
        padding: 8px;
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        display: flex;
        gap: 5px;
        flex-wrap: wrap;
    `;
    toolbar.innerHTML = `
        <button onclick="formatText('bold')" title="מודגש" style="font-weight: bold; padding: 8px 12px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; font-size: 14px; min-width: 40px; color: #2c3e50;">ב</button>
        <button onclick="formatText('italic')" title="נטוי" style="font-style: italic; padding: 8px 12px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; font-size: 14px; min-width: 40px; color: #2c3e50;">נ</button>
        <button onclick="formatText('underline')" title="קו תחתון" style="text-decoration: underline; padding: 8px 12px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; font-size: 14px; min-width: 40px; color: #2c3e50;">ק</button>
        <button onclick="formatText('strikethrough')" title="קו חוצה" style="text-decoration: line-through; padding: 8px 12px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer; font-size: 14px; min-width: 40px; color: #2c3e50;">ח</button>
    `;

    commentText.parentNode.insertBefore(toolbar, commentText.nextSibling);
}

function removeFormattingToolbar() {
    const toolbars = document.querySelectorAll('.formatting-toolbar');
    toolbars.forEach(toolbar => {
        if (toolbar) {
            toolbar.remove();
        }
    });
}

function formatText(command) {
    try {
        document.execCommand(command, false, null);
    } catch (error) {
        console.error('Error formatting text:', error);
    }
}

function formatNewText(command) {
    const editor = document.getElementById('commentText');
    if (editor) {
        editor.focus();
        try {
            document.execCommand(command, false, null);
        } catch (error) {
            console.error('Error formatting new text:', error);
        }
        updateCharCounter();
    }
}

function formatReplyText(command) {
    const editor = document.getElementById('replyText');
    if (editor) {
        editor.focus();
        try {
            document.execCommand(command, false, null);
        } catch (error) {
            console.error('Error formatting reply text:', error);
        }
    }
}

function saveCommentEdit(commentId, newText) {
    // Implement saving to server
    console.log('Saving edit for comment:', commentId, 'New text:', newText);
    showNotification('התגובה נשמרה בהצלחה', 'success');
    updateLikeButtons(); // Update like buttons after editing comment
}

// User identification functions
function generateCommentToken(name, phone) {
    try {
        // Create a unique token based on name, phone, and timestamp
        const timestamp = Date.now();
        const data = `${name}-${phone}-${timestamp}`;
        // Use encodeURIComponent to handle Hebrew characters
        return btoa(encodeURIComponent(data)); // Base64 encode
    } catch (error) {
        console.error('Error generating comment token:', error);
        return null;
    }
}

function saveCommentToken(commentId, token) {
    try {
        const discussionId = window.DISCUSSION_ID || 'default';
        const tokens = JSON.parse(localStorage.getItem(`commentTokens_${discussionId}`) || '{}');
        tokens[commentId] = token;
        localStorage.setItem(`commentTokens_${discussionId}`, JSON.stringify(tokens));
    } catch (error) {
        console.error('Error saving comment token:', error);
    }
}

function isCommentAuthor(commentId, commenterName) {
    try {
        const discussionId = window.DISCUSSION_ID || 'default';
        const tokens = JSON.parse(localStorage.getItem(`commentTokens_${discussionId}`) || '{}');
        const savedToken = tokens[commentId];

        if (!savedToken) {
            return false;
        }

        const decodedToken = atob(savedToken);
        const decodedData = decodeURIComponent(decodedToken);
        const [name, phone, timestamp] = decodedData.split('-');

        // Check if the name matches (phone is optional for privacy)
        return name === commenterName;
    } catch (error) {
        console.error('Error checking comment author:', error);
        return false;
    }
}

// Function to show/hide loading state
function showLoadingState(button, isLoading) {
    if (!button) return;

    const spinner = button.querySelector('.loading-spinner');
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
        if (spinner) spinner.classList.remove('hidden');
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        if (spinner) spinner.classList.add('hidden');
    }
}

// שמירת שם וטלפון ב-localStorage אחרי שליחת תגובה
function saveUserDetailsToLocalStorage(name, phone) {
    try {
        const discussionId = window.DISCUSSION_ID || 'default';
        localStorage.setItem(`discussionUserName_${discussionId}`, name);
        localStorage.setItem(`discussionUserPhone_${discussionId}`, phone);
    } catch (error) {
        console.error('Error saving user details to localStorage:', error);
    }
}
function loadUserDetailsFromLocalStorage() {
    try {
        const discussionId = window.DISCUSSION_ID || 'default';
        return {
            name: localStorage.getItem(`discussionUserName_${discussionId}`) || '',
            phone: localStorage.getItem(`discussionUserPhone_${discussionId}`) || ''
        };
    } catch (error) {
        console.error('Error loading user details from localStorage:', error);
        return { name: '', phone: '' };
    }
}

// סידור תגובות - שליטה וסידור
const SORT_KEY = 'commentsSortOrder';
function getSortOrder() {
    const discussionId = window.DISCUSSION_ID || 'default';
    return localStorage.getItem(`${SORT_KEY}_${discussionId}`) || 'newest';
}
function setSortOrder(val) {
    const discussionId = window.DISCUSSION_ID || 'default';
    localStorage.setItem(`${SORT_KEY}_${discussionId}`, val);
}

// עדכון loadComments כך שימיין לפי הסדר שנבחר
async function loadComments() {
    showCommentsLoading();
    try {
        const discussionId = window.DISCUSSION_ID || 'default';
        const result = await fetchFromAPI('getDiscussionComments', 'GET', { discussionId: discussionId });
        commentsContainer.innerHTML = '';
        if (result.data && result.data.length > 0) {
            // Filter comments by discussion ID (temporary fix until server is fixed)
            let comments = result.data.filter(comment => {
                const commentDiscussionId = comment.discussionId || 'default';
                const matches = commentDiscussionId === discussionId;
                if (!matches) {
                    console.log('Filtering out comment from different discussion:', comment.name, 'discussionId:', commentDiscussionId, 'expected:', discussionId);
                }
                return matches;
            });
            
            console.log('After filtering, found', comments.length, 'comments for discussion:', discussionId);
            
            // קודם נארגן היררכית
            const topLevelComments = [];
            const repliesMap = new Map();
            comments.forEach(comment => {
                if (comment.replyTo && comment.replyTo.toString().trim() !== '') {
                    const parentId = comment.replyTo.toString();
                    if (!repliesMap.has(parentId)) repliesMap.set(parentId, []);
                    repliesMap.get(parentId).push(comment);
                } else {
                    topLevelComments.push(comment);
                }
            });
            
            // עכשיו נמיין את התגובות הראשיות לפי הסדר שנבחר
            const sortOrder = getSortOrder();
            console.log('Sorting comments by:', sortOrder);
            
            if (sortOrder === 'newest') {
                topLevelComments.sort((a, b) => {
                    const timeA = a.timestamp || new Date(a.date || 0).getTime() || 0;
                    const timeB = b.timestamp || new Date(b.date || 0).getTime() || 0;
                    return timeB - timeA;
                });
            } else if (sortOrder === 'oldest') {
                topLevelComments.sort((a, b) => {
                    const timeA = a.timestamp || new Date(a.date || 0).getTime() || 0;
                    const timeB = b.timestamp || new Date(b.date || 0).getTime() || 0;
                    return timeA - timeB;
                });
            } else if (sortOrder === 'mostLiked') {
                topLevelComments.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            }
            
            // נמיין גם את התגובות-משנה לפי אותו סדר
            repliesMap.forEach((replies, parentId) => {
                if (sortOrder === 'newest') {
                    replies.sort((a, b) => {
                        const timeA = a.timestamp || new Date(a.date || 0).getTime() || 0;
                        const timeB = b.timestamp || new Date(b.date || 0).getTime() || 0;
                        return timeB - timeA;
                    });
                } else if (sortOrder === 'oldest') {
                    replies.sort((a, b) => {
                        const timeA = a.timestamp || new Date(a.date || 0).getTime() || 0;
                        const timeB = b.timestamp || new Date(b.date || 0).getTime() || 0;
                        return timeA - timeB;
                    });
                } else if (sortOrder === 'mostLiked') {
                    replies.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                }
            });
            
            // הצגה
            topLevelComments.forEach(comment => {
                addCommentToDisplay(comment, null, repliesMap);
            });
            updateLikeButtons(); // Update like buttons after loading all comments
        } else {
            showNoCommentsMessage();
        }
    } catch (error) {
        console.error('Load comments error:', error);
        showNotification('שגיאה בטעינת התגובות', 'error');
    } finally {
        hideCommentsLoading();
    }
}

// תיקון לוגיקת הלייק: סימון לייק בירוק גם אחרי ריענון, ואם לוחץ שוב - יוריד את הלייק
function updateLikeButtons() {
    const likedComments = getLikedComments();
    document.querySelectorAll('.like-btn').forEach(btn => {
        const commentElement = btn.closest('.comment-item, .reply-item');
        if (commentElement) {
            const commentId = commentElement.getAttribute('data-comment-id');
            if (commentId && likedComments.includes(commentId)) {
                btn.classList.add('liked');
            } else {
                btn.classList.remove('liked');
            }
        }
    });
}
// קריאה לפונקציה זו אחרי כל טעינת תגובות
// updateLikeButtons(); // This line was removed from the original file, but is now added by the edit hint.