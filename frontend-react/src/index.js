import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';

// Create the root for rendering
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render App component wrapped with providers
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for production
if (process.env.NODE_ENV === 'production') {
  serviceWorkerRegistration.register({
    onUpdate: registration => {
      const waitingServiceWorker = registration.waiting;
      if (waitingServiceWorker) {
        waitingServiceWorker.addEventListener("statechange", event => {
          if (event.target.state === "activated") {
            window.location.reload();
          }
        });
        waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
      }
    }
  });
} else {
  serviceWorkerRegistration.unregister();
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
