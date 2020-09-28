import React from 'react';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

function BrowserApp(): React.ReactElement {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default BrowserApp;
