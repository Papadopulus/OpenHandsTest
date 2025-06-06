# OpenHandsTest - PACMAN Game

This repository contains a fully functional PACMAN game implementation built with HTML5 Canvas and JavaScript.

## 🎮 Game Features

### Core Gameplay
- **Classic PACMAN maze** with walls, dots, and power pellets
- **Pacman character** with directional movement and mouth animation
- **4 AI-controlled ghosts** with different behaviors and colors:
  - Red Ghost (Blinky): Direct chase behavior
  - Pink Ghost (Pinky): Ambush behavior (targets 4 tiles ahead)
  - Cyan Ghost (Inky): Complex targeting behavior
  - Orange Ghost (Clyde): Distance-based chase/scatter behavior

### Game Mechanics
- **Collision detection** between Pacman and ghosts
- **Scoring system**:
  - Dots: 10 points each
  - Power pellets: 50 points each
  - Ghosts (during power mode): 200 points each
- **Power mode**: Eat power pellets to temporarily make ghosts vulnerable
- **Lives system**: Start with 3 lives, lose one when caught by a ghost
- **Level progression**: Complete a level by eating all dots
- **Game states**: Running, paused, game over

### Controls & UI
- **Arrow keys** for Pacman movement
- **Pause/Resume** button for game control
- **Restart** button to reset the game
- **Real-time display** of score, lives, and level
- **Visual feedback** for power mode and pause state

## 🚀 How to Play

1. **Open the game**: Open `index.html` in a web browser
2. **Move Pacman**: Use arrow keys (↑↓←→) to navigate the maze
3. **Eat dots**: Collect all yellow dots to advance to the next level
4. **Avoid ghosts**: Don't let the colored ghosts catch you (unless in power mode)
5. **Use power pellets**: Eat the large yellow circles to enter power mode
6. **Power mode**: When active, you can eat ghosts for bonus points
7. **Survive**: You have 3 lives - try to get the highest score possible!

## 🛠️ Technical Implementation

### Files Structure
```
├── index.html          # Main game HTML file
├── pacman.js          # Game logic and implementation
├── tests/
│   └── test_pacman.html   # Automated test suite
├── validate_game.js   # Game validation script
└── README.md         # This documentation
```

### Key Components

#### PacmanGame Class
- **Game initialization** and state management
- **Maze generation** with walls, dots, and power pellets
- **Game loop** running at 60 FPS with requestAnimationFrame

#### Pacman Logic
- **Movement system** with direction queuing
- **Collision detection** with walls and maze boundaries
- **Tunnel effect** for horizontal screen wrapping
- **Mouth animation** synchronized with movement

#### Ghost AI
- **Individual behaviors** for each ghost type
- **Mode switching** between scatter and chase
- **Pathfinding** using distance-based target selection
- **Power mode behavior** (flee from Pacman)

#### Rendering System
- **Canvas-based graphics** with 2D context
- **Sprite-like rendering** for characters
- **Visual effects** for power mode and pause state
- **Responsive UI** with real-time updates

## 🧪 Testing

The game includes comprehensive testing:

### Automated Tests
Run the validation script:
```bash
node validate_game.js
```

### Manual Testing
Open `tests/test_pacman.html` in a browser for interactive testing.

### Test Coverage
- Game initialization and setup
- Maze generation and structure
- Pacman movement and controls
- Ghost AI and behavior
- Collision detection
- Scoring system
- Power mode functionality
- Game state management
- UI updates and rendering

## 🎯 Game Requirements Fulfilled

✅ **PACMAN game implementation**
✅ **Real PACMAN game mechanics**
✅ **Maze with walls and navigation**
✅ **Ghost AI with different behaviors**
✅ **Complete game logic**:
- Dot collection
- Power pellet mechanics
- Lives and scoring
- Level progression
- Game over conditions

## 🚀 Running the Game

### Local Development
1. Clone the repository
2. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser

### Direct Browser Access
Simply open `index.html` directly in any modern web browser.

## 🎮 Game Controls

| Key | Action |
|-----|--------|
| ↑ | Move Up |
| ↓ | Move Down |
| ← | Move Left |
| → | Move Right |

## 🏆 Scoring

| Item | Points |
|------|--------|
| Dot | 10 |
| Power Pellet | 50 |
| Ghost (Power Mode) | 200 |

## 🔧 Browser Compatibility

The game works in all modern browsers that support:
- HTML5 Canvas
- ES6 Classes
- requestAnimationFrame
- Arrow functions

Tested browsers: Chrome, Firefox, Safari, Edge

---

**Enjoy playing PACMAN!** 🎮👻🟡
