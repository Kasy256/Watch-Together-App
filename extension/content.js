// Inject extension identifier
const injectIdentifier = () => {
  const identifier = document.createElement('div');
  identifier.id = 'watch-together-extension';
  identifier.style.display = 'none';
  document.body.appendChild(identifier);
};

// Video player selectors for different streaming services
const PLAYER_SELECTORS = {
  netflix: 'video.VideoPlayer',
  youtube: '#movie_player video',
  prime: '.webPlayerElement video',
  disney: '.btm-media-player video',
  hulu: '.video-player video',
  hbomax: '.video-player video'
};

// Inject identifier as soon as possible
if (document.body) {
  injectIdentifier();
} else {
  document.addEventListener('DOMContentLoaded', injectIdentifier);
}

class VideoController {
  constructor() {
    this.video = null;
    this.service = this.detectService();
    this.initializePlayer();
  }

  detectService() {
    const hostname = window.location.hostname;
    if (hostname.includes('netflix')) return 'netflix';
    if (hostname.includes('youtube')) return 'youtube';
    if (hostname.includes('primevideo')) return 'prime';
    if (hostname.includes('disneyplus')) return 'disney';
    if (hostname.includes('hulu')) return 'hulu';
    if (hostname.includes('hbomax')) return 'hbomax';
    return null;
  }

  initializePlayer() {
    if (!this.service) return;

    const findVideo = () => {
      const video = document.querySelector(PLAYER_SELECTORS[this.service]);
      if (video) {
        this.video = video;
        this.setupListeners();
        
        // Special handling for YouTube
        if (this.service === 'youtube') {
          this.setupYouTubeHandlers();
        }
      } else {
        setTimeout(findVideo, 1000);
      }
    };

    findVideo();
  }

  setupYouTubeHandlers() {
    // Handle YouTube's custom player
    const player = document.querySelector('#movie_player');
    if (player) {
      // Override YouTube's space bar handler
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && this.service === 'youtube') {
          e.stopPropagation();
          if (this.video.paused) {
            this.video.play();
          } else {
            this.video.pause();
          }
        }
      }, true);

      // Handle YouTube's custom controls
      const observer = new MutationObserver(() => {
        if (player.classList.contains('playing-mode')) {
          this.video.play();
        } else {
          this.video.pause();
        }
      });

      observer.observe(player, {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }

  setupListeners() {
    if (!this.video) return;

    ['play', 'pause', 'seeking', 'seeked'].forEach(event => {
      this.video.addEventListener(event, () => {
        this.broadcastState();
      });
    });

    // Listen for messages from the extension
    window.addEventListener('message', (event) => {
      if (event.data.type === 'WATCH_TOGETHER_STATE') {
        this.updateState(event.data.state);
      }
    });
  }

  broadcastState() {
    const state = {
      currentTime: this.video.currentTime,
      paused: this.video.paused,
      playbackRate: this.video.playbackRate,
      duration: this.video.duration,
      service: this.service,
      url: window.location.href
    };

    window.postMessage({
      type: 'WATCH_TOGETHER_BROADCAST',
      state
    }, '*');
  }

  updateState(state) {
    if (!this.video) return;

    if (Math.abs(this.video.currentTime - state.currentTime) > 0.5) {
      this.video.currentTime = state.currentTime;
    }

    if (state.paused && !this.video.paused) {
      this.video.pause();
    } else if (!state.paused && this.video.paused) {
      this.video.play();
    }

    this.video.playbackRate = state.playbackRate;
  }

  getMovieInfo() {
    switch(this.service) {
      case 'youtube':
        return {
          title: document.querySelector('.ytp-title-link')?.textContent || 'YouTube Video',
          type: 'video',
          duration: this.video.duration
        };
      case 'netflix':
        return {
          title: document.querySelector('.video-title')?.textContent,
          type: document.querySelector('.video-type')?.textContent,
          duration: this.video.duration
        };
      case 'prime':
        return {
          title: document.querySelector('.atvwebplayersdk-title-text')?.textContent,
          type: document.querySelector('.atvwebplayersdk-subtitle-text')?.textContent,
          duration: this.video.duration
        };
      default:
        return null;
    }
  }
}

// Initialize the controller
const controller = new VideoController(); 