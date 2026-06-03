/**
 * Snake Game for Spotify Music Player
 * Classic snake game with mobile touch controls and swipe gestures
 */

class SnakeGame {
    constructor() {
        // Canvas and context
        this.canvas = document.getElementById('snakeCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game settings
        this.gridSize = 20;
        this.tileCount = 20;
        this.tileSize = this.canvas.width / this.tileCount;

        // Snake properties
        this.snake = [];
        this.snakeLength = 3;
        this.headX = 10;
        this.headY = 10;
        this.velocityX = 0;
        this.velocityY = 0;

        // Food properties
        this.foodX = 15;
        this.foodY = 15;

        // Game state
        this.score = 0;
        this.highScore = localStorage.getItem('snakeHighScore') || 0;
        this.gameLoop = null;
        this.isGameOver = false;
        this.gameSpeed = 100;

        // Touch/Swipe properties
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 30;

        // Colors
        this.snakeColor = '#1DB954';
        this.foodColor = '#1ed760';
        this.backgroundColor = '#000000';
        this.gridColor = '#1a1a1a';

        // Initialize
        this.init();
    }

    init() {
        // Update high score display
        document.getElementById('highScore').textContent = this.highScore;

        // Set up event listeners
        this.setupEventListeners();

        // Initialize snake
        this.resetGame();

        // Start game loop
        this.startGame();
    }

    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));

        // Touch controls (D-pad buttons)
        const controlButtons = document.querySelectorAll('.control-btn');
        controlButtons.forEach(button => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = button.getAttribute('data-direction');
                this.changeDirection(direction);
            });
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const direction = button.getAttribute('data-direction');
                this.changeDirection(direction);
            });
        });

        // Swipe gestures on canvas
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Restart button
        document.getElementById('restartGame').addEventListener('click', () => {
            this.hideGameOver();
            this.resetGame();
            this.startGame();
        });
    }

    handleKeyPress(e) {
        // Prevent default arrow key behavior (scrolling)
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }

        if (this.isGameOver) return;

        switch(e.key) {
            case 'ArrowUp':
                if (this.velocityY !== 1) {
                    this.velocityX = 0;
                    this.velocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (this.velocityY !== -1) {
                    this.velocityX = 0;
                    this.velocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (this.velocityX !== 1) {
                    this.velocityX = -1;
                    this.velocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (this.velocityX !== -1) {
                    this.velocityX = 1;
                    this.velocityY = 0;
                }
                break;
        }
    }

    changeDirection(direction) {
        if (this.isGameOver) return;

        switch(direction) {
            case 'up':
                if (this.velocityY !== 1) {
                    this.velocityX = 0;
                    this.velocityY = -1;
                }
                break;
            case 'down':
                if (this.velocityY !== -1) {
                    this.velocityX = 0;
                    this.velocityY = 1;
                }
                break;
            case 'left':
                if (this.velocityX !== 1) {
                    this.velocityX = -1;
                    this.velocityY = 0;
                }
                break;
            case 'right':
                if (this.velocityX !== -1) {
                    this.velocityX = 1;
                    this.velocityY = 0;
                }
                break;
        }
    }

    // Touch and swipe handling
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
    }

    handleTouchMove(e) {
        e.preventDefault();
    }

    handleTouchEnd(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        this.touchEndX = touch.clientX;
        this.touchEndY = touch.clientY;
        this.handleSwipe();
    }

    handleSwipe() {
        if (this.isGameOver) return;

        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;

        // Determine if swipe is horizontal or vertical
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (Math.abs(deltaX) > this.minSwipeDistance) {
                if (deltaX > 0) {
                    this.changeDirection('right');
                } else {
                    this.changeDirection('left');
                }
            }
        } else {
            // Vertical swipe
            if (Math.abs(deltaY) > this.minSwipeDistance) {
                if (deltaY > 0) {
                    this.changeDirection('down');
                } else {
                    this.changeDirection('up');
                }
            }
        }
    }

    startGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        this.gameLoop = setInterval(() => this.update(), this.gameSpeed);
    }

    stopGame() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    resetGame() {
        // Reset snake position and direction
        this.headX = 10;
        this.headY = 10;
        this.velocityX = 0;
        this.velocityY = 0;
        this.snake = [];
        this.snakeLength = 3;

        // Reset score
        this.score = 0;
        document.getElementById('score').textContent = this.score;

        // Place food
        this.placeFood();

        // Reset game state
        this.isGameOver = false;
    }

    update() {
        if (this.isGameOver) return;

        // Move snake
        this.headX += this.velocityX;
        this.headY += this.velocityY;

        // Check wall collision
        if (this.headX < 0 || this.headX >= this.tileCount ||
            this.headY < 0 || this.headY >= this.tileCount) {
            this.endGame();
            return;
        }

        // Check self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (this.snake[i].x === this.headX && this.snake[i].y === this.headY) {
                this.endGame();
                return;
            }
        }

        // Add new head position
        this.snake.push({ x: this.headX, y: this.headY });

        // Remove tail if snake hasn't grown
        while (this.snake.length > this.snakeLength) {
            this.snake.shift();
        }

        // Check food collision
        if (this.headX === this.foodX && this.headY === this.foodY) {
            this.snakeLength++;
            this.score += 10;
            document.getElementById('score').textContent = this.score;
            this.placeFood();

            // Update high score
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
                document.getElementById('highScore').textContent = this.highScore;
            }
        }

        // Draw everything
        this.draw();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid (subtle)
        this.ctx.strokeStyle = this.gridColor;
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.ctx.fillStyle = this.snakeColor;
        for (let i = 0; i < this.snake.length; i++) {
            const segment = this.snake[i];

            // Add slight gradient effect to snake
            if (i === this.snake.length - 1) {
                // Head is brighter
                this.ctx.fillStyle = '#1ed760';
            } else {
                this.ctx.fillStyle = this.snakeColor;
            }

            // Draw rounded rectangle for snake segments
            this.drawRoundedRect(
                segment.x * this.tileSize + 1,
                segment.y * this.tileSize + 1,
                this.tileSize - 2,
                this.tileSize - 2,
                4
            );
        }

        // Draw food with pulsing effect
        this.ctx.fillStyle = this.foodColor;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = this.foodColor;
        this.drawRoundedRect(
            this.foodX * this.tileSize + 2,
            this.foodY * this.tileSize + 2,
            this.tileSize - 4,
            this.tileSize - 4,
            5
        );
        this.ctx.shadowBlur = 0;
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.arcTo(x + width, y, x + width, y + radius, radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.arcTo(x, y + height, x, y + height - radius, radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.arcTo(x, y, x + radius, y, radius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    placeFood() {
        // Generate random food position
        let validPosition = false;

        while (!validPosition) {
            this.foodX = Math.floor(Math.random() * this.tileCount);
            this.foodY = Math.floor(Math.random() * this.tileCount);

            // Check if food is not on snake
            validPosition = true;
            for (let i = 0; i < this.snake.length; i++) {
                if (this.snake[i].x === this.foodX && this.snake[i].y === this.foodY) {
                    validPosition = false;
                    break;
                }
            }
        }
    }

    endGame() {
        this.isGameOver = true;
        this.stopGame();
        this.showGameOver();
    }

    showGameOver() {
        const gameOverDiv = document.getElementById('gameOver');
        document.getElementById('finalScore').textContent = this.score;
        gameOverDiv.style.display = 'block';
    }

    hideGameOver() {
        document.getElementById('gameOver').style.display = 'none';
    }
}

// Modal control and game initialization
let snakeGame = null;

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('snakeGameModal');
    const openBtn = document.getElementById('openSnakeGame');
    const closeBtn = document.getElementById('closeSnakeGame');

    // Open modal
    openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        if (!snakeGame) {
            snakeGame = new SnakeGame();
        } else {
            snakeGame.hideGameOver();
            snakeGame.resetGame();
            snakeGame.startGame();
        }
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        if (snakeGame) {
            snakeGame.stopGame();
        }
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            if (snakeGame) {
                snakeGame.stopGame();
            }
        }
    });

    // Prevent body scrolling when game is open
    modal.addEventListener('touchmove', (e) => {
        if (e.target === modal) {
            e.preventDefault();
        }
    }, { passive: false });
});
