const findById = (id) => document.getElementById(id);

const temperatureEl = findById('temperature');
const humidityEl = findById('humidity');
const updatedEl = findById('updated');
const logsContent = findById('logs-content');
const logsToggle = findById('logs-toggle');
const logsOverlay = findById('logs-overlay');
const logsPanel = findById('logs-panel');
const logsClose = findById('logs-close');
const pumpForm = findById('pump-form');
const pumpTimeInput = findById('pump-time');

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const openLogs = () => {
  logsToggle.classList.add('open');
  logsOverlay.classList.add('open');
  logsPanel.classList.add('open');
};

const closeLogs = () => {
  logsToggle.classList.remove('open');
  logsOverlay.classList.remove('open');
  logsPanel.classList.remove('open');
};

const updateReading = (data) => {
  if (!isNaN(data.temperature)) {
    temperatureEl.textContent = `${data.temperature.toFixed(1)}°`;
  }
  if (!isNaN(data.humidity)) {
    humidityEl.textContent = `${data.humidity.toFixed(0)}%`;
  }
  if (data.updated) {
    updatedEl.textContent = `Aktualisiert: ${formatTime(data.updated)}`;
  }
};

const formatLogEntry = (logEntry) => {
  return `<div class="log-entry">[${formatTime(logEntry.createdAt)}] ${logEntry.message}</div>`;
};

const updateLogs = (data) => {
  if (Array.isArray(data)) {
    logsContent.innerHTML = data
      .slice()
      .map(formatLogEntry)
      .join('');
  } else {
    logsContent.innerHTML = formatLogEntry(data) + logsContent.innerHTML;
  }
};

const connectWebSocket = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}/info`);

  ws.onopen = () => {
    console.log('WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const d = JSON.parse(event.data);
      if (d.type === 'state') {
        updateReading(d.data);
        updateLogs(d.data.logMsgs);
      } else if (d.type === 'log') {
        updateLogs(d.data);
      } else if (d.type === 'reading') {
        updateReading(d.data);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  };

  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting in 3s...');
    setTimeout(connectWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    ws.close();
  };
};

const sendPump = async (time) => {
  try {
    const res = await fetch(`/pump?time=${time}`);
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || 'Fehler');
    }
  } catch (err) {
    alert('Verbindungsfehler: ' + err.message);
  }
};

logsToggle.addEventListener('click', openLogs);
logsOverlay.addEventListener('click', closeLogs);
logsClose.addEventListener('click', closeLogs);

pumpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const time = parseInt(pumpTimeInput.value, 10);
  if (time >= 2 && time <= 32) {
    pumpForm.querySelector('button').disabled = true;
    await sendPump(time);
    pumpForm.querySelector('button').disabled = false;
    pumpTimeInput.value = '';
  }
});

connectWebSocket();
