document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const ball = document.querySelector('.ball');
    const userPlayer = document.querySelector('.user-player');
    const aiPlayer = document.querySelector('.ai-player');
    const userScoreElement = document.querySelector('.user-score .score-value');
    const aiScoreElement = document.querySelector('.ai-score .score-value');
    const timerElement = document.querySelector('.time');
    const messageElement = document.querySelector('.message');
    
    // Game state
    let userScore = 0;
    let aiScore = 0;
    let ballInPlay = false;
    let gameActive = true;
    let gameTime = 120;
    let gameInterval;
    let ballPosition = { x: 0, y: 0 };
    let ballVelocity = { x: 0, y: 0 };
    const gravity = 0.5;
    const friction = 0.98;
    
    // Player state
    let userPosition = window.innerWidth * 0.3;
    let aiPosition = window.innerWidth * 0.7;
    let playerFacingRight = true;
    let floorTop = window.innerHeight * 0.7;
    const defaultUserPosition = window.innerWidth * 0.3;
    const defaultAIPosition = window.innerWidth * 0.7;

    // Initialize game
    function initGame() {
        // Reset positions to default
        userPosition = defaultUserPosition;
        aiPosition = defaultAIPosition;
        
        // Reset scores and timer
        userScore = 0;
        aiScore = 0;
        gameTime = 120;
        userScoreElement.textContent = userScore;
        aiScoreElement.textContent = aiScore;
        updateTimerDisplay();
        
        // Position players
        userPlayer.style.left = `${userPosition - 20}px`;
        aiPlayer.style.left = `${aiPosition - 20}px`;
        
        // Reset ball
        resetBall();
        
        // Start game systems
        gameActive = true;
        startTimer();
        requestAnimationFrame(gameLoop);
    }

    function resetToDefaultPositions() {
        userPosition = defaultUserPosition;
        aiPosition = defaultAIPosition;
        userPlayer.style.left = `${userPosition - 20}px`;
        aiPlayer.style.left = `${aiPosition - 20}px`;
        resetBall();
    }

    // Enhanced AI that can score goals
    function updateAIPlayer() {
        if (!ballInPlay) {
            // When ball is not in play, AI has a chance to shoot
            if (Math.random() < 0.01) { // 1% chance per frame to shoot
                aiShootBall();
            }
        } else {
            // Defensive/offensive positioning
            const ballFutureX = ballPosition.x + ballVelocity.x * 10;
            
            // If ball is moving toward AI's hoop, defend
            if ((aiPosition < window.innerWidth/2 && ballFutureX < window.innerWidth/2) ||
                (aiPosition > window.innerWidth/2 && ballFutureX > window.innerWidth/2)) {
                
                // Defensive positioning
                const defendPosition = ballFutureX;
                aiPosition += (defendPosition - aiPosition) * 0.07;
            } else {
                // Offensive positioning - try to get open for a pass
                aiPosition += ((window.innerWidth/2) - aiPosition) * 0.03;
            }
            
            // Keep within bounds
            aiPosition = Math.max(40, Math.min(window.innerWidth - 40, aiPosition));
            
            // Occasionally attempt to intercept
            if (Math.random() < 0.02 && Math.abs(aiPosition - ballPosition.x) < 100) {
                ballVelocity.x = (aiPosition < window.innerWidth/2) ? -8 : 8;
                ballVelocity.y = -10;
            }
        }
        
        aiPlayer.style.left = `${aiPosition - 20}px`;
    }

    function aiShootBall() {
        if (ballInPlay) return;
        
        // AI shoots toward player's hoop
        const targetHoop = aiPosition < window.innerWidth/2 ? 
            window.innerWidth - 100 : 100;
        
        const angle = Math.atan2(
            floorTop - 150 - (floorTop - 30), 
            targetHoop - aiPosition
        );
        
        const power = 12 + Math.random() * 3;
        ballVelocity.x = Math.cos(angle) * power;
        ballVelocity.y = Math.sin(angle) * power;
        ballPosition.x = aiPosition;
        ballPosition.y = floorTop - 30;
        ballInPlay = true;
    }

    function handleKeyDown(e) {
        if (!gameActive) return;
        
        const moveSpeed = 15;
        
        if (e.key === 'ArrowLeft' && userPosition > 40) {
            userPosition -= moveSpeed;
            playerFacingRight = false;
            userPlayer.style.left = `${userPosition - 20}px`;
        } 
        else if (e.key === 'ArrowRight' && userPosition < window.innerWidth - 40) {
            userPosition += moveSpeed;
            playerFacingRight = true;
            userPlayer.style.left = `${userPosition - 20}px`;
        } 
        else if (e.key === 'ArrowUp' && !ballInPlay) {
            shootBall();
        }
    }

    function shootBall() {
        // Shoot in facing direction with proper power
        ballVelocity.x = playerFacingRight ? 10 : -10;
        ballVelocity.y = -15;
        ballPosition.x = userPosition;
        ballPosition.y = floorTop - 30;
        ballInPlay = true;
    }

    function checkHoopCollision(hoop, isLeftHoop) {
        const hoopRect = hoop.getBoundingClientRect();
        const ballRect = ball.getBoundingClientRect();
        
        const rimTop = hoopRect.top + 35;
        const rimBottom = rimTop + 5;
        const rimLeft = isLeftHoop ? hoopRect.left + 20 : hoopRect.left + 60;
        const rimRight = isLeftHoop ? hoopRect.left + 80 : hoopRect.right - 20;
        
        if (ballRect.bottom > rimTop && ballRect.top < rimBottom &&
            ballRect.right > rimLeft && ballRect.left < rimRight && ballVelocity.y > 1) {
            
            // Score points
            if (isLeftHoop) {
                aiScore++;
                aiScoreElement.textContent = aiScore;
                showMessage('AI Scores!', false, 1000);
            } else {
                userScore++;
                userScoreElement.textContent = userScore;
                showMessage('You Score!', false, 1000);
            }
            
            // Animate net
            const net = hoop.querySelector('.net');
            net.style.transform = isLeftHoop ? 'scaleX(1.3)' : 'scaleX(1.3)';
            setTimeout(() => net.style.transform = 'scaleX(1)', 500);
            
            // Reset to default positions after score
            resetToDefaultPositions();
        }
    }

    function updateTimerDisplay() {
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function gameLoop() {
        if (!gameActive) return;
        
        updateBallPosition();
        updateAIPlayer();
        checkCollisions();
        checkScore();
        
        requestAnimationFrame(gameLoop);
    }

    function updateBallPosition() {
        if (!ballInPlay) return;
        
        // Apply physics
        ballVelocity.y += gravity;
        ballVelocity.x *= friction;
        ballVelocity.y *= friction;
        
        // Update position
        ballPosition.x += ballVelocity.x;
        ballPosition.y += ballVelocity.y;
        
        // Floor collision
        if (ballPosition.y > floorTop - 15) {
            ballPosition.y = floorTop - 15;
            ballVelocity.y *= -0.6;
            ballVelocity.x *= 0.8;
            
            // Reset if ball stops moving
            if (Math.abs(ballVelocity.y) < 0.5 && Math.abs(ballVelocity.x) < 0.5) {
                resetBall();
            }
        }
        
        // Wall collisions
        if (ballPosition.x < 15) {
            ballPosition.x = 15;
            ballVelocity.x *= -0.8;
        }
        
        if (ballPosition.x > window.innerWidth - 15) {
            ballPosition.x = window.innerWidth - 15;
            ballVelocity.x *= -0.8;
        }
        
        // Update DOM
        ball.style.left = `${ballPosition.x - 15}px`;
        ball.style.bottom = `${window.innerHeight - ballPosition.y - 15}px`;
    }

    function checkCollisions() {
        checkHoopCollision(document.querySelector('.left-hoop'), true);
        checkHoopCollision(document.querySelector('.right-hoop'), false);
    }

    function checkScore() {
        if (gameTime <= 0) {
            gameActive = false;
            showMessage(userScore > aiScore ? 'You Win!' : 
                      aiScore > userScore ? 'AI Wins!' : 'Tie Game!', true);
        }
    }

    function startTimer() {
        clearInterval(gameInterval);
        gameInterval = setInterval(() => {
            gameTime--;
            updateTimerDisplay();
            
            if (gameTime <= 0) {
                clearInterval(gameInterval);
                gameActive = false;
                checkScore();
            }
        }, 1000);
    }

    function resetBall() {
        ballInPlay = false;
        ballPosition.x = userPosition;
        ballPosition.y = floorTop - 30;
        ballVelocity.x = 0;
        ballVelocity.y = 0;
        
        ball.style.left = `${ballPosition.x - 15}px`;
        ball.style.bottom = `${window.innerHeight - ballPosition.y - 15}px`;
    }

    function showMessage(text, isGameEnd = false) {
        messageElement.innerHTML = '';
        messageElement.textContent = text;
        messageElement.style.display = 'block';
        
        if (isGameEnd) {
            const restartButton = document.createElement('button');
            restartButton.textContent = 'Play Again';
            restartButton.addEventListener('click', () => {
                messageElement.style.display = 'none';
                initGame();
            });
            messageElement.appendChild(document.createElement('br'));
            messageElement.appendChild(restartButton);
        } else {
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 1000);
        }
    }

    // Initialize event listeners
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', () => {
        floorTop = window.innerHeight * 0.7;
        if (!ballInPlay) resetBall();
    });

    // Start the game
    initGame();
});