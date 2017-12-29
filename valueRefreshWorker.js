var autoRefreshInterval;

onmessage = function(e) {
  switch (e.data.command) {
    case 'start-auto-refresh':
      if (!autoRefreshInterval) {
        autoRefreshInterval = setInterval(function() {
          postMessage({ command: 'refresh' });
        }, 60 * 1000);
      }
      break;
    case 'stop-auto-refresh':
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
      break;
  }
};
