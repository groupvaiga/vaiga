function openApp() {
  chrome.tabs.create({ url: 'https://localhost:3000/home' })
  window.close()
}

function openRecorder() {
  chrome.tabs.create({ url: 'https://localhost:3000/home?tab=recorder' })
  window.close()
}

// Show current tab URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0]
  if (tab) {
    document.getElementById('status').textContent =
      '📍 ' + (tab.url?.slice(0, 40) || 'Unknown') + '...'
  }
})