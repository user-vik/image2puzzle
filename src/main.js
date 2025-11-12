import { PuzzleGame } from './puzzle.js';

class PuzzleApp {
  constructor() {
    this.game = null;
    this.currentImageFile = null;
    this.timerInterval = null;

    this.initElements();
    this.initEventListeners();
  }

  initElements() {
    // Buttons and controls
    this.uploadBtn = document.getElementById('uploadBtn');
    this.fileInput = document.getElementById('fileInput');
    this.difficultySelect = document.getElementById('difficultySelect');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.referenceBtn = document.getElementById('referenceBtn');
    this.panBtn = document.getElementById('panBtn');
    this.fullscreenBtn = document.getElementById('fullscreenBtn');

    // Canvas
    this.canvas = document.getElementById('puzzleCanvas');
    this.canvasContainer = document.getElementById('canvasContainer');
    this.startMessage = document.getElementById('startMessage');

    // Stats
    this.timerDisplay = document.getElementById('timerDisplay');
    this.progressDisplay = document.getElementById('progressDisplay');

    // Modals
    this.referenceModal = document.getElementById('referenceModal');
    this.referenceImage = document.getElementById('referenceImage');
    this.closeModal = document.getElementById('closeModal');
    this.victoryModal = document.getElementById('victoryModal');
    this.finalTime = document.getElementById('finalTime');
    this.playAgainBtn = document.getElementById('playAgainBtn');

    // Initialize game
    this.game = new PuzzleGame(this.canvas);
  }

  initEventListeners() {
    // Upload image
    this.uploadBtn.addEventListener('click', () => {
      this.fileInput.click();
    });

    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        this.loadImage(file);
      }
    });

    // Shuffle/New Game
    this.shuffleBtn.addEventListener('click', () => {
      if (this.currentImageFile) {
        this.startNewGame();
      }
    });

    // Difficulty change
    this.difficultySelect.addEventListener('change', () => {
      if (this.currentImageFile) {
        this.startNewGame();
      }
    });

    // Reference image
    this.referenceBtn.addEventListener('click', () => {
      this.showReferenceImage();
    });

    this.closeModal.addEventListener('click', () => {
      this.hideReferenceImage();
    });

    this.referenceModal.addEventListener('click', (e) => {
      if (e.target === this.referenceModal) {
        this.hideReferenceImage();
      }
    });

    // Pan mode
    this.panBtn.addEventListener('click', () => {
      this.togglePanMode();
    });

    // Fullscreen
    this.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // Canvas interactions
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.game.handleMouseDown(x, y);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.game.handleMouseMove(x, y);
    });

    this.canvas.addEventListener('mouseup', () => {
      this.game.handleMouseUp();
      this.updateProgress();
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.game.handleMouseUp();
    });

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.game.handleMouseDown(x, y);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.game.handleMouseMove(x, y);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.game.handleMouseUp();
      this.updateProgress();
    });

    // Zoom with mouse wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.game.handleWheel(e.deltaY);
    }, { passive: false });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePanMode();
      } else if (e.code === 'KeyF') {
        this.toggleFullscreen();
      } else if (e.code === 'KeyR' && this.game.image) {
        this.showReferenceImage();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
      }
    });

    // Play again
    this.playAgainBtn.addEventListener('click', () => {
      this.hideVictoryModal();
      this.startNewGame();
    });

    // Fullscreen change
    document.addEventListener('fullscreenchange', () => {
      this.updateFullscreenButton();
    });
  }

  async loadImage(file) {
    this.currentImageFile = file;
    const gridSize = parseInt(this.difficultySelect.value);

    try {
      await this.game.initPuzzle(file, gridSize);

      // Update reference image
      const reader = new FileReader();
      reader.onload = (e) => {
        this.referenceImage.src = e.target.result;
      };
      reader.readAsDataURL(file);

      // Hide start message
      this.startMessage.classList.add('hidden');

      // Enable buttons
      this.shuffleBtn.disabled = false;
      this.referenceBtn.disabled = false;

      // Start timer
      this.startTimer();
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Failed to load image. Please try again.');
    }
  }

  startNewGame() {
    if (!this.currentImageFile) return;

    this.stopTimer();
    this.hideVictoryModal();

    const gridSize = parseInt(this.difficultySelect.value);
    this.game.initPuzzle(this.currentImageFile, gridSize);
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      const elapsed = this.game.getElapsedTime();
      this.timerDisplay.textContent = this.game.formatTime(elapsed);
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateProgress() {
    const progress = this.game.getProgress();
    this.progressDisplay.textContent = `${progress}%`;

    if (this.game.isComplete) {
      this.showVictoryModal();
    }
  }

  showReferenceImage() {
    this.referenceModal.classList.add('active');
  }

  hideReferenceImage() {
    this.referenceModal.classList.remove('active');
  }

  showVictoryModal() {
    this.stopTimer();
    const elapsed = this.game.getElapsedTime();
    this.finalTime.textContent = this.game.formatTime(elapsed);
    this.victoryModal.classList.add('active');
  }

  hideVictoryModal() {
    this.victoryModal.classList.remove('active');
  }

  togglePanMode() {
    const isPanMode = this.game.togglePanMode();
    this.panBtn.classList.toggle('active', isPanMode);
    this.canvas.classList.toggle('pan-mode', isPanMode);
  }

  toggleFullscreen() {
    const app = document.getElementById('app');

    if (!document.fullscreenElement) {
      app.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }

  updateFullscreenButton() {
    const isFullscreen = !!document.fullscreenElement;
    this.fullscreenBtn.classList.toggle('active', isFullscreen);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PuzzleApp();
});
