// Multiple tab pattern variations for diverse puzzle piece shapes
// Each pattern uses 6 bezier curves normalized to 100-unit edge length
const TAB_PATTERNS = [
  // Pattern 1: Classic "shoulders and head" (original)
  [
    {cx1:0,  cy1:0,  cx2:35,cy2:15, ex:37, ey:5},
    {cx1:37, cy1:5,  cx2:40,cy2:0,  ex:38, ey:-5},
    {cx1:38, cy1:-5, cx2:20,cy2:-20,ex:50, ey:-20},
    {cx1:50, cy1:-20,cx2:80,cy2:-20,ex:62, ey:-5},
    {cx1:62, cy1:-5, cx2:60,cy2:0,  ex:63, ey:5},
    {cx1:63, cy1:5,  cx2:65,cy2:15, ex:100,ey:0}
  ],
  // Pattern 2: Wider base (broader shoulders)
  [
    {cx1:0,  cy1:0,  cx2:30,cy2:18, ex:35, ey:8},
    {cx1:35, cy1:8,  cx2:38,cy2:2,  ex:40, ey:-8},
    {cx1:40, cy1:-8, cx2:25,cy2:-22,ex:50, ey:-22},
    {cx1:50, cy1:-22,cx2:75,cy2:-22,ex:60, ey:-8},
    {cx1:60, cy1:-8, cx2:62,cy2:2,  ex:65, ey:8},
    {cx1:65, cy1:8,  cx2:70,cy2:18, ex:100,ey:0}
  ],
  // Pattern 3: Narrow neck (more pronounced head)
  [
    {cx1:0,  cy1:0,  cx2:38,cy2:12, ex:40, ey:3},
    {cx1:40, cy1:3,  cx2:42,cy2:-2, ex:42, ey:-7},
    {cx1:42, cy1:-7, cx2:15,cy2:-25,ex:50, ey:-25},
    {cx1:50, cy1:-25,cx2:85,cy2:-25,ex:58, ey:-7},
    {cx1:58, cy1:-7, cx2:58,cy2:-2, ex:60, ey:3},
    {cx1:60, cy1:3,  cx2:62,cy2:12, ex:100,ey:0}
  ],
  // Pattern 4: Rounded (smoother curves)
  [
    {cx1:0,  cy1:0,  cx2:32,cy2:16, ex:36, ey:6},
    {cx1:36, cy1:6,  cx2:38,cy2:0,  ex:40, ey:-6},
    {cx1:40, cy1:-6, cx2:30,cy2:-18,ex:50, ey:-18},
    {cx1:50, cy1:-18,cx2:70,cy2:-18,ex:60, ey:-6},
    {cx1:60, cy1:-6, cx2:62,cy2:0,  ex:64, ey:6},
    {cx1:64, cy1:6,  cx2:68,cy2:16, ex:100,ey:0}
  ]
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

    // Right tab
    if (this.col < gridSize - 1) {
      const rightPiece = pieces[this.row * gridSize + this.col + 1];
      const hasTab = Math.random() > 0.5;
      this.tabs.right = hasTab ? 1 : -1;
      rightPiece.tabs.left = hasTab ? -1 : 1;
    }

    // Bottom tab
    if (this.row < gridSize - 1) {
      const bottomPiece = pieces[(this.row + 1) * gridSize + this.col];
      const hasTab = Math.random() > 0.5;
      this.tabs.bottom = hasTab ? 1 : -1;
      bottomPiece.tabs.top = hasTab ? -1 : 1;
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
    const padding = tabSize * 1.2; // Extra padding to ensure tabs don't get clipped

    const canvas = document.createElement('canvas');
    canvas.width = this.pieceWidth + padding * 2;
    canvas.height = this.pieceHeight + padding * 2;
    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(padding, padding);

    // Clip to piece shape
    ctx.clip(this.path);

    // CORRECTED APPROACH FOR JIGSAW PIECE IMAGE RENDERING:
    //
    // The fundamental principle:
    // - The base rectangle (0, 0, pieceWidth, pieceHeight) ALWAYS maps to (sourceX, sourceY, sourceWidth, sourceHeight)
    // - Tabs extend BEYOND the base rectangle and need image from neighbor's area
    // - Blanks are cut INTO the base rectangle (clipping handles this)
    // - We must draw a larger image area to cover tabs, positioned so base rectangle aligns correctly

    // Calculate scale factors (image pixels per canvas pixel)
    const scaleX = this.image.width / this.puzzleWidth;
    const scaleY = this.image.height / this.puzzleHeight;

    // Calculate how much to expand the SOURCE image in each direction (in image pixels)
    // Only expand for TABS (value = 1) because they extend into neighbor's image area
    const expandLeftPx = (this.tabs.left === 1) ? tabSize * scaleX : 0;
    const expandRightPx = (this.tabs.right === 1) ? tabSize * scaleX : 0;
    const expandTopPx = (this.tabs.top === 1) ? tabSize * scaleY : 0;
    const expandBottomPx = (this.tabs.bottom === 1) ? tabSize * scaleY : 0;

    // Source rectangle with expansion (may go outside image bounds for edge pieces)
    let srcX = this.sourceX - expandLeftPx;
    let srcY = this.sourceY - expandTopPx;
    let srcW = this.sourceWidth + expandLeftPx + expandRightPx;
    let srcH = this.sourceHeight + expandTopPx + expandBottomPx;

    // Destination position in piece coordinates (where to draw the expanded source)
    // Start drawing from negative tab size to position tabs correctly
    let destX = -expandLeftPx / scaleX;
    let destY = -expandTopPx / scaleY;
    let destW = srcW / scaleX;
    let destH = srcH / scaleY;

    // Clamp source to image boundaries and adjust destination accordingly
    if (srcX < 0) {
      const clampAmount = -srcX;
      destX += clampAmount / scaleX;
      srcW -= clampAmount;
      destW -= clampAmount / scaleX;
      srcX = 0;
    }
    if (srcY < 0) {
      const clampAmount = -srcY;
      destY += clampAmount / scaleY;
      srcH -= clampAmount;
      destH -= clampAmount / scaleY;
      srcY = 0;
    }
    if (srcX + srcW > this.image.width) {
      const excess = srcX + srcW - this.image.width;
      srcW -= excess;
      destW -= excess / scaleX;
    }
    if (srcY + srcH > this.image.height) {
      const excess = srcY + srcH - this.image.height;
      srcH -= excess;
      destH -= excess / scaleY;
    }

    // Draw the image portion
    // The clipping path (applied above) will cut to the exact piece shape
    ctx.drawImage(
      this.image,
      srcX, srcY, srcW, srcH,
      destX, destY, destW, destH
    );

    ctx.restore();

    // Draw outline with slightly thicker line for realistic appearance
    ctx.translate(padding, padding);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
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

    // Highlight if placed correctly
    if (this.isPlaced) {
      ctx.translate(this.x, this.y);
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke(this.path);
    } else if (this.isDragging && this.isNearCorrectPosition()) {
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
  isNearCorrectPosition(threshold = 50) {
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
