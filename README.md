<div align="center">
  <img src="public/favicon.svg" alt="SoftPix Logo" width="120" />
  <h1>SoftPix</h1>
  <p><strong>A blazing-fast, next-generation local media browser and viewer.</strong></p>
  <p>SoftPix redefines how you interact with your local media libraries. Built for extreme performance and stunning aesthetics, it handles massive directories of images and videos flawlessly directly in your browser.</p>
</div>

---

## ✨ Key Features

### 🚀 Extreme Performance Architecture
- **Zero-Cost Virtualization**: Utilizes a Shared Intersection Observer to lazy-load DOM elements. Your GPU won't break a sweat, even with 10,000+ files.
- **Aggressive Memory Management**: Blob URLs are dynamically generated and strictly revoked when items leave the viewport, keeping RAM usage to an absolute minimum.
- **Preload Hardening**: Prevents the browser from silently downloading and parsing hidden videos using strict `preload="none"` policies.

### 📱 Scroll Feed Mode
Experience your local media like never before with the TikTok/Shorts style continuous scroll viewer.
- **Smart Category Auto-Advance**: Seamlessly plays through categories. Select specific folders and SoftPix will auto-jump between them, skipping everything else.
- **Adaptive Layouts**: Employs completely independent rendering architectures for Portrait and Landscape media to ensure pixel-perfect aspect ratios and transitions.
- **Global Playback State**: Mute/Unmute state carries across the entire application flawlessly.

### 🏷️ Persistent Metadata
- **Tags & Categories**: Add unlimited custom tags, group media into custom categories, and filter instantly.
- **Ratings & Comments**: Rate media with a 5-star system and leave local comments.
- **Global Shuffle**: Smart Fisher-Yates shuffling allows you to randomize your entire library or just specific categories.

---

## 🛠️ Technology Stack
- **React 18**: Utilizing modern Hooks and strict memoization.
- **File System Access API**: Operates completely locally with zero server uploads required.
- **Vanilla CSS3**: Highly optimized, animation-rich custom UI without the bloat of external styling libraries.

---

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ghostx003/softpix.git
   ```
2. **Install Dependencies**
   ```bash
   npm install
   ```
3. **Run the Development Server**
   ```bash
   npm run dev
   ```
4. **Open in Browser**
   Click the "Select Local Folder" button to grant read-access to a folder of your choice.

---

## 🛡️ Privacy First
SoftPix operates entirely on your local machine using the native File System Access API. **Zero files are uploaded.** All metadata (tags, ratings, comments, and pinned items) are saved securely in your browser's LocalStorage.

---

<div align="center">
  <sub>Built with precision for the ultimate media viewing experience.</sub>
</div>
