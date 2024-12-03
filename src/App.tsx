import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material';
import { BrowserFrame, WorkflowRecorder } from './components';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2b2a33',
    },
    secondary: {
      main: '#ff3b30',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserFrame>
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">AI-Enhanced Firefox Browser</h1>
          <p className="text-gray-600">
            Welcome to the next generation of browsing with integrated LLM capabilities
            and workflow automation.
          </p>
        </div>
      </BrowserFrame>
      <WorkflowRecorder />
    </ThemeProvider>
  );
}

export default App;