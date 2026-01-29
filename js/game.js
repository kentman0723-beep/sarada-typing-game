/**
 * 皿打 - Sara-Da Typing Game
 * Main Game Logic
 */

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // タイピング音
    playType() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 800 + Math.random() * 200;
        osc.type = 'sine';

        gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gain.gain.exponentialDecayTo && gain.gain.exponentialDecayTo(0.01, this.audioContext.currentTime + 0.05);
        gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.05);
    }

    // 撃退音
    playDefeat() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
        osc.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.2);
        osc.type = 'square';

        gain.gain.setValueAtTime(this.volume * 0.4, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    // 食べ物盗まれた音
    playStolen() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
        osc.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.3);
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.3);
    }

    // ミス音
    playMiss() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 200;
        osc.type = 'square';

        gain.gain.setValueAtTime(this.volume * 0.2, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start(this.audioContext.currentTime);
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // ゲームオーバー音
    playGameOver() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const notes = [400, 350, 300, 200];
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            const startTime = this.audioContext.currentTime + i * 0.15;
            gain.gain.setValueAtTime(this.volume * 0.4, startTime);
            gain.gain.linearRampToValueAtTime(0.01, startTime + 0.15);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    // クリア音
    playClear() {
        if (!this.enabled || !this.audioContext) return;
        this.resume();

        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'sine';

            const startTime = this.audioContext.currentTime + i * 0.12;
            gain.gain.setValueAtTime(this.volume * 0.4, startTime);
            gain.gain.linearRampToValueAtTime(0.01, startTime + 0.2);

            osc.start(startTime);
            osc.stop(startTime + 0.2);
        });
    }
}

class Game {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Sound manager
        this.sound = new SoundManager();

        // Game state
        this.state = 'menu'; // menu, playing, gameover, clear
        this.difficulty = 'normal';

        // Game objects
        this.devils = [];
        this.particles = [];

        // Score & Stats
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.defeatedCount = 0;

        // Lives (食べ物の残り)
        this.maxLives = 5;
        this.lives = this.maxLives;
        this.foodEmojis = ['🍣', '🍰', '🍜', '🍤', '🍙'];

        // Difficulty settings
        this.difficultySettings = {
            easy: {
                spawnInterval: 3000,
                maxDevils: 3,
                stageGoal: 15
            },
            normal: {
                spawnInterval: 2000,
                maxDevils: 5,
                stageGoal: 25
            },
            hard: {
                spawnInterval: 1200,
                maxDevils: 8,
                stageGoal: 40
            }
        };

        // Timers
        this.lastSpawnTime = 0;
        this.stageProgress = 0;

        // Current input
        this.currentInput = '';
        this.targetDevil = null;

        // Images
        this.devilImage = new Image();
        this.backgroundImage = new Image();
        this.plateImage = new Image();
        this.imagesLoaded = 0;

        // Plate position & size
        this.plateX = 0;
        this.plateY = 0;
        this.plateSize = 200;

        // Initialize
        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Load images
        this.loadImages();

        // Event listeners
        this.setupEventListeners();

