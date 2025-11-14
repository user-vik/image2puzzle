// ALL IDENTICAL patterns - big, round tabs for consistency
// Each pattern uses 6 bezier curves normalized to 100-unit edge length
// Currently ALL 8 patterns are IDENTICAL to test standardization
const BASE_PATTERN = [
  {cx1:0,  cy1:0,  cx2:34,cy2:14, ex:38, ey:5},
  {cx1:38, cy1:5,  cx2:40,cy2:-1, ex:42, ey:-8},
  {cx1:42, cy1:-8, cx2:25,cy2:-24,ex:50, ey:-24},
  {cx1:50, cy1:-24,cx2:75,cy2:-24,ex:58, ey:-8},
  {cx1:58, cy1:-8, cx2:60,cy2:-1, ex:62, ey:5},
  {cx1:62, cy1:5,  cx2:66,cy2:14, ex:100,ey:0}
];

const TAB_PATTERNS = [
  BASE_PATTERN,
  BASE_PATTERN,
  BASE_PATTERN,
  BASE_PATTERN,
  BASE_PATTERN,
  BASE_PATTERN,
  BASE_PATTERN,
  BASE_PATTERN
];

// Puzzle Piece class with jigsaw shape generation
export class PuzzlePiece {
  constructor(row, col, gridSize, image, pieceWidth, pieceHeight, puzzleWidth, puzzleHeight, puzzleOffsetX, puzzleOffsetY) {
    this.row = row;
    this.col = col;
    this.gridSize = gridSize;
    this.image = image;
    this.pieceWidth = pieceWidth;
    this.pieceHeight = pieceHeight;
    this.puzzleWidth = puzzleWidth;
    this.puzzleHeight = puzzleHeight;

    // Correct position in the final puzzle (in canvas space)
    this.correctX = col * pieceWidth + puzzleOffsetX;
    this.correctY = row * pieceHeight + puzzleOffsetY;

    // Source coordinates in the original image
    this.sourceX = (col * pieceWidth / puzzleWidth) * image.width;
    this.sourceY = (row * pieceHeight / puzzleHeight) * image.height;
    this.sourceWidth = (pieceWidth / puzzleWidth) * image.width;
    this.sourceHeight = (pieceHeight / puzzleHeight) * image.height;

    // Current position (will be randomized)
    this.x = this.correctX;
    this.y = this.correctY;

    // For dragging
    this.isDragging = false;
    this.offsetX = 0;
    this.offsetY = 0;

    // For snapping
    this.isPlaced = false;
    this.zIndex = 0;

    // Tab/blank configuration for each side
    // null = edge, 1 = tab out, -1 = blank in
    this.tabs = {
      top: row === 0 ? null : null,
      right: col === gridSize - 1 ? null : null,
      bottom: row === gridSize - 1 ? null : null,
      left: col === 0 ? null : null
    };

    // Randomly select tab pattern for each side (adds diversity)
    this.tabPatterns = {
      top: Math.floor(Math.random() * TAB_PATTERNS.length),
      right: Math.floor(Math.random() * TAB_PATTERNS.length),
      bottom: Math.floor(Math.random() * TAB_PATTERNS.length),
      left: Math.floor(Math.random() * TAB_PATTERNS.length)
    };

    // Cache for the piece path
    this.path = null;
    this.offscreenCanvas = null;

  }

  // Generate tabs - must be called after all pieces are created
  generateTabs(pieces) {
    const gridSize = this.gridSize;

    // Right tab - CRITICAL: Both pieces must use the same pattern!
    if (this.col < gridSize - 1) {
      const rightPiece = pieces[this.row * gridSize + this.col + 1];
      const hasTab = Math.random() > 0.5;
      this.tabs.right = hasTab ? 1 : -1;
      rightPiece.tabs.left = hasTab ? -1 : 1;

      // Coordinate pattern: right neighbor's left pattern must match our right pattern
      rightPiece.tabPatterns.left = this.tabPatterns.right;
    }

    // Bottom tab - CRITICAL: Both pieces must use the same pattern!
    if (this.row < gridSize - 1) {
      const bottomPiece = pieces[(this.row + 1) * gridSize + this.col];
      const hasTab = Math.random() > 0.5;
      this.tabs.bottom = hasTab ? 1 : -1;
      bottomPiece.tabs.top = hasTab ? -1 : 1;

      // Coordinate pattern: bottom neighbor's top pattern must match our bottom pattern
      bottomPiece.tabPatterns.top = this.tabPatterns.bottom;
    }
  }

