// Handle installation check
chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.type === 'CHECK_INSTALLATION') {
      sendResponse({ installed: true });
    }
  }
);

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Check if this is a streaming service
    const streamingDomains = [
      'netflix.com',
      'youtube.com',
      'primevideo.com',
      'disneyplus.com',
      'hulu.com',
      'hbomax.com'
    ];

    const isStreamingService = streamingDomains.some(domain => 
      tab.url.includes(domain)
    );

    if (isStreamingService) {
      // Check if there's an active watch party
      const watchPartyRoom = localStorage.getItem('watchPartyRoom');
      
      if (watchPartyRoom) {
        const room = JSON.parse(watchPartyRoom);
        
        // Inject the content script
        chrome.tabs.sendMessage(tabId, {
          type: 'INIT_WATCH_PARTY',
          room
        });
      }
    }
  }
}); 