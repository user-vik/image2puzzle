# image2puzzle - Project Context for Claude

## Project Overview
An interactive puzzle game built with vanilla JavaScript, HTML5 Canvas, and Vite. Users can upload any image and solve it as a puzzle with realistic interlocking jigsaw pieces featuring authentic "shoulders and head" bezier curve designs with multiple pattern variations.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Canvas**: HTML5 Canvas API for rendering
- **Build Tool**: Vite 7.1.7
- **Deployment**: Netlify (configured)
- **Package Manager**: npm
- **License**: MIT

## Project Structure
```
image2puzzle/
├── index.html              # Main HTML structure with UI components
├── style.css               # Global styles and UI styling
├── src/
│   ├── main.js            # Application initialization & UI event handlers
│   ├── puzzle.js          # Core game logic, state management, rendering
│   └── pieces.js          # Puzzle piece generation, jigsaw shapes, collision detection
├── public/                # Static assets
├── dist/                  # Production build output
├── netlify.toml           # Netlify deployment configuration
├── package.json           # Dependencies and scripts
└── README.md              # User-facing documentation
```

## Core Architecture

### main.js (PuzzleApp)
- **Purpose**: UI controller and application orchestrator
- **Responsibilities**:
  - DOM element initialization and event binding
  - File upload handling (image selection)
  - UI controls (difficulty, shuffle, reference, pan, fullscreen)
  - Timer management (start, stop, display)
  - Progress tracking and victory detection
  - Modal management (reference image, victory screen)
  - Keyboard shortcuts (Space: pan, F: fullscreen, R: reference)
  - Touch event handling for mobile/tablet support
  - Canvas interaction delegation to PuzzleGame

### puzzle.js (PuzzleGame)
- **Purpose**: Core game engine and state management
- **Responsibilities**:
  - Canvas management and resizing
  - Image loading from file
  - Puzzle initialization with configurable grid size
  - Piece creation and management
  - Shuffle algorithm (randomize positions outside puzzle area)
  - Drag & drop mechanics (mouse/touch events)
  - Pan & zoom functionality (navigation for large puzzles)
  - Snap detection and validation logic
  - Neighbor-based connection rules (first piece OR edge piece OR has placed neighbor)
  - Completion detection
  - Rendering pipeline with proper z-ordering
  - Visual feedback (puzzle boundary guide with dotted rectangle and corner markers)

### pieces.js (PuzzlePiece)
- **Purpose**: Individual puzzle piece representation and rendering
- **Responsibilities**:
  - Jigsaw piece shape generation with realistic "shoulders and head" bezier curves (6 curves per edge)
  - Four distinct tab/blank pattern variations for natural diversity
  - Tab/blank configuration (interlocking design)
  - Offscreen canvas pre-rendering for performance with separate X/Y scale factors
  - Path2D caching for collision detection
  - Position management (current vs correct position)
  - Snap logic (threshold-based positioning)
  - Neighbor detection (top, right, bottom, left)
  - Edge piece identification
  - Visual states (dragging, placed, near-position highlighting)
  - Image clipping to piece shape with proper aspect ratio handling
  - Shadow effects and outline rendering
  - Gap-free image rendering through expanded tab regions

## Key Features

### Gameplay
1. **Image Upload**: FileReader API for local image loading
2. **Difficulty Levels**: 
   - Easy (3×3 = 9 pieces)
   - Medium (4×4 = 16 pieces)
   - Hard (5×5 = 25 pieces)
   - Expert (6×6 = 36 pieces)
3. **Realistic Pieces**: Algorithmically generated tabs and blanks using bezier curves
4. **Smart Snapping**:
   - 25px threshold for snap detection (reduced from 50px for tighter feel)
   - Must be first piece OR edge piece OR have a placed neighbor
   - Visual feedback (green = can snap, red = cannot snap without neighbor)
5. **Timer**: Real-time tracking with MM:SS format
6. **Progress**: Percentage-based completion indicator

### Controls
- **Mouse Drag**: Click and drag pieces
- **Touch**: Full touch support for tablets/mobile
- **Pan Mode**: Hold Space or click pan button to navigate
- **Zoom**: Mouse wheel to zoom in/out (0.5x to 3x scale)
- **Reference**: View original image in modal
- **Fullscreen**: Immersive puzzle-solving mode

### Visual Design
- **Dotted Puzzle Boundary**: Guide for correct placement area
- **Corner Markers**: Enhanced visibility of puzzle boundaries
- **Drag Shadow**: Visual depth during piece movement
- **Snap Preview**: Green/red highlight when dragging near correct position based on connection rules

## Technical Details

### Performance Optimizations
1. **Offscreen Canvas**: Each piece pre-rendered to separate canvas
2. **Path2D Caching**: Shape paths cached for reuse
3. **Efficient Rendering**: Only redraws on user interaction
4. **Z-Index Management**: Proper layering without full re-sorts
5. **Minimal Dependencies**: Fast load times, no frameworks

### Puzzle Piece Algorithm
- Pieces are generated with random tab/blank configuration
- Tab direction is coordinated between neighboring pieces (one tab = opposite blank)
- Edge pieces have null tabs (straight edges)
- Tab size is 20% of piece dimensions
- **Realistic "Shoulders and Head" Design**:
  - Each tab/blank edge uses 6 bezier curves (not simple arcs)
  - Creates authentic jigsaw piece shape with shoulders, neck, and head structure
  - Control points carefully designed for professional puzzle appearance
