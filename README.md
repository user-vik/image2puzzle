# image2puzzle

A beautiful, interactive puzzle game built with vanilla JavaScript and HTML5 Canvas. Upload any image and turn it into a challenging puzzle with realistic interlocking pieces!

## Features

- **Image Upload**: Turn any image into a puzzle
- **Multiple Difficulty Levels**: Choose from Easy (3×3) to Expert (6×6)
- **Realistic Jigsaw Pieces**: Algorithmically generated interlocking tabs and blanks
- **Drag & Drop**: Smooth piece movement with visual feedback
- **Auto-Snap**: Pieces automatically snap when placed near correct position
- **Timer**: Track your solving time
- **Progress Tracker**: See your completion percentage in real-time
- **Reference Image Viewer**: View the original image for help
- **Pan & Zoom**: Navigate large puzzles easily
- **Fullscreen Mode**: Immersive puzzle-solving experience
- **Touch Support**: Works on tablets and touch devices
- **Keyboard Shortcuts**:
  - `Space`: Toggle pan mode
  - `F`: Toggle fullscreen
  - `R`: View reference image

## Live Demo

[Deploy to Netlify](#deployment) and get your own live demo!

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd image2puzzle
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser to the URL shown (typically `http://localhost:5173`)

## Building for Production

Build the optimized production version:

```bash
npm run build
```

The built files will be in the `dist` directory.

Preview the production build locally:

```bash
npm run preview
```

## Deployment

### Deploy to Netlify (Free)

#### Option 1: Drag & Drop (Easiest)

1. Build the project:
   ```bash
   npm run build
   ```

2. Go to [Netlify Drop](https://app.netlify.com/drop)
3. Drag the `dist` folder into the browser
4. Your site is live!

#### Option 2: Git Integration (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket

2. Go to [Netlify](https://app.netlify.com/)

3. Click "Add new site" → "Import an existing project"

4. Connect your Git provider and select the repository

5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

6. Click "Deploy site"

#### Option 3: Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy:
   ```bash
   netlify deploy --prod --dir=dist
   ```

## How to Play

1. **Upload an Image**: Click "Upload Image" and select any image from your device
2. **Choose Difficulty**: Select your preferred difficulty level (3×3 to 6×6 pieces)
3. **Solve the Puzzle**:
   - Drag pieces with your mouse or finger
   - Pieces will snap into place when positioned correctly
   - Green outline indicates correctly placed pieces
4. **Use Tools**:
   - Click "View Reference" to see the original image
   - Use the pan button or hold Space to move around the canvas
   - Scroll to zoom in/out
   - Click fullscreen for an immersive experience
5. **Complete**: Solve the puzzle as fast as you can!

## Technical Details

### Architecture

- **Vanilla JavaScript**: No frameworks, lightweight and fast
- **HTML5 Canvas**: Hardware-accelerated rendering
- **Vite**: Modern build tool for optimal performance
- **Modular Design**: Clean separation of concerns

### File Structure

```
image2puzzle/
├── index.html          # Main HTML structure
├── style.css           # Styling
├── src/
│   ├── main.js         # App initialization & UI logic
│   ├── puzzle.js       # Game logic & state management
│   └── pieces.js       # Puzzle piece generation & rendering
├── netlify.toml        # Netlify configuration
└── package.json        # Dependencies
```

### Performance Optimizations

- **Offscreen Canvas**: Each piece is pre-rendered for faster drawing
- **Efficient Rendering**: Only redraws when necessary
- **Path2D Caching**: Piece shapes are cached for collision detection
- **Minimal Dependencies**: Fast load times

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with Canvas support

## License

MIT License - feel free to use this project however you'd like!

## Credits

Built with vanilla JavaScript, HTML5 Canvas, and Vite.

Enjoy solving puzzles!
