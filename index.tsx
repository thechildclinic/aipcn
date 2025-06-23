
import React from 'react';
import ReactDOM from 'react-dom/client';
import RoleBasedApp from './components/RoleBasedApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <RoleBasedApp />
  </React.StrictMode>
);
