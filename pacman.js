class PacmanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 20;
        this.rows = 30;
        this.cols = 40;
        
        // Game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameRunning = true;
        this.paused = false;
        
        // Speed control - slow down the game
        this.moveCounter = 0;
        this.moveSpeed = 8; // Move every 8 frames (slower gameplay)
        
        // Audio system
        this.audioEnabled = true;
        this.sounds = {};
        this.initAudio();
        
        // Maze layout (1 = wall, 0 = empty, 2 = dot, 3 = power pellet)
        this.maze = this.createMaze();
        this.originalMaze = JSON.parse(JSON.stringify(this.maze));
        
        // Pacman
        this.pacman = {
            x: 19,
            y: 23,
            direction: 0, // 0=right, 1=down, 2=left, 3=up
            nextDirection: 0,
            mouthOpen: true,
            animationCounter: 0
        };
        
        // Ghosts
        this.ghosts = [
            { x: 19, y: 11, direction: 0, color: '#ff0000', mode: 'scatter', modeTimer: 0, target: {x: 0, y: 0} }, // Red (Blinky)
            { x: 19, y: 13, direction: 2, color: '#ffb8ff', mode: 'scatter', modeTimer: 0, target: {x: 0, y: 0} }, // Pink (Pinky)
            { x: 18, y: 13, direction: 1, color: '#00ffff', mode: 'scatter', modeTimer: 0, target: {x: 0, y: 0} }, // Cyan (Inky)
            { x: 20, y: 13, direction: 3, color: '#ffb852', mode: 'scatter', modeTimer: 0, target: {x: 0, y: 0} }  // Orange (Clyde)
        ];
        
        this.powerMode = false;
        this.powerModeTimer = 0;
        this.powerModeDuration = 300; // 5 seconds at 60fps
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    initAudio() {
        // Create audio context for sound effects
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create sound effects using Web Audio API
            this.sounds = {
                eatDot: this.createTone(800, 0.1, 'sine'),
                eatPowerPellet: this.createTone(400, 0.3, 'square'),
                eatGhost: this.createTone(200, 0.5, 'sawtooth'),
                death: this.createTone(150, 1.0, 'triangle'),
                gameStart: this.createTone(600, 0.8, 'sine')
            };
            
            // Play game start sound
            this.playSound('gameStart');
        } catch (error) {
            console.log('Audio not supported:', error);
            this.audioEnabled = false;
        }
    }
    
    createTone(frequency, duration, waveType = 'sine') {
        return {
            frequency: frequency,
            duration: duration,
            waveType: waveType
        };
    }
    
    playSound(soundName) {
        if (!this.audioEnabled || !this.audioContext || !this.sounds[soundName]) return;
        
        try {
            const sound = this.sounds[soundName];
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(sound.frequency, this.audioContext.currentTime);
            oscillator.type = sound.waveType;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + sound.duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + sound.duration);
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    }
    
    createMaze() {
        // Create a more structured maze to ensure all dots are reachable
        const maze = [];
        
        // Initialize with all empty spaces
        for (let y = 0; y < this.rows; y++) {
            maze[y] = [];
            for (let x = 0; x < this.cols; x++) {
                maze[y][x] = 0;
            }
        }
        
        // Create border walls
        for (let x = 0; x < this.cols; x++) {
            maze[0][x] = 1;
            maze[this.rows - 1][x] = 1;
        }
        for (let y = 0; y < this.rows; y++) {
            maze[y][0] = 1;
            maze[y][this.cols - 1] = 1;
        }
        
        // Create internal wall pattern - more structured to ensure connectivity
        for (let y = 2; y < this.rows - 2; y += 4) {
            for (let x = 2; x < this.cols - 2; x += 4) {
                // Create wall blocks with gaps
                if (Math.random() > 0.2) {
                    maze[y][x] = 1;
                    maze[y][x + 1] = 1;
                    maze[y + 1][x] = 1;
                    maze[y + 1][x + 1] = 1;
                }
            }
        }
        
        // Create horizontal corridors
        for (let y = 4; y < this.rows - 4; y += 8) {
            for (let x = 1; x < this.cols - 1; x++) {
                if (maze[y][x] === 1) maze[y][x] = 0;
            }
        }
        
        // Create vertical corridors
        for (let x = 4; x < this.cols - 4; x += 8) {
            for (let y = 1; y < this.rows - 1; y++) {
                if (maze[y][x] === 1) maze[y][x] = 0;
            }
        }
        
        // Create ghost house
        for (let y = 11; y <= 15; y++) {
            for (let x = 17; x <= 21; x++) {
                if (y === 11 || y === 15 || x === 17 || x === 21) {
                    maze[y][x] = 1;
                } else {
                    maze[y][x] = 0;
                }
            }
        }
        
        // Ghost house entrance
        maze[11][19] = 0;
        maze[11][20] = 0;
        
        // Clear paths around Pacman starting position
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const nx = 19 + dx;
                const ny = 23 + dy;
                if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
                    if (maze[ny][nx] === 1) maze[ny][nx] = 0;
                }
            }
        }
        
        // Place dots in all empty spaces
        for (let y = 1; y < this.rows - 1; y++) {
            for (let x = 1; x < this.cols - 1; x++) {
                if (maze[y][x] === 0) {
                    maze[y][x] = 2;
                }
            }
        }
        
        // Place power pellets in corners
        const powerPelletPositions = [
            {x: 2, y: 2}, {x: this.cols - 3, y: 2},
            {x: 2, y: this.rows - 3}, {x: this.cols - 3, y: this.rows - 3}
        ];
        
        powerPelletPositions.forEach(pos => {
            if (pos.x >= 0 && pos.x < this.cols && pos.y >= 0 && pos.y < this.rows) {
                maze[pos.y][pos.x] = 3;
            }
        });
        
        // Clear starting positions
        maze[23][19] = 0; // Pacman start
        maze[11][19] = 0; // Ghost house entrance
        maze[13][19] = 0; // Ghost positions
        maze[13][18] = 0;
        maze[13][20] = 0;
        
        return maze;
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.paused) return;
            
            switch(e.key) {
                case 'ArrowRight':
                    this.pacman.nextDirection = 0;
                    break;
                case 'ArrowDown':
                    this.pacman.nextDirection = 1;
                    break;
                case 'ArrowLeft':
                    this.pacman.nextDirection = 2;
                    break;
                case 'ArrowUp':
                    this.pacman.nextDirection = 3;
                    break;
            }
        });
    }
    
    canMove(x, y, direction) {
        const dx = [1, 0, -1, 0][direction];
        const dy = [0, 1, 0, -1][direction];
        const newX = x + dx;
        const newY = y + dy;
        
        // Tunnel effect (wrap around horizontally)
        if (newX < 0) return { x: this.cols - 1, y: newY, canMove: true };
        if (newX >= this.cols) return { x: 0, y: newY, canMove: true };
        
        if (newY < 0 || newY >= this.rows) return { x: newX, y: newY, canMove: false };
        
        return { 
            x: newX, 
            y: newY, 
            canMove: this.maze[newY][newX] !== 1 
        };
    }
    
    updatePacman() {
        // Speed control - only move every moveSpeed frames
        this.moveCounter++;
        if (this.moveCounter < this.moveSpeed) {
            // Still animate mouth even when not moving
            this.pacman.animationCounter++;
            if (this.pacman.animationCounter % 10 === 0) {
                this.pacman.mouthOpen = !this.pacman.mouthOpen;
            }
            return;
        }
        this.moveCounter = 0;
        
        // Try to change direction
        const nextMove = this.canMove(this.pacman.x, this.pacman.y, this.pacman.nextDirection);
        if (nextMove.canMove) {
            this.pacman.direction = this.pacman.nextDirection;
        }
        
        // Move in current direction
        const move = this.canMove(this.pacman.x, this.pacman.y, this.pacman.direction);
        if (move.canMove) {
            this.pacman.x = move.x;
            this.pacman.y = move.y;
            
            // Eat dots
            if (this.maze[this.pacman.y][this.pacman.x] === 2) {
                this.maze[this.pacman.y][this.pacman.x] = 0;
                this.score += 10;
                this.updateScore();
                this.playSound('eatDot');
            }
            // Eat power pellet
            else if (this.maze[this.pacman.y][this.pacman.x] === 3) {
                this.maze[this.pacman.y][this.pacman.x] = 0;
                this.score += 50;
                this.powerMode = true;
                this.powerModeTimer = this.powerModeDuration;
                this.updateScore();
                this.playSound('eatPowerPellet');
            }
        }
        
        // Animation
        this.pacman.animationCounter++;
        if (this.pacman.animationCounter % 10 === 0) {
            this.pacman.mouthOpen = !this.pacman.mouthOpen;
        }
        
        // Check if level complete
        if (this.isLevelComplete()) {
            this.nextLevel();
        }
    }
    
    updateGhosts() {
        // Ghosts move slightly slower than Pacman
        if (this.moveCounter % (this.moveSpeed + 2) !== 0) return;
        
        this.ghosts.forEach((ghost, index) => {
            // Update mode timer
            ghost.modeTimer++;
            
            // Switch between scatter and chase modes
            if (ghost.modeTimer > 300) { // 5 seconds
                ghost.mode = ghost.mode === 'scatter' ? 'chase' : 'scatter';
                ghost.modeTimer = 0;
                ghost.direction = (ghost.direction + 2) % 4; // Reverse direction
            }
            
            // Set target based on mode and implement different AI algorithms
            if (this.powerMode) {
                // Run away from Pacman using flee algorithm
                this.setFleeTarget(ghost);
            } else if (ghost.mode === 'chase') {
                // Different chase behaviors for each ghost
                switch(index) {
                    case 0: // Red ghost (Blinky) - direct chase using A* pathfinding
                        this.setDirectChaseTarget(ghost);
                        break;
                    case 1: // Pink ghost (Pinky) - ambush algorithm
                        this.setAmbushTarget(ghost);
                        break;
                    case 2: // Cyan ghost (Inky) - complex behavior with prediction
                        this.setPredictiveTarget(ghost);
                        break;
                    case 3: // Orange ghost (Clyde) - patrol algorithm
                        this.setPatrolTarget(ghost);
                        break;
                }
            } else {
                // Scatter mode - go to corners
                this.setScatterTarget(ghost, index);
            }
            
            // Move ghost towards target using improved pathfinding
            this.moveGhostImproved(ghost);
        });
        
        // Update power mode
        if (this.powerMode) {
            this.powerModeTimer--;
            if (this.powerModeTimer <= 0) {
                this.powerMode = false;
            }
        }
    }
    
    setFleeTarget(ghost) {
        // Flee algorithm - move away from Pacman
        const dx = ghost.x - this.pacman.x;
        const dy = ghost.y - this.pacman.y;
        ghost.target = {
            x: Math.max(0, Math.min(this.cols - 1, ghost.x + dx * 2)),
            y: Math.max(0, Math.min(this.rows - 1, ghost.y + dy * 2))
        };
    }
    
    setDirectChaseTarget(ghost) {
        // Direct chase - simple but effective
        ghost.target = { x: this.pacman.x, y: this.pacman.y };
    }
    
    setAmbushTarget(ghost) {
        // Ambush algorithm - target 4 tiles ahead of Pacman
        const dx = [4, 0, -4, 0][this.pacman.direction];
        const dy = [0, 4, 0, -4][this.pacman.direction];
        ghost.target = { 
            x: Math.max(0, Math.min(this.cols - 1, this.pacman.x + dx)), 
            y: Math.max(0, Math.min(this.rows - 1, this.pacman.y + dy))
        };
    }
    
    setPredictiveTarget(ghost) {
        // Predictive algorithm - anticipate Pacman's movement
        const redGhost = this.ghosts[0];
        const vectorX = this.pacman.x - redGhost.x;
        const vectorY = this.pacman.y - redGhost.y;
        ghost.target = {
            x: Math.max(0, Math.min(this.cols - 1, this.pacman.x + vectorX)),
            y: Math.max(0, Math.min(this.rows - 1, this.pacman.y + vectorY))
        };
    }
    
    setPatrolTarget(ghost) {
        // Patrol algorithm - chase if far, scatter if close
        const dist = Math.abs(ghost.x - this.pacman.x) + Math.abs(ghost.y - this.pacman.y);
        if (dist > 8) {
            ghost.target = { x: this.pacman.x, y: this.pacman.y };
        } else {
            ghost.target = { x: 0, y: this.rows - 1 };
        }
    }
    
    setScatterTarget(ghost, index) {
        // Scatter mode - go to corners
        const corners = [
            { x: this.cols - 1, y: 0 },
            { x: 0, y: 0 },
            { x: this.cols - 1, y: this.rows - 1 },
            { x: 0, y: this.rows - 1 }
        ];
        ghost.target = corners[index];
    }
    
    moveGhost(ghost) {
        const directions = [0, 1, 2, 3];
        let bestDirection = ghost.direction;
        let bestDistance = Infinity;
        
        // Try all directions except reverse
        directions.forEach(dir => {
            if (dir === (ghost.direction + 2) % 4) return; // Don't reverse
            
            const move = this.canMove(ghost.x, ghost.y, dir);
            if (move.canMove) {
                const distance = Math.abs(move.x - ghost.target.x) + Math.abs(move.y - ghost.target.y);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestDirection = dir;
                }
            }
        });
        
        ghost.direction = bestDirection;
        const move = this.canMove(ghost.x, ghost.y, ghost.direction);
        if (move.canMove) {
            ghost.x = move.x;
            ghost.y = move.y;
        }
    }
    
    moveGhostImproved(ghost) {
        const directions = [0, 1, 2, 3];
        let bestDirection = ghost.direction;
        let bestDistance = Infinity;
        let validMoves = [];
        
        // Collect all valid moves
        directions.forEach(dir => {
            const move = this.canMove(ghost.x, ghost.y, dir);
            if (move.canMove) {
                const distance = Math.abs(move.x - ghost.target.x) + Math.abs(move.y - ghost.target.y);
                validMoves.push({ direction: dir, distance: distance, x: move.x, y: move.y });
            }
        });
        
        // If no valid moves, stay in place
        if (validMoves.length === 0) return;
        
        // Sort by distance to target
        validMoves.sort((a, b) => a.distance - b.distance);
        
        // Avoid reversing direction unless it's the only option
        const nonReverseMoves = validMoves.filter(move => 
            move.direction !== (ghost.direction + 2) % 4
        );
        
        if (nonReverseMoves.length > 0) {
            bestDirection = nonReverseMoves[0].direction;
        } else {
            bestDirection = validMoves[0].direction;
        }
        
        ghost.direction = bestDirection;
        const move = this.canMove(ghost.x, ghost.y, ghost.direction);
        if (move.canMove) {
            ghost.x = move.x;
            ghost.y = move.y;
        }
    }
    
    checkCollisions() {
        this.ghosts.forEach(ghost => {
            if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                if (this.powerMode) {
                    // Eat ghost
                    this.score += 200;
                    this.updateScore();
                    this.playSound('eatGhost');
                    // Reset ghost to center
                    ghost.x = 19;
                    ghost.y = 13;
                } else {
                    // Pacman dies
                    this.lives--;
                    this.updateLives();
                    this.playSound('death');
                    if (this.lives <= 0) {
                        this.gameOver();
                    } else {
                        this.resetPositions();
                    }
                }
            }
        });
    }
    
    resetPositions() {
        this.pacman.x = 19;
        this.pacman.y = 23;
        this.pacman.direction = 0;
        this.pacman.nextDirection = 0;
        
        this.ghosts[0] = { ...this.ghosts[0], x: 19, y: 11, direction: 0 };
        this.ghosts[1] = { ...this.ghosts[1], x: 19, y: 13, direction: 2 };
        this.ghosts[2] = { ...this.ghosts[2], x: 18, y: 13, direction: 1 };
        this.ghosts[3] = { ...this.ghosts[3], x: 20, y: 13, direction: 3 };
        
        this.powerMode = false;
        this.powerModeTimer = 0;
    }
    
    isLevelComplete() {
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.maze[y][x] === 2 || this.maze[y][x] === 3) {
                    return false;
                }
            }
        }
        return true;
    }
    
    nextLevel() {
        this.level++;
        this.maze = JSON.parse(JSON.stringify(this.originalMaze));
        this.resetPositions();
        this.updateLevel();
    }
    
    gameOver() {
        this.gameRunning = false;
        this.showGameOver();
    }
    
    showGameOver() {
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over';
        gameOverDiv.innerHTML = `
            <h2>Game Over!</h2>
            <p>Final Score: ${this.score}</p>
            <p>Level Reached: ${this.level}</p>
            <button onclick="game.restart()">Play Again</button>
        `;
        document.body.appendChild(gameOverDiv);
    }
    
    restart() {
        // Remove game over screen if it exists
        const gameOverDiv = document.querySelector('.game-over');
        if (gameOverDiv) {
            gameOverDiv.remove();
        }
        
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.gameRunning = true;
        this.paused = false;
        this.maze = JSON.parse(JSON.stringify(this.originalMaze));
        this.resetPositions();
        this.updateScore();
        this.updateLives();
        this.updateLevel();
    }
    
    togglePause() {
        this.paused = !this.paused;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }
    
    updateLives() {
        document.getElementById('lives').textContent = this.lives;
    }
    
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw maze
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                
                switch(this.maze[y][x]) {
                    case 1: // Wall
                        this.ctx.fillStyle = '#00f';
                        this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                        break;
                    case 2: // Dot
                        this.ctx.fillStyle = '#ff0';
                        this.ctx.beginPath();
                        this.ctx.arc(cellX + this.cellSize/2, cellY + this.cellSize/2, 2, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                    case 3: // Power pellet
                        this.ctx.fillStyle = '#ff0';
                        this.ctx.beginPath();
                        this.ctx.arc(cellX + this.cellSize/2, cellY + this.cellSize/2, 6, 0, Math.PI * 2);
                        this.ctx.fill();
                        break;
                }
            }
        }
        
        // Draw Pacman
        this.drawPacman();
        
        // Draw ghosts
        this.ghosts.forEach(ghost => this.drawGhost(ghost));
        
        // Draw power mode indicator
        if (this.powerMode) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Draw pause indicator
        if (this.paused) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
        }
    }
    
    drawPacman() {
        const x = this.pacman.x * this.cellSize + this.cellSize/2;
        const y = this.pacman.y * this.cellSize + this.cellSize/2;
        const radius = this.cellSize/2 + 2; // Made bigger by removing the -2 and adding +2
        
        this.ctx.fillStyle = '#ff0';
        this.ctx.beginPath();
        
        if (this.pacman.mouthOpen) {
            // Draw Pacman with mouth open
            const mouthAngle = Math.PI / 3;
            const startAngle = this.pacman.direction * Math.PI/2 - mouthAngle/2;
            const endAngle = this.pacman.direction * Math.PI/2 + mouthAngle/2;
            
            this.ctx.arc(x, y, radius, endAngle, startAngle);
            this.ctx.lineTo(x, y);
        } else {
            // Draw full circle
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        }
        
        this.ctx.fill();
    }
    
    drawGhost(ghost) {
        const x = ghost.x * this.cellSize + this.cellSize/2;
        const y = ghost.y * this.cellSize + this.cellSize/2;
        const radius = this.cellSize/2 + 2; // Made bigger by removing the -2 and adding +2
        
        // Ghost body color
        if (this.powerMode && this.powerModeTimer > 60) {
            this.ctx.fillStyle = '#0000ff'; // Blue when vulnerable
        } else if (this.powerMode) {
            this.ctx.fillStyle = this.powerModeTimer % 20 < 10 ? '#0000ff' : '#fff'; // Flashing
        } else {
            this.ctx.fillStyle = ghost.color;
        }
        
        // Draw ghost body
        this.ctx.beginPath();
        this.ctx.arc(x, y - radius/2, radius, Math.PI, 0);
        this.ctx.rect(x - radius, y - radius/2, radius * 2, radius * 1.5);
        
        // Ghost bottom (wavy)
        const waveHeight = 4;
        const waveWidth = radius / 2;
        for (let i = 0; i < 4; i++) {
            const waveX = x - radius + i * waveWidth;
            if (i % 2 === 0) {
                this.ctx.lineTo(waveX, y + radius/2);
                this.ctx.lineTo(waveX + waveWidth/2, y + radius/2 + waveHeight);
            } else {
                this.ctx.lineTo(waveX + waveWidth/2, y + radius/2 - waveHeight);
                this.ctx.lineTo(waveX + waveWidth, y + radius/2);
            }
        }
        
        this.ctx.fill();
        
        // Draw eyes
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(x - radius/3, y - radius/3, radius/4, 0, Math.PI * 2);
        this.ctx.arc(x + radius/3, y - radius/3, radius/4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(x - radius/3, y - radius/3, radius/6, 0, Math.PI * 2);
        this.ctx.arc(x + radius/3, y - radius/3, radius/6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    gameLoop() {
        if (this.gameRunning && !this.paused) {
            this.updatePacman();
            this.updateGhosts();
            this.checkCollisions();
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game
const game = new PacmanGame();