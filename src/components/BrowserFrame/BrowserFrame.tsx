import React from 'react';
import { Box, AppBar, Toolbar, IconButton, TextField } from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Refresh,
  Home,
  Settings,
} from '@mui/icons-material';

interface BrowserFrameProps {
  children: React.ReactNode;
}

export function BrowserFrame({ children }: BrowserFrameProps) {
  return (
    <Box className="flex flex-col h-screen">
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar className="gap-2">
          <IconButton>
            <ArrowBack />
          </IconButton>
          <IconButton>
            <ArrowForward />
          </IconButton>
          <IconButton>
            <Refresh />
          </IconButton>
          <IconButton>
            <Home />
          </IconButton>
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="Enter URL or search"
            className="mx-2"
          />
          <IconButton>
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box className="flex-1 overflow-auto">
        {children}
      </Box>
    </Box>
  );
}