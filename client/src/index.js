import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './ui.css';
import './ui-extend.css';

const r = createRoot(document.getElementById('root'));
r.render(<App />);
