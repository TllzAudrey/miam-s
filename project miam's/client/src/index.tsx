import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // si tu veux ajouter du css global

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
