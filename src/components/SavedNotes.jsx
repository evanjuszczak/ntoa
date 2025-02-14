import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Collapse,
  CircularProgress,
  Alert,
  Box,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { getSavedConversations, deleteSavedConversation } from '../services/noteService';

const SavedNotes = () => {
  const [notes, setNotes] = useState([]);
  const [expandedNote, setExpandedNote] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotes = async () => {
    try {
      console.log('Starting to load notes...');
      setLoading(true);
      setError(null);
      const fetchedNotes = await getSavedConversations();
      console.log('Notes loaded successfully:', {
        count: fetchedNotes?.length || 0,
        notes: fetchedNotes
      });
      setNotes(fetchedNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleDelete = async () => {
    if (!selectedNote) return;
    
    try {
      setLoading(true);
      await deleteSavedConversation(selectedNote.id);
      console.log('Note deleted successfully:', selectedNote.id);
      await loadNotes();
      setDeleteDialogOpen(false);
      setSelectedNote(null);
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(`Failed to delete note: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const downloadTranscript = (note) => {
    const formatMessage = (msg) => {
      const role = msg.sender === 'user' ? 'You' : 'Assistant';
      return `${role}: ${msg.text}\n`;
    };

    const content = `${note.title}\nSaved on ${formatDate(note.created_at)}\n\nTranscript:\n\n${
      note.conversation.map(formatMessage).join('\n')
    }`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Saved Notes {notes.length > 0 && `(${notes.length})`}
      </Typography>

      {notes.length === 0 ? (
        <Typography color="textSecondary">
          No saved notes yet. Save a conversation to see it here!
        </Typography>
      ) : (
        <List>
          {notes.map((note) => (
            <React.Fragment key={note.id}>
              <ListItem
                secondaryAction={
                  <Box>
                    <Tooltip title="Download transcript">
                      <IconButton
                        edge="end"
                        onClick={() => downloadTranscript(note)}
                        sx={{ mr: 1 }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete note">
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedNote(note);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="subtitle1" component="span">
                        {note.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                      >
                        {expandedNote === note.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                  }
                  secondary={`Saved on ${formatDate(note.created_at)}`}
                />
              </ListItem>
              <Collapse in={expandedNote === note.id} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {note.conversation.map((msg, index) => (
                    <ListItem key={index} sx={{ pl: 4 }}>
                      <ListItemText
                        primary={msg.sender === 'user' ? 'You' : 'Assistant'}
                        secondary={msg.text}
                        secondaryTypographyProps={{
                          style: { whiteSpace: 'pre-wrap' }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{selectedNote?.title}"?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SavedNotes; 