  // Create the jigsaw piece path
  createPath() {
    const path = new Path2D();
    const w = this.pieceWidth;
    const h = this.pieceHeight;
    const tabSize = Math.min(w, h) * 0.2; // Tab protrusion size

    path.moveTo(0, 0);

    // Top edge
    if (this.tabs.top === null) {
      path.lineTo(w, 0);
    } else {
      this.drawTabEdge(path, 0, 0, w, 0, this.tabs.top, tabSize, 'top');
    }

    // Right edge
    if (this.tabs.right === null) {
      path.lineTo(w, h);
    } else {
      this.drawTabEdge(path, w, 0, w, h, this.tabs.right, tabSize, 'right');
    }

    // Bottom edge
    if (this.tabs.bottom === null) {
      path.lineTo(0, h);
    } else {
      this.drawTabEdge(path, w, h, 0, h, this.tabs.bottom, tabSize, 'bottom');
    }

    // Left edge
    if (this.tabs.left === null) {
      path.lineTo(0, 0);
    } else {
      this.drawTabEdge(path, 0, h, 0, 0, this.tabs.left, tabSize, 'left');
    }

    path.closePath();
    this.path = path;

    // Create offscreen canvas for this piece
    this.createOffscreenCanvas();
  }

  // Draw a realistic "shoulders and head" tab or blank edge using multiple bezier curves
  drawTabEdge(path, x1, y1, x2, y2, direction, tabSize, side) {
    const isHorizontal = y1 === y2;
    const length = isHorizontal ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
    const sign = isHorizontal ? (x2 > x1 ? 1 : -1) : (y2 > y1 ? 1 : -1);

    // Get the randomly selected pattern for this side (adds diversity)
    const patternIndex = this.tabPatterns[side];
    const baseCurves = TAB_PATTERNS[patternIndex];

    // For blanks (direction = -1), mirror the Y coordinates to create inward indent
    const curves = direction === 1 ? baseCurves : baseCurves.map(b => ({
      cx1: b.cx1,
      cy1: -b.cy1,
      cx2: b.cx2,
      cy2: -b.cy2,
      ex: b.ex,
      ey: -b.ey
    }));

    // Scale factor: convert from 100-unit base to actual edge length
    const scale = length / 100;

    if (isHorizontal) {
      // Horizontal edge (top or bottom)
      // Current position is at (x1, y1), need to draw to (x2, y2)

      // Draw each bezier curve of the tab/blank shape
      curves.forEach(curve => {
        const cx1 = x1 + sign * curve.cx1 * scale;
        const cy1 = y1 - curve.cy1 * scale * direction; // direction already applied in mirror
        const cx2 = x1 + sign * curve.cx2 * scale;
        const cy2 = y1 - curve.cy2 * scale * direction;
        const ex = x1 + sign * curve.ex * scale;
        const ey = y1 - curve.ey * scale * direction;

        path.bezierCurveTo(cx1, cy1, cx2, cy2, ex, ey);
      });
    } else {
      // Vertical edge (left or right)
      // Rotate the tab 90 degrees: swap x/y and adjust signs

      curves.forEach(curve => {
        // For vertical edges, we rotate the coordinate system
        // x becomes y (along the edge), y becomes x (perpendicular to edge)
        const cx1 = x1 + curve.cy1 * scale * direction;
        const cy1 = y1 + sign * curve.cx1 * scale;
        const cx2 = x1 + curve.cy2 * scale * direction;
        const cy2 = y1 + sign * curve.cx2 * scale;
        const ex = x1 + curve.ey * scale * direction;
        const ey = y1 + sign * curve.ex * scale;

        path.bezierCurveTo(cx1, cy1, cx2, cy2, ex, ey);
      });
    }
  }

  // Create an offscreen canvas for efficient rendering
  createOffscreenCanvas() {
    // New realistic tabs protrude about 20% of edge length (based on control points)
    const tabSize = Math.min(this.pieceWidth, this.pieceHeight) * 0.2;
    // Increased padding to 2.0x to account for complex bezier curve shoulders/head extending beyond simple calculations
    const padding = tabSize * 2.0;

    const canvas = document.createElement('canvas');
    canvas.width = this.pieceWidth + padding * 2;
    canvas.height = this.pieceHeight + padding * 2;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(padding, padding);

    // Clip to piece shape
    ctx.clip(this.path);

    // TRANSLATE-CLIP-OFFSET PATTERN (Industry Standard)
    //
    // Instead of complex source rectangle calculations, we:
    // 1. Apply the clipping path (already done above)
    // 2. Draw the ENTIRE puzzle image
    // 3. Offset it so the correct portion shows through the clip
    //
    // This approach:
    // - Eliminates complex scale factor calculations
    // - Guarantees tabs always have image data (no clipping)
    // - Lets Canvas transformation matrix handle alignment
    // - Matches professional puzzle implementations
    //
    // The offset positions the full image so this piece's grid cell
    // aligns with position (0, 0) in the current coordinate space

    const offsetX = -(this.col * this.pieceWidth);
    const offsetY = -(this.row * this.pieceHeight);

    // Draw the entire puzzle image, offset to show the correct piece portion
    ctx.drawImage(
      this.image,
      offsetX, offsetY,
      this.puzzleWidth, this.puzzleHeight
    );

    ctx.restore();

    // Draw outline - thin black for realistic appearance
    ctx.translate(padding, padding);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'; // Semi-transparent black
    ctx.lineWidth = 1; // Thin line
    ctx.stroke(this.path);

    this.offscreenCanvas = canvas;
    this.canvasPadding = padding;
  }