        // Start game loop
        this.lastTime = 0;
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    loadImages() {
        const imagesToLoad = [
            { img: this.devilImage, src: 'assets/images/devil.png' },
            { img: this.backgroundImage, src: 'assets/images/background.png' },
            { img: this.plateImage, src: 'assets/images/plate.png' }
        ];

        imagesToLoad.forEach(({ img, src }) => {
            img.onload = () => {
                this.imagesLoaded++;
            };
            img.onerror = () => {
                console.log(`Failed to load: ${src}`);
                this.imagesLoaded++;
            };
            img.src = src;
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.plateX = this.canvas.width / 2;
        this.plateY = this.canvas.height / 2;
    }

    setupEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('.btn-difficulty').forEach(btn => {
            btn.addEventListener('click', () => {
                this.sound.init();
                this.difficulty = btn.dataset.difficulty;
                this.startGame();
            });
        });

        // Retry and menu buttons
        document.getElementById('btn-retry').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('btn-menu').addEventListener('click', () => {
            this.showScreen('main-menu');
            this.state = 'menu';
        });

        document.getElementById('btn-next').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('btn-menu-clear').addEventListener('click', () => {
            this.showScreen('main-menu');
            this.state = 'menu';
        });

        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    handleKeyDown(e) {
        if (this.state !== 'playing') return;

        // Ignore modifier keys
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const key = e.key.toLowerCase();

        // Only handle letters and some special characters for typing
        if (key.length === 1 && /[a-z\-]/.test(key)) {
            e.preventDefault();
            this.processInput(key);
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            this.currentInput = this.currentInput.slice(0, -1);
            this.updateInputDisplay();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.currentInput = '';
            this.targetDevil = null;
            this.updateInputDisplay();
        }
    }

    processInput(char) {
        // If no target devil, find one that matches the first character
        if (!this.targetDevil || this.targetDevil.state !== 'approaching') {
            this.targetDevil = this.devils.find(d =>
                d.state === 'approaching' &&
                d.romaji[d.typedIndex] === char
            );

            if (!this.targetDevil) {
                // Wrong input - shake effect
                this.shakeInput();
                this.resetCombo();
                this.sound.playMiss();
                return;
            }
        }

        const result = this.targetDevil.checkInput(char);

        if (result === 'correct') {
            this.currentInput += char;
            this.updateInputDisplay();
            this.addTypingParticle();
            this.sound.playType();
        } else if (result === 'complete') {
            this.currentInput = '';
            this.targetDevil = null;
            this.updateInputDisplay();
        } else {
            // Wrong input
            this.shakeInput();
            this.resetCombo();
            this.sound.playMiss();
        }
    }

    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.defeatedCount = 0;
        this.lives = this.maxLives;
        this.devils = [];
        this.particles = [];
        this.currentInput = '';
        this.targetDevil = null;
        this.stageProgress = 0;
        this.lastSpawnTime = Date.now();

        this.updateUI();
        this.showScreen('game-screen');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    gameLoop(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.state === 'playing') {
            this.update(deltaTime);
            this.render();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        const settings = this.difficultySettings[this.difficulty];

        // Spawn new devils
        const now = Date.now();
        if (now - this.lastSpawnTime > settings.spawnInterval &&
            this.devils.length < settings.maxDevils &&
            this.stageProgress < settings.stageGoal) {
            this.spawnDevil();
            this.lastSpawnTime = now;
        }

        // Update devils
        this.devils.forEach(devil => devil.update(deltaTime));

        // Remove dead devils
        this.devils = this.devils.filter(d => !d.canRemove());

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= deltaTime;
            p.alpha = Math.max(0, p.life / p.maxLife);
        });
        this.particles = this.particles.filter(p => p.life > 0);

        // Check win condition
        if (this.stageProgress >= settings.stageGoal && this.devils.length === 0) {
            this.stageClear();
        }
    }

    spawnDevil() {
        const wordData = getRandomWord(this.difficulty);
        const devil = new Devil(this, wordData);
        this.devils.push(devil);
        this.stageProgress++;
    }

    render() {
        const ctx = this.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.renderBackground();

        // Draw plate and food
        this.renderPlate();

        // Draw particles
        this.renderParticles();

        // Draw devils
        this.devils.forEach(devil => devil.render(ctx));
    }