- **Four Pattern Variations**:
  - Pattern 1: Classic shoulders and head (balanced proportions)
  - Pattern 2: Wider base with broader shoulders
  - Pattern 3: Narrow neck with more pronounced head
  - Pattern 4: Rounded with smoother curves
  - Each piece side randomly selects one of 4 patterns for natural diversity
- **Special Pieces (In Development)**:
  - Logic implemented to guarantee one interior piece with all 4 inward blanks (quadruple blank)
  - Logic implemented to guarantee one piece with north and south outward tabs
  - Console logging confirms generation, but visual verification pending
  - **Status**: Code present but special pieces not clearly visible in gameplay
- **Image Rendering**:
  - Tab regions attempt to expand into neighboring piece image areas
  - Separate X/Y scale factors preserve aspect ratios
  - **Status**: Image clipping still occurring, expansion calculation needs refinement

### Snap Logic Rules
A piece can snap to its correct position when:
1. It's within 25px of correct position AND
2. One of these conditions:
   - It's the first piece being placed (placedCount === 0)
   - It's an edge piece (row/col === 0 or gridSize-1)
   - It has at least one neighbor already placed

This prevents "floating" pieces in the middle of the puzzle.

## Build & Deployment

### Development
```bash
npm install       # Install dependencies
npm run dev       # Start dev server (http://localhost:5173)
```

### Production
```bash
npm run build     # Build to dist/
npm run preview   # Preview production build
```

### Netlify Deployment
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Redirects**: SPA redirect configured in netlify.toml

## Browser Compatibility
- Chrome/Edge (recommended) - full support
- Firefox - full support
- Safari - full support
- Requires Canvas API support

## Current State
- Fully functional puzzle game with professional-quality piece shapes
- All difficulty levels working (3×3 to 6×6)
- Realistic jigsaw pieces with "shoulders and head" bezier curve design
- Four pattern variations creating natural puzzle piece diversity
- Snap logic with neighbor validation implemented (25px threshold)
- Pan/zoom navigation working smoothly
- Timer and progress tracking active
- Victory detection and modal display
- Touch support enabled for tablets/mobile
- Keyboard shortcuts functional (Space, F, R)
- Clean white text styling throughout UI

### In Progress / Needs Attention
- Image clipping on puzzle pieces (visual quality issue)
- Special piece generation verification (4 inward blanks, 2 outward N/S tabs)
- Hover outline feedback (should not reveal piece locations)

## Known Behavior
- First piece can be placed anywhere (no neighbor requirement)
- Edge pieces can always be placed (they form the frame)
- Interior pieces require at least one placed neighbor
- This creates a natural progression: build edges first, then fill interior

## Known Issues (Pending Resolution)

### High Priority

1. **Tab Size Inconsistency**
   - **Issue**: Tabs are not the same size on all 4 sides of pieces
   - **Impact**: Visual inconsistency, pieces don't have uniform appearance
   - **Location**: `pieces.js:1-22` (TAB_PATTERNS constant)
   - **Status**: All 8 patterns currently use identical BASE_PATTERN, but rendering shows variation
   - **Notes**: May be related to pattern selection/caching or rendering pipeline issue

2. **Tab Shape Not Round Enough**
   - **Issue**: Tabs appear oblong rather than rounded
   - **Impact**: Pieces don't match desired aesthetic (should be rounder, more traditional jigsaw shape)
   - **Location**: `pieces.js:4-11` (BASE_PATTERN bezier curve definitions)
   - **Status**: Current pattern uses -24 depth with specific control points
   - **Notes**: Need to adjust bezier control points for rounder appearance

3. **Limited Piece Variety Per Row**
   - **Issue**: 4 out of 6 pieces in each row appear identical in configuration
   - **Impact**: Puzzle lacks visual variety, pieces look repetitive
   - **Location**: `puzzle.js:115-188` (generateAllTabs method with run-based algorithm)
   - **Status**: Run-based algorithm implemented but not creating sufficient variety
   - **Notes**: Console logging shows tab/blank patterns, but visual result shows repetition
   - **Root Cause**: Pieces in same row share top/bottom edge values from neighboring rows, creating similar configurations

### Recently Completed
- ✅ **Image clipping FIXED**: Implemented Translate-Clip-Offset pattern with 2.0x padding
- ✅ **Pieces fit together perfectly**: Fixed pattern coordination bug where neighbors used different patterns
- ✅ **Removed special piece forcing**: Eliminated broken logic that created piece mismatches
- ✅ **Snapping distance**: Reduced from 50px to 25px for tighter feel
- ✅ **Thin black outlines**: Changed from thick debug outlines to subtle 1px lines
- ✅ **Edge-based tab generation**: Refactored from cascading to independent edge generation

## Development Notes
- No external dependencies beyond Vite for bundling
- Pure ES6 modules, no transpilation needed for modern browsers
- Canvas rendering is hardware-accelerated
- Image dimensions automatically scaled to fit canvas (80% of viewport)
- Aspect ratio preserved during puzzle creation