  // Draw the piece on the main canvas with optional connection check info
  draw(ctx, canSnap = true) {
    if (!this.offscreenCanvas) return;

    ctx.save();

    // Draw shadow if dragging
    if (this.isDragging) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      // Show snap hint if near correct position
      if (this.isNearCorrectPosition() && canSnap) {
        ctx.shadowColor = 'rgba(34, 197, 94, 0.8)';
        ctx.shadowBlur = 30;
      }
    }

    // Draw the offscreen canvas
    ctx.drawImage(
      this.offscreenCanvas,
      this.x - this.canvasPadding,
      this.y - this.canvasPadding
    );

    // Show snap feedback only when dragging
    if (this.isDragging && this.isNearCorrectPosition()) {
      // Show green highlight when can snap, red when cannot
      ctx.translate(this.x, this.y);
      if (canSnap) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'; // Green - can snap
      } else {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'; // Red - cannot snap (no neighbor)
      }
      ctx.lineWidth = 4;
      ctx.stroke(this.path);
    }

    ctx.restore();
  }

  // Check if a point is inside this piece
  containsPoint(x, y, ctx) {
    if (!this.path) return false;

    // Use bounding box for collision detection (simpler and more reliable)
    const padding = this.canvasPadding || 0;
    const inBounds = x >= this.x - padding &&
                     x <= this.x + this.pieceWidth + padding &&
                     y >= this.y - padding &&
                     y <= this.y + this.pieceHeight + padding;

    return inBounds;
  }

  // Check if piece is close to its correct position
  isNearCorrectPosition(threshold = 25) {
    const dx = Math.abs(this.x - this.correctX);
    const dy = Math.abs(this.y - this.correctY);
    return dx < threshold && dy < threshold;
  }

  // Check if this piece has any neighbors that are already placed
  hasPlacedNeighbor(allPieces, gridSize) {
    const neighbors = this.getNeighbors(allPieces, gridSize);
    return neighbors.some(neighbor => neighbor && neighbor.isPlaced);
  }

  // Get neighboring pieces (top, right, bottom, left)
  getNeighbors(allPieces, gridSize) {
    const neighbors = [];

    // Top neighbor
    if (this.row > 0) {
      neighbors.push(allPieces[(this.row - 1) * gridSize + this.col]);
    }

    // Right neighbor
    if (this.col < gridSize - 1) {
      neighbors.push(allPieces[this.row * gridSize + (this.col + 1)]);
    }

    // Bottom neighbor
    if (this.row < gridSize - 1) {
      neighbors.push(allPieces[(this.row + 1) * gridSize + this.col]);
    }

    // Left neighbor
    if (this.col > 0) {
      neighbors.push(allPieces[this.row * gridSize + (this.col - 1)]);
    }

    return neighbors;
  }

  // Check if this is an edge piece (border of puzzle)
  isEdgePiece(gridSize) {
    return this.row === 0 || this.row === gridSize - 1 ||
           this.col === 0 || this.col === gridSize - 1;
  }

  // Snap to correct position
  snapToPosition() {
    this.x = this.correctX;
    this.y = this.correctY;
    this.isPlaced = true;
  }

  // Randomize position outside the puzzle area
  randomizePosition(canvasWidth, canvasHeight, puzzleX, puzzleY, puzzleWidth, puzzleHeight) {
    const margin = 50;
    const maxAttempts = 50;
    let attempts = 0;

    do {
      // Generate random position within canvas bounds
      this.x = Math.random() * (canvasWidth - this.pieceWidth - margin * 2) + margin;
      this.y = Math.random() * (canvasHeight - this.pieceHeight - margin * 2) + margin;
      attempts++;

      // Check if piece is outside the puzzle boundary (with some buffer)
      const buffer = 30;
      const isOutsidePuzzle =
        this.x + this.pieceWidth < puzzleX - buffer ||
        this.x > puzzleX + puzzleWidth + buffer ||
        this.y + this.pieceHeight < puzzleY - buffer ||
        this.y > puzzleY + puzzleHeight + buffer;

      if (isOutsidePuzzle || attempts >= maxAttempts) {
        break;
      }
    } while (true);
  }
}
