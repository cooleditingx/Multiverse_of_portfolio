import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// activate the async Google Fonts stylesheet (loaded with media="print" so it
// never blocks first paint; done here instead of an inline onload handler so
// the CSP can stay script-src 'self')
const fontsLink = document.querySelector('link[data-async-fonts]');
if (fontsLink) {
  const apply = () => { fontsLink.media = 'all'; };
  if (fontsLink.sheet) apply();
  else fontsLink.addEventListener('load', apply, { once: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
