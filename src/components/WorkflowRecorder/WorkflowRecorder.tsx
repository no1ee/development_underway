import React from 'react';
import { Box, Fab, Tooltip } from '@mui/material';
import { FiberManualRecord, Stop } from '@mui/icons-material';
import { useWorkflowStore } from '../../store/workflowStore';

export function WorkflowRecorder() {
  const { isRecording, setRecording } = useWorkflowStore();

  const toggleRecording = () => {
    setRecording(!isRecording);
  };

  return (
    <Box className="fixed bottom-4 right-4">
      <Tooltip title={isRecording ? 'Stop Recording' : 'Start Recording'}>
        <Fab
          color={isRecording ? 'secondary' : 'primary'}
          onClick={toggleRecording}
        >
          {isRecording ? <Stop /> : <FiberManualRecord />}
        </Fab>
      </Tooltip>
    </Box>
  );
}