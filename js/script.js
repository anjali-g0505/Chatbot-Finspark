// Card animation logic (now applied to the chatbotContainer)
const chatbotContainer = document.getElementById('chatbotContainer');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const closeChatBtn = document.getElementById('closeChatBtn');
const chatIcon = document.querySelector('.chat-icon');
const chatColumnContent = document.querySelector('.chat-column-content');


const cardUpdate = (e) => {
    // Only update glowing effect if chatbot is expanded
    if (chatbotContainer.classList.contains('expanded')) {
        const position = pointerPositionRelativeToElement(chatbotContainer, e);
        const [px, py] = position.pixels;
        const [perx, pery] = position.percent;
        const [dx, dy] = distanceFromCenter(chatbotContainer, px, py);
        const edge = closenessToEdge(chatbotContainer, px, py);
        const angle = angleFromPointerEvent(chatbotContainer, dx, dy);

        chatbotContainer.style.setProperty('--pointer-x', `${round(perx)}%`);
        chatbotContainer.style.setProperty('--pointer-y', `${round(pery)}%`);
        chatbotContainer.style.setProperty('--pointer-°', `${round(angle)}deg`);
        chatbotContainer.style.setProperty('--pointer-d', `${round(edge * 100)}`);

        chatbotContainer.classList.remove('animating');
    }
};

chatbotContainer.addEventListener("pointermove", cardUpdate);

const centerOfElement = ($el) => {
    const { left, top, width, height } = $el.getBoundingClientRect();
    return [width / 2, height / 2];
}

const pointerPositionRelativeToElement = ($el, e) => {
    const pos = [e.clientX, e.clientY];
    const { left, top, width, height } = $el.getBoundingClientRect();
    const x = pos[0] - left;
    const y = pos[1] - top;
    const px = clamp((100 / width) * x);
    const py = clamp((100 / height) * y);
    return { pixels: [x, y], percent: [px, py] }
}

const angleFromPointerEvent = ($el, dx, dy) => {
    let angleRadians = 0;
    let angleDegrees = 0;
    if (dx !== 0 || dy !== 0) {
        angleRadians = Math.atan2(dy, dx);
        angleDegrees = angleRadians * (180 / Math.PI) + 90;
        if (angleDegrees < 0) {
            angleDegrees += 360;
        }
    }
    return angleDegrees;
}

const distanceFromCenter = ($el, x, y) => {
    const [cx, cy] = centerOfElement($el);
    return [x - cx, y - cy];
}

const closenessToEdge = ($el, x, y) => {
    const [cx, cy] = centerOfElement($el);
    const [dx, dy] = distanceFromCenter($el, x, y);
    let k_x = Infinity;
    let k_y = Infinity;
    if (dx !== 0) {
        k_x = cx / Math.abs(dx);
    }
    if (dy !== 0) {
        k_y = cy / Math.abs(dy);
    }
    return clamp((1 / Math.min(k_x, k_y)), 0, 1);
}

const round = (value, precision = 3) => parseFloat(value.toFixed(precision));

const clamp = (value, min = 0, max = 100) =>
    Math.min(Math.max(value, min), max);

const playAnimation = () => {
    // This function remains unused as per previous comments (intro animation)
};

function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}
function easeInCubic(x) {
    return x * x * x;
}

function animateNumber(options) {
    const {
        startValue = 0,
        endValue = 100,
        duration = 1000,
        delay = 0,
        onUpdate = () => { },
        ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        onStart = () => { },
        onEnd = () => { },
    } = options;

    const startTime = performance.now() + delay;

    function update() {
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const t = Math.min(elapsed / duration, 1); // Normalize to [0, 1]
        const easedValue = startValue + (endValue - startValue) * ease(t); // Apply easing

        onUpdate(easedValue);

        if (t < 1) {
            requestAnimationFrame(update); // Continue the animation
        } else if (t >= 1) {
            onEnd();
        }
    }

    setTimeout(() => {
        onStart();
        requestAnimationFrame(update); // Start the animation after the delay
    }, delay);
}

/* theme switching (from original card, now applied to body/app) */
const $app = document.querySelector('#app');
// Removed moon/sun selectors as they are no longer in the HTML.
// For now, the body.light class controls the overall theme.

// Chatbot specific logic
let isChatOpen = false;
let hoverTimeout;

// Use the chatbotContainer itself to toggle. Click on the icon area.
chatbotContainer.addEventListener('click', (event) => {
    // Only toggle if clicking the icon area, not inside the expanded chat column
    if (!isChatOpen || event.target.closest('.chat-column-content') === null) {
        toggleChatbot();
    }
});

// Close button inside the chat column
closeChatBtn.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent toggling the container if clicking the X
    toggleChatbot();
});

// Expand on hover, collapse on mouse leave from the expanded state
chatbotContainer.addEventListener('mouseenter', () => {
    clearTimeout(hoverTimeout);
    if (!isChatOpen) {
         toggleChatbot(true); // Force expand
    }
});

chatbotContainer.addEventListener('mouseleave', () => {
     if (isChatOpen) {
        // Give a small delay to prevent accidental collapse if cursor just slightly moves
        hoverTimeout = setTimeout(() => {
            toggleChatbot(false); // Force collapse
        }, 300); // Adjust delay as needed
    }
});


sendMessageBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

function toggleChatbot(forceState = null) {
    const shouldExpand = forceState !== null ? forceState : !isChatOpen;

    if (shouldExpand) {
        chatbotContainer.classList.add('expanded');
        chatIcon.style.display = 'none'; // Hide icon
        chatColumnContent.style.display = 'flex'; // Show chat content
        isChatOpen = true;
        chatInput.focus();
        scrollToBottom();

        // Optional: Play intro animation on expansion
        // playAnimation(); // If you want the glowing border to animate on expand
    } else {
        chatbotContainer.classList.remove('expanded');
        chatIcon.style.display = 'block'; // Show icon
        chatColumnContent.style.display = 'none'; // Hide chat content
        isChatOpen = false;
        // Reset pointer-d to 0 for a clean collapse if needed
        chatbotContainer.style.setProperty('--pointer-d', `0`);
    }
}


function displayMessage(message, type) {
    const messageBubble = document.createElement('div');
    messageBubble.classList.add('message-bubble');
    messageBubble.classList.add(type === 'user' ? 'user-message' : 'bot-message');
    messageBubble.textContent = message;
    chatMessages.appendChild(messageBubble);
    scrollToBottom();
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// REMOVED: const DOCUMENT_CONTENT variable as it's now handled by server.js

async function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (userMessage === '') return;

    displayMessage(userMessage, 'user');
    chatInput.value = '';

    const loadingBubble = document.createElement('div');
    loadingBubble.classList.add('loading-indicator');
    loadingBubble.textContent = 'Typing...';
    chatMessages.appendChild(loadingBubble);
    scrollToBottom();

    try {
        // Call your local Node.js proxy endpoint
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userQuery: userMessage
                // REMOVED: documentContent: DOCUMENT_CONTENT
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Server Error: ${response.status} - ${errorData.error || response.statusText}`);
        }

        const data = await response.json();
        const botResponse = data.response;

        chatMessages.removeChild(loadingBubble); // Remove loading indicator
        displayMessage(botResponse, 'bot');

    } catch (error) {
        console.error('Error sending message:', error);
        chatMessages.removeChild(loadingBubble); // Remove loading indicator
        displayMessage("Oops! Something went wrong. Please try again later.", 'bot');
    }
}