    renderBackground() {
        const ctx = this.ctx;

        if (this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
            // Draw background image with cover effect
            const imgRatio = this.backgroundImage.width / this.backgroundImage.height;
            const canvasRatio = this.canvas.width / this.canvas.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (canvasRatio > imgRatio) {
                drawWidth = this.canvas.width;
                drawHeight = this.canvas.width / imgRatio;
                offsetX = 0;
                offsetY = (this.canvas.height - drawHeight) / 2;
            } else {
                drawHeight = this.canvas.height;
                drawWidth = this.canvas.height * imgRatio;
                offsetX = (this.canvas.width - drawWidth) / 2;
                offsetY = 0;
            }

            ctx.drawImage(
                this.backgroundImage,
                offsetX, offsetY,
                drawWidth,
                drawHeight
            );

            // Add dark overlay for better visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback gradient background
            const gradient = ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, 0,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
            );
            gradient.addColorStop(0, '#2d2d44');
            gradient.addColorStop(1, '#1a1a2e');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    renderPlate() {
        const ctx = this.ctx;
        const x = this.plateX;
        const y = this.plateY;

        // Plate glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, this.plateSize * 0.8);
        glowGradient.addColorStop(0, 'rgba(255, 212, 59, 0.25)');
        glowGradient.addColorStop(0.5, 'rgba(255, 212, 59, 0.1)');
        glowGradient.addColorStop(1, 'rgba(255, 212, 59, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, this.plateSize * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Draw plate image
        if (this.plateImage.complete && this.plateImage.naturalWidth > 0) {
            // Calculate size based on remaining lives
            const baseSize = this.plateSize;
            const displaySize = baseSize + (this.lives / this.maxLives) * 20;

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 15;

            ctx.drawImage(
                this.plateImage,
                x - displaySize / 2,
                y - displaySize / 2,
                displaySize,
                displaySize
            );
            ctx.restore();

            // Overlay to show food being taken
            if (this.lives < this.maxLives) {
                const lostRatio = 1 - (this.lives / this.maxLives);
                ctx.fillStyle = `rgba(50, 50, 50, ${lostRatio * 0.5})`;
                ctx.beginPath();
                ctx.arc(x, y, displaySize / 2 * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // Fallback plate drawing
            ctx.fillStyle = '#fff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 10;
            ctx.beginPath();
            ctx.ellipse(x, y, this.plateSize / 2, this.plateSize / 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowColor = 'transparent';

            // Plate rim
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Fallback - draw emoji
            ctx.font = '30px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const positions = [
                { x: -20, y: -10 },
                { x: 20, y: -10 },
                { x: 0, y: 10 },
                { x: -30, y: 5 },
                { x: 30, y: 5 }
            ];

            for (let i = 0; i < this.lives; i++) {
                const pos = positions[i];
                ctx.fillText(this.foodEmojis[i], x + pos.x, y + pos.y);
            }
        }

        // Lives indicator
        const indicatorY = y + this.plateSize / 2 + 30;
        ctx.font = 'bold 14px "Noto Sans JP", sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText(`残り ${this.lives}/${this.maxLives}`, x, indicatorY);
    }

    renderParticles() {
        const ctx = this.ctx;

        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    addTypingParticle() {
        const inputDisplay = document.querySelector('.input-display');
        if (!inputDisplay) return;

        const rect = inputDisplay.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 5 - 2,
                size: Math.random() * 4 + 2,
                color: ['#ff6b6b', '#845ef7', '#ffd43b', '#51cf66'][Math.floor(Math.random() * 4)],
                life: 500,
                maxLife: 500,
                alpha: 1
            });
        }
    }

    addDefeatParticles(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = Math.random() * 5 + 3;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                color: ['#ff6b6b', '#845ef7', '#ffd43b'][Math.floor(Math.random() * 3)],
                life: 800,
                maxLife: 800,
                alpha: 1
            });
        }
    }

    // Called when devil is defeated
    onDevilDefeated(devil) {
        // Score based on word length
        const baseScore = devil.romaji.length * 10;
        const comboBonus = this.combo * 5;
        this.score += baseScore + comboBonus;

        // Increase combo
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }

        this.defeatedCount++;

        // Add particles
        this.addDefeatParticles(devil.x, devil.y);

        // Play sound
        this.sound.playDefeat();

        this.updateUI();
    }

    // Called when food is stolen
    onFoodStolen(devil) {
        this.lives--;
        this.resetCombo();
        this.updateUI();

        // Play sound
        this.sound.playStolen();

        // Shake screen
        document.getElementById('game-container').classList.add('shake');
        setTimeout(() => {
            document.getElementById('game-container').classList.remove('shake');
        }, 300);

        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    resetCombo() {
        this.combo = 0;
        this.updateComboDisplay();
    }

    shakeInput() {
        const inputDisplay = document.querySelector('.input-display');
        inputDisplay.classList.add('shake');
        setTimeout(() => inputDisplay.classList.remove('shake'), 300);
    }

    updateUI() {
        document.getElementById('score-value').textContent = this.score.toLocaleString();
        this.updateComboDisplay();
        this.updateLivesDisplay();
    }

    updateComboDisplay() {
        const comboDisplay = document.getElementById('combo-display');
        const comboValue = document.getElementById('combo-value');

        if (this.combo > 1) {
            comboDisplay.classList.add('active');
            comboValue.textContent = this.combo;
        } else {
            comboDisplay.classList.remove('active');
        }
    }

    updateLivesDisplay() {
        const livesContainer = document.getElementById('lives-icons');
        livesContainer.innerHTML = '';

        for (let i = 0; i < this.maxLives; i++) {
            const icon = document.createElement('span');
            icon.className = 'food-icon' + (i >= this.lives ? ' lost' : '');
            icon.textContent = this.foodEmojis[i];
            livesContainer.appendChild(icon);
        }
    }

    updateInputDisplay() {
        document.getElementById('current-input').textContent = this.currentInput;
    }

    gameOver() {
        this.state = 'gameover';

        // Play sound
        this.sound.playGameOver();

        // Update final stats
        document.getElementById('final-score').textContent = this.score.toLocaleString();
        document.getElementById('final-combo').textContent = this.maxCombo;
        document.getElementById('final-defeats').textContent = this.defeatedCount;

        setTimeout(() => {
            this.showScreen('gameover-screen');
        }, 500);
    }

    stageClear() {
        this.state = 'clear';

        // Play sound
        this.sound.playClear();

        // Bonus for remaining lives
        const lifeBonus = this.lives * 500;
        this.score += lifeBonus;

        // Update clear stats
        document.getElementById('clear-score').textContent = this.score.toLocaleString();
        document.getElementById('clear-bonus').textContent = '+' + lifeBonus.toLocaleString();
        document.getElementById('clear-combo').textContent = this.maxCombo;

        setTimeout(() => {
            this.showScreen('clear-screen');
        }, 500);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
