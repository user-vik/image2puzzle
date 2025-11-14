import { PuzzlePiece } from './pieces.js';

export class PuzzleGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pieces = [];
    this.image = null;
    this.gridSize = 4;
    this.isDragging = false;
    this.draggedPiece = null;
    this.isComplete = false;

    // Pan and zoom
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.panMode = false;

    // Timer
    this.startTime = null;
    this.timerInterval = null;
    this.elapsedTime = 0;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.render();
  }

  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.image = img;
          resolve(img);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async initPuzzle(imageFile, gridSize) {
    this.gridSize = gridSize;
    this.isComplete = false;
    this.pieces = [];

    await this.loadImage(imageFile);

    // Calculate piece dimensions
    const maxSize = Math.min(this.canvas.width * 0.8, this.canvas.height * 0.8);
    const aspectRatio = this.image.width / this.image.height;

    let puzzleWidth, puzzleHeight;
    if (aspectRatio > 1) {
      puzzleWidth = maxSize;
      puzzleHeight = maxSize / aspectRatio;
    } else {
      puzzleHeight = maxSize;
      puzzleWidth = maxSize * aspectRatio;
    }

    const pieceWidth = puzzleWidth / gridSize;
    const pieceHeight = puzzleHeight / gridSize;

    // Center the puzzle in the canvas
    const puzzleOffsetX = (this.canvas.width - puzzleWidth) / 2;
    const puzzleOffsetY = (this.canvas.height - puzzleHeight) / 2;

    // Store puzzle info for pieces to use
    this.puzzleWidth = puzzleWidth;
    this.puzzleHeight = puzzleHeight;
    this.puzzleOffsetX = puzzleOffsetX;
    this.puzzleOffsetY = puzzleOffsetY;

    // Create pieces
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const piece = new PuzzlePiece(
          row, col, gridSize, this.image,
          pieceWidth, pieceHeight,
          puzzleWidth, puzzleHeight,
          puzzleOffsetX, puzzleOffsetY
        );
        this.pieces.push(piece);
      }
    }

    // Generate tabs using centralized edge-based approach for better variety
    this.generateAllTabs(gridSize);

    // Create paths and offscreen canvases
    this.pieces.forEach(piece => piece.createPath());

    this.shuffle();
    this.startTimer();
    this.render();
  }

  // Generate tabs for all pieces using run-based approach for natural variety
  // Based on real puzzle analysis: uses runs/clusters instead of pure 50/50 random
  generateAllTabs(gridSize) {
    const TAB_PATTERN_COUNT = 8; // Number of patterns available

    // Generate all HORIZONTAL edges (between columns) with RUN-BASED clustering
    for (let row = 0; row < gridSize; row++) {
      // Create a shuffled array of tab/blank values for this row
      // This creates natural runs and variety within the row
      const edgeCount = gridSize - 1;
      const tabValues = [];

      // Generate runs: alternate between tabs and blanks with varying lengths
      let currentValue = Math.random() > 0.5 ? 1 : -1;
      let runLength = 0;
      for (let i = 0; i < edgeCount; i++) {
        if (runLength === 0) {
          // Start new run (1-3 edges with same value)
          runLength = Math.floor(Math.random() * 3) + 1;
          currentValue = Math.random() > 0.5 ? 1 : -1;
        }
        tabValues.push(currentValue);
        runLength--;
      }

      // Apply the values to edges
      for (let col = 0; col < gridSize - 1; col++) {
        const leftPiece = this.pieces[row * gridSize + col];
        const rightPiece = this.pieces[row * gridSize + (col + 1)];

        const leftHasTab = tabValues[col] === 1;
        leftPiece.tabs.right = leftHasTab ? 1 : -1;
        rightPiece.tabs.left = leftHasTab ? -1 : 1;

        // Coordinate pattern: both sides must use the same pattern
        const sharedPattern = Math.floor(Math.random() * TAB_PATTERN_COUNT);
        leftPiece.tabPatterns.right = sharedPattern;
        rightPiece.tabPatterns.left = sharedPattern;
      }

      // Debug logging for row variety
      console.log(`Row ${row} horizontal edges: ${tabValues.join(', ')}`);
    }

    // Generate all VERTICAL edges (between rows) with RUN-BASED clustering
    for (let col = 0; col < gridSize; col++) {
      // Create a shuffled array of tab/blank values for this column
      const edgeCount = gridSize - 1;
      const tabValues = [];

      // Generate runs: alternate between tabs and blanks with varying lengths
      let currentValue = Math.random() > 0.5 ? 1 : -1;
      let runLength = 0;
      for (let i = 0; i < edgeCount; i++) {
        if (runLength === 0) {
          // Start new run (1-3 edges with same value)
          runLength = Math.floor(Math.random() * 3) + 1;
          currentValue = Math.random() > 0.5 ? 1 : -1;
        }
        tabValues.push(currentValue);
        runLength--;
      }

      // Apply the values to edges
      for (let row = 0; row < gridSize - 1; row++) {
        const topPiece = this.pieces[row * gridSize + col];
        const bottomPiece = this.pieces[(row + 1) * gridSize + col];

        const topHasTab = tabValues[row] === 1;
        topPiece.tabs.bottom = topHasTab ? 1 : -1;
        bottomPiece.tabs.top = topHasTab ? -1 : 1;

        // Coordinate pattern: both sides must use the same pattern
        const sharedPattern = Math.floor(Math.random() * TAB_PATTERN_COUNT);
        topPiece.tabPatterns.bottom = sharedPattern;
        bottomPiece.tabPatterns.top = sharedPattern;
      }
    }
  }

  shuffle() {
    // Randomize piece positions outside the puzzle area
    this.pieces.forEach(piece => {
      piece.randomizePosition(
        this.canvas.width,
        this.canvas.height,
        this.puzzleOffsetX,
        this.puzzleOffsetY,
        this.puzzleWidth,
        this.puzzleHeight
      );
      piece.isPlaced = false;
    });

    // Shuffle z-order
    this.pieces.sort(() => Math.random() - 0.5);
    this.pieces.forEach((piece, index) => {
      piece.zIndex = index;
    });
  }

  startTimer() {
    this.startTime = Date.now();
    this.elapsedTime = 0;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getElapsedTime() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  handleMouseDown(x, y) {
    // Adjust for pan offset
    const worldX = (x - this.offsetX) / this.scale;
    const worldY = (y - this.offsetY) / this.scale;

    if (this.panMode) {
      this.isPanning = true;
      this.panStartX = x;
      this.panStartY = y;
      return;
    }

    // Find the topmost piece at this position
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const piece = this.pieces[i];
      if (piece.containsPoint(worldX, worldY, this.ctx)) {
        // If piece is already placed, remove it from placed state
        if (piece.isPlaced) {
          piece.isPlaced = false;
        }

        this.isDragging = true;
        this.draggedPiece = piece;
        piece.isDragging = true;
        piece.offsetX = worldX - piece.x;
        piece.offsetY = worldY - piece.y;

        // Bring to front
        this.pieces.splice(i, 1);
        this.pieces.push(piece);
        this.pieces.forEach((p, index) => {
          p.zIndex = index;
        });

        break;
      }
    }

    this.render();
  }

  handleMouseMove(x, y) {
    // Adjust for pan offset
    const worldX = (x - this.offsetX) / this.scale;
    const worldY = (y - this.offsetY) / this.scale;

    if (this.isPanning) {
      const dx = x - this.panStartX;
      const dy = y - this.panStartY;

      // Apply pan with boundaries
      const newOffsetX = this.offsetX + dx;
      const newOffsetY = this.offsetY + dy;

      // Calculate boundaries (allow panning to see all pieces with some margin)
      const margin = 200;
      const maxOffsetX = margin;
      const minOffsetX = -(this.canvas.width * (this.scale - 1)) - margin;
      const maxOffsetY = margin;
      const minOffsetY = -(this.canvas.height * (this.scale - 1)) - margin;

      // Clamp the offset values
      this.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, newOffsetX));
      this.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, newOffsetY));

      this.panStartX = x;
      this.panStartY = y;
      this.render();
      return;
    }

    if (this.isDragging && this.draggedPiece) {
      this.draggedPiece.x = worldX - this.draggedPiece.offsetX;
      this.draggedPiece.y = worldY - this.draggedPiece.offsetY;
      this.render();
    }
  }

  handleMouseUp() {
    if (this.isPanning) {
      this.isPanning = false;
      return;
    }

    if (this.isDragging && this.draggedPiece) {
      this.draggedPiece.isDragging = false;

      // Check if piece should snap
      // Only allow snapping if:
      // 1. Piece is near its correct position AND
      // 2. Piece is not already placed AND
      // 3. One of these conditions is met:
      //    a) No pieces are placed yet (first piece)
      //    b) It's an edge piece OR
      //    c) It has a placed neighbor
      const isNearPosition = this.draggedPiece.isNearCorrectPosition();
      const placedCount = this.pieces.filter(p => p.isPlaced).length;
      const isFirstPiece = placedCount === 0;
      const canSnap = isFirstPiece ||
                      this.draggedPiece.isEdgePiece(this.gridSize) ||
                      this.draggedPiece.hasPlacedNeighbor(this.pieces, this.gridSize);

      if (isNearPosition && !this.draggedPiece.isPlaced && canSnap) {
        this.draggedPiece.snapToPosition();
        const isComplete = this.checkCompletion();
        if (isComplete) {
          console.log('Puzzle completed!');
        }
      }

      this.draggedPiece = null;
      this.isDragging = false;
      this.render();
    }
  }

  handleWheel(deltaY) {
    const zoomSpeed = 0.1;
    const oldScale = this.scale;

    if (deltaY < 0) {
      this.scale = Math.min(this.scale + zoomSpeed, 3);
    } else {
      this.scale = Math.max(this.scale - zoomSpeed, 0.5);
    }

    // Adjust offset to zoom towards center
    if (this.scale !== oldScale) {
      const centerX = this.canvas.width / 2;
      const centerY = this.canvas.height / 2;
      this.offsetX = centerX - (centerX - this.offsetX) * (this.scale / oldScale);
      this.offsetY = centerY - (centerY - this.offsetY) * (this.scale / oldScale);
      this.render();
    }
  }

  togglePanMode() {
    this.panMode = !this.panMode;
    return this.panMode;
  }

  checkCompletion() {
    const allPlaced = this.pieces.every(piece => piece.isPlaced);
    if (allPlaced && !this.isComplete) {
      this.isComplete = true;
      this.stopTimer();
      return true;
    }
    return false;
  }

  getProgress() {
    const placedCount = this.pieces.filter(piece => piece.isPlaced).length;
    return Math.round((placedCount / this.pieces.length) * 100);
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();

    // Apply transformations
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);

    // Draw puzzle boundary guide (dotted rectangle)
    if (this.pieces.length > 0 && this.puzzleWidth && this.puzzleHeight) {
      const x = this.puzzleOffsetX;
      const y = this.puzzleOffsetY;
      const w = this.puzzleWidth;
      const h = this.puzzleHeight;

      // Draw dotted outline
      this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([10, 5]);
      this.ctx.strokeRect(x, y, w, h);
      this.ctx.setLineDash([]);

      // Draw corner markers for better visibility
      const cornerSize = 20;
      this.ctx.strokeStyle = 'rgba(148, 163, 184, 0.8)';
      this.ctx.lineWidth = 3;

      // Top-left corner
      this.ctx.beginPath();
      this.ctx.moveTo(x, y + cornerSize);
      this.ctx.lineTo(x, y);
      this.ctx.lineTo(x + cornerSize, y);
      this.ctx.stroke();

      // Top-right corner
      this.ctx.beginPath();
      this.ctx.moveTo(x + w - cornerSize, y);
      this.ctx.lineTo(x + w, y);
      this.ctx.lineTo(x + w, y + cornerSize);
      this.ctx.stroke();

      // Bottom-right corner
      this.ctx.beginPath();
      this.ctx.moveTo(x + w, y + h - cornerSize);
      this.ctx.lineTo(x + w, y + h);
      this.ctx.lineTo(x + w - cornerSize, y + h);
      this.ctx.stroke();

      // Bottom-left corner
      this.ctx.beginPath();
      this.ctx.moveTo(x + cornerSize, y + h);
      this.ctx.lineTo(x, y + h);
      this.ctx.lineTo(x, y + h - cornerSize);
      this.ctx.stroke();
    }

    // Draw all pieces in z-order
    const placedCount = this.pieces.filter(p => p.isPlaced).length;
    const isFirstPiece = placedCount === 0;

    this.pieces.forEach(piece => {
      // Check if this piece can snap (for visual feedback)
      const canSnap = isFirstPiece ||
                      piece.isEdgePiece(this.gridSize) ||
                      piece.hasPlacedNeighbor(this.pieces, this.gridSize);
      piece.draw(this.ctx, canSnap);
    });

    this.ctx.restore();
  }

  reset() {
    this.stopTimer();
    this.pieces = [];
    this.image = null;
    this.isComplete = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.scale = 1;
    this.panMode = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
