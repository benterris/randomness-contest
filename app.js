// Game state
const history = [];
const strategies = {
    1: { tally: {}, prediction: null, score: 0 },
    2: { tally: {}, prediction: null, score: 0 },
    3: { tally: {}, prediction: null, score: 0 },
    4: { tally: {}, prediction: null, score: 0 },
    5: { tally: {}, prediction: null, score: 0 }
};

// Score history for graphing
const scoreHistory = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
};

// Colors for each strategy (light red to dark red)
const strategyColors = {
    1: '#FFB3B3',
    2: '#FF8080',
    3: '#FF4D4D',
    4: '#E60000',
    5: '#990000'
};

// Draw the score graph
function drawGraph() {
    const canvas = document.getElementById('score-graph');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 250;

    const width = canvas.width;
    const height = canvas.height;
    const paddingLeft = 50;
    const paddingRight = 80;
    const paddingTop = 20;
    const paddingBottom = 40;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // If no data, show message
    if (history.length === 0) {
        ctx.fillStyle = '#999';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Start playing to see score evolution', width / 2, height / 2);
        return;
    }

    // Find min and max scores across all strategies
    let minScore = 0;
    let maxScore = 0;
    for (let n = 1; n <= 5; n++) {
        const scores = scoreHistory[n];
        if (scores.length > 0) {
            minScore = Math.min(minScore, ...scores);
            maxScore = Math.max(maxScore, ...scores);
        }
    }

    // Add some padding to the range
    const range = maxScore - minScore || 10;
    minScore -= range * 0.1;
    maxScore += range * 0.1;

    const dataLength = Math.max(...Object.values(scoreHistory).map(arr => arr.length));

    // Draw axes
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, paddingTop);
    ctx.lineTo(paddingLeft, height - paddingBottom);
    ctx.lineTo(width - paddingRight, height - paddingBottom);
    ctx.stroke();

    // Draw Y-axis labels
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const scoreValue = maxScore - (i / ySteps) * (maxScore - minScore);
        const y = paddingTop + (i / ySteps) * (height - paddingTop - paddingBottom);
        ctx.fillText(Math.round(scoreValue), paddingLeft - 5, y);

        // Draw grid line
        ctx.strokeStyle = '#eee';
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(width - paddingRight, y);
        ctx.stroke();
    }

    // Draw X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xSteps = Math.min(10, dataLength - 1);
    for (let i = 0; i <= xSteps; i++) {
        const moveNumber = Math.round((i / xSteps) * (dataLength - 1));
        const x = paddingLeft + (i / xSteps) * (width - paddingLeft - paddingRight);
        ctx.fillText(moveNumber, x, height - paddingBottom + 5);
    }

    // Draw zero line if it's in range
    if (minScore < 0 && maxScore > 0) {
        const zeroY = paddingTop + ((maxScore - 0) / (maxScore - minScore)) * (height - paddingTop - paddingBottom);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(paddingLeft, zeroY);
        ctx.lineTo(width - paddingRight, zeroY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw each strategy line
    for (let n = 1; n <= 5; n++) {
        const scores = scoreHistory[n];
        if (scores.length < 2) continue;

        ctx.strokeStyle = strategyColors[n];
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let i = 0; i < scores.length; i++) {
            const x = paddingLeft + (i / (dataLength - 1)) * (width - paddingLeft - paddingRight);
            const y = paddingTop + ((maxScore - scores[i]) / (maxScore - minScore)) * (height - paddingTop - paddingBottom);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }

    // Draw legend (outside the graph area, on the right)
    ctx.font = '12px Arial';
    const legendX = width - paddingRight + 10;
    let legendY = paddingTop + 10;
    for (let n = 1; n <= 5; n++) {
        ctx.fillStyle = strategyColors[n];
        ctx.fillRect(legendX, legendY, 20, 3);
        ctx.fillStyle = '#333';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${n}-gram`, legendX + 25, legendY + 1);
        legendY += 20;
    }
}

// Update the display
function updateDisplay() {
    // Update scores
    for (let n = 1; n <= 5; n++) {
        document.getElementById(`score-${n}`).textContent = strategies[n].score;
    }

    // Update history display (last 20 moves)
    const historyDisplay = document.getElementById('move-history');
    const last20 = history.slice(-20);
    historyDisplay.textContent = last20.join(' ') || 'No moves yet';

    // Update tally displays
    for (let n = 1; n <= 5; n++) {
        const tallyDiv = document.getElementById(`tally-${n}`);
        const strategy = strategies[n];

        // Sort tallies by count (descending) then by pattern name
        const sortedEntries = Object.entries(strategy.tally)
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

        if (sortedEntries.length === 0) {
            tallyDiv.textContent = 'No data yet';
        } else {
            tallyDiv.textContent = sortedEntries
                .map(([pattern, count]) => `${pattern}: ${count}`)
                .join(' | ');
        }
    }

    // Update graph
    drawGraph();
}

// Get the last N keys from history
function getLastNKeys(n) {
    if (history.length < n) return null;
    return history.slice(-n).join('');
}

// Make a prediction for strategy N
function makePrediction(n) {
    const strategy = strategies[n];

    // Need at least n-1 keys to make a prediction
    if (history.length < n - 1) {
        strategy.prediction = null;
        return;
    }

    // Get the last n-1 keys
    // Special case: when n=1, we want an empty prefix (slice(-0) would return entire array)
    const prefix = n === 1 ? '' : history.slice(-(n - 1)).join('');

    // Compare the counts for prefix + 'L' vs prefix + 'R'
    const leftPattern = prefix + 'L';
    const rightPattern = prefix + 'R';

    const leftCount = strategy.tally[leftPattern] || 0;
    const rightCount = strategy.tally[rightPattern] || 0;

    // Predict the one with higher count (if tied or both zero, predict L)
    if (rightCount > leftCount) {
        strategy.prediction = 'R';
    } else {
        strategy.prediction = 'L';
    }
}

// Process a keypress
function processKey(key) {
    // Add to history
    history.push(key);

    // Process each strategy
    for (let n = 1; n <= 5; n++) {
        const strategy = strategies[n];

        // Check if prediction was correct (if we had one)
        if (strategy.prediction !== null) {
            if (strategy.prediction === key) {
                // Correct prediction: subtract 1 from user's score
                strategy.score -= 1;
            } else {
                // Incorrect prediction: add 1 to user's score
                strategy.score += 1;
            }
        }

        // Update the tally with the new n-gram
        if (history.length >= n) {
            const ngram = getLastNKeys(n);
            strategy.tally[ngram] = (strategy.tally[ngram] || 0) + 1;
        }

        // Make next prediction
        makePrediction(n);

        // Record score history
        scoreHistory[n].push(strategy.score);
    }

    // Update display
    updateDisplay();
}

// Handle keyboard input
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        processKey('L');
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        processKey('R');
    }
});

// Handle touch input for mobile
document.addEventListener('touchstart', (event) => {
    const touch = event.touches[0];
    const screenWidth = window.innerWidth;
    const touchX = touch.clientX;

    // Left third of screen
    if (touchX < screenWidth / 3) {
        event.preventDefault();
        processKey('L');
    }
    // Right third of screen
    else if (touchX > (screenWidth * 2) / 3) {
        event.preventDefault();
        processKey('R');
    }
}, { passive: false });

// Toggle collapsible tallies section
document.getElementById('tallies-header').addEventListener('click', () => {
    const content = document.getElementById('tallies-content');
    const icon = document.querySelector('.toggle-icon');

    content.classList.toggle('open');
    icon.classList.toggle('open');
});

// Update instructions based on device type
function updateInstructions() {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const instructionElement = document.getElementById('control-instructions');

    if (isMobile) {
        instructionElement.textContent = 'Play by tapping the left or right side of the screen.';
    } else {
        instructionElement.textContent = 'Play by pressing the left or right arrow.';
    }
}

// Initialize
updateInstructions();
updateDisplay();

// Redraw graph on window resize
window.addEventListener('resize', drawGraph);
