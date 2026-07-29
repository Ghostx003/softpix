# SoftPix v2.0 - The Performance & Flow Update

We are thrilled to announce **SoftPix v2.0**, a massive architectural milestone that drastically improves the performance, memory management, and playback fluidity of the application.

## 🚀 Extreme Performance Overhaul
SoftPix has been rebuilt to handle massive local media directories natively in your browser without breaking a sweat.
- **Zero-Cost Shared Intersection Observer**: Replaced hundreds of individual DOM watchers with a single, highly performant bounding-box observer.
- **Virtual Media Nodes**: Videos completely unmount and destroy their DOM nodes when outside the viewport, swapping to ultra-lightweight placeholders to prevent GPU decoder exhaustion.
- **Aggressive RAM Release**: Media file Blobs are strictly lazy-loaded and explicitly revoked (`URL.revokeObjectURL`) when scrolled out of view, instantly freeing system memory.
- **Preload Hardening**: Forced `preload="none"` policies prevent browsers from secretly fetching heavy media metadata in the background.

## 📱 Enhanced Scroll Feed (TikTok-Style Viewer)
The Scroll Feed has received major logic and UI enhancements to provide a seamless continuous viewing experience.
- **Smart Category Auto-Advance (Smart Playlists)**: When you scroll past the last video in a folder, SoftPix now intelligently jumps directly to the start of the next selected category.
- **Empty Folder Skipping**: The engine automatically detects and bypasses empty directories during playback.
- **Global Playback State Integration**: The global Mute/Unmute state is now hardwired directly into the rendering pipeline. Scroll into videos with your preferred audio state instantly applied, backed by native error boundaries that respect your choices even under strict browser autoplay policies.
- **Streamlined Sidebar Layout**: Fixed Z-index clipping and overlapping transparency issues with a solid black sticky header, and permanently anchored the `Uncategorized` and empty folders to the absolute top and bottom of your lists respectively.

## 🛠 Stability
- Wrap-around `React.memo` implementations with custom shallow-equality functions ensure tracking popularity or managing tags doesn't trigger massive UI re-renders.
- Cleaned up the core components (`TransitionManager`, `ImageGrid`, `PortraitViewer`, `LandscapeViewer`) for strict separation of concerns.

> *Update Note: As this is a major architectural revision, please ensure you allow browser file system access again upon initial launch.*
