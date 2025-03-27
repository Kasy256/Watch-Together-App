// Video player selectors for different streaming services
const PLAYER_SELECTORS = {
  netflix: 'video.VideoPlayer',
  prime: '.webPlayerElement video',
  disney: '.btm-media-player video',
  hulu: '.video-player video',
  hbomax: '.video-player video'
};

class VideoController {
  constructor() {
    this.video = null;
    this.service = this.detectService();
    this.initializePlayer();
  }

  detectService() {
    const hostname = window.location.hostname;
    if (hostname.includes('netflix')) return 'netflix';
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
      } else {
        setTimeout(findVideo, 1000);
      }
    };

    findVideo();
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
    // This will be different for each service
    switch(this.service) {
      case 'netflix':
        return {
          title: document.querySelector('.video-title').textContent,
          type: document.querySelector('.video-type').textContent,
          duration: this.video.duration
        };
      case 'prime':
        return {
          title: document.querySelector('.atvwebplayersdk-title-text').textContent,
          type: document.querySelector('.atvwebplayersdk-subtitle-text').textContent,
          duration: this.video.duration
        };
      // Add other services...
      default:
        return null;
    }
  }
}

// Initialize the controller
const controller = new VideoController(); 