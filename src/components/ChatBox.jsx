import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Divider,
  Collapse,
  Button,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  DialogContentText,
} from '@mui/material';
import { 
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { askQuestion } from '../services/aiService';
import { saveConversation } from '../services/noteService';
import { useThemeContext } from '../contexts/ThemeContext';

const ChatBox = ({ isProcessing, onSave }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [internetSearch, setInternetSearch] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const theme = useTheme();
  const { togglePinkTheme } = useThemeContext();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleSources = (messageIndex) => {
    setExpandedSources(prev => ({
      ...prev,
      [messageIndex]: !prev[messageIndex]
    }));
  };

  const handleInternetSearchToggle = () => {
    if (!internetSearch) {
      setWarningDialogOpen(true);
    } else {
      setInternetSearch(false);
    }
  };

  const handleWarningConfirm = () => {
    setInternetSearch(true);
    setWarningDialogOpen(false);
  };

  const getPlaceholderText = () => {
    if (internetSearch) {
      return "Ask any question (using both your notes and web search)...";
    }
    return "Ask a question about your uploaded documents...";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || isProcessing) return;

    const userMessage = input.trim();
    setInput('');

    // Check for secret code
    if (userMessage === 'P!NKTHEMEFORBAS') {
      togglePinkTheme();
      setMessages(prev => [...prev, 
        { text: userMessage, sender: 'user' },
        { text: '🎀 Theme updated! Welcome to the pink side! 🎀', sender: 'ai' }
      ]);
      return;
    }

    setLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);

    try {
      const response = await askQuestion(userMessage, internetSearch);
      
      // Add AI response to chat with sources
      setMessages(prev => [...prev, { 
        text: response.answer, 
        sender: 'ai',
        sources: response.sources
      }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { 
        text: 'I encountered an error while processing your question. Please try again.', 
        sender: 'error' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!saveTitle.trim() || messages.length === 0) {
      setNotification({
        open: true,
        message: 'Please enter a title for your conversation',
        severity: 'error'
      });
      return;
    }

    try {
      await saveConversation(saveTitle.trim(), messages);
      // Close dialog first, then show notification
      setSaveDialogOpen(false);
      setSaveTitle('');
      // Notify parent component that a save occurred
      if (onSave) {
        onSave();
      }
      // Show success notification after dialog is closed
      setTimeout(() => {
        setNotification({
          open: true,
          message: 'Conversation saved successfully! Refresh the page to view the new saved note.',
          severity: 'success'
        });
      }, 100);
    } catch (error) {
      setNotification({
        open: true,
        message: 'Failed to save conversation. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseDialog = () => {
    setSaveTitle('');
    setSaveDialogOpen(false);
  };

  const renderMessage = (message, index) => {
    const isAI = message.sender === 'ai';
    const hasSources = isAI && message.sources && message.sources.length > 0;

    return (
      <ListItem
        key={index}
        sx={{
          flexDirection: 'column',
          alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
          mb: 1,
        }}
      >
        <Paper
          sx={{
            p: 2,
            maxWidth: '80%',
            backgroundColor: message.sender === 'user' ? 'primary.main' : 'white',
            color: message.sender === 'user' ? 'white' : 'text.primary',
            borderRadius: 2,
          }}
        >
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{message.text}</Typography>
          
          {hasSources && (
            <Box mt={1}>
              <Button
                size="small"
                onClick={() => toggleSources(index)}
                endIcon={expandedSources[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ textTransform: 'none' }}
              >
                {expandedSources[index] ? 'Hide Sources' : 'Show Sources'}
              </Button>
              
              <Collapse in={expandedSources[index]}>
                <Box mt={1} pl={2} borderLeft={2} borderColor="primary.main">
                  {message.sources.map((source, sourceIndex) => (
                    <Box key={sourceIndex} mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Source {sourceIndex + 1}:
                      </Typography>
                      <Typography variant="body2">
                        {source.content}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
        </Paper>
      </ListItem>
    );
  };

  return (
    <Paper 
      elevation={3}
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, color: theme.palette.text.primary }}>
        Chat with your Notes {internetSearch && '(Web Search Enabled)'}
      </Typography>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          mb: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2,
          backgroundColor: theme.palette.background.default,
          borderRadius: 1,
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: message.sender === 'user' 
                  ? theme.palette.primary.main
                  : theme.palette.background.paper,
                color: message.sender === 'user'
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
                borderRadius: 2,
              }}
            >
              <Typography variant="body1">
                {message.text}
              </Typography>
              {message.sources && message.sources.length > 0 && (
                <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                    Sources:
                  </Typography>
                  {message.sources.map((source, idx) => (
                    <Typography 
                      key={idx} 
                      variant="caption" 
                      component="div"
                      sx={{ 
                        color: theme.palette.text.secondary,
                        fontSize: '0.75rem',
                        mt: 0.5 
                      }}
                    >
                      {source.content}
                    </Typography>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        ))}
        {loading && (
          <Box
            sx={{
              alignSelf: 'flex-start',
              maxWidth: '80%',
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
              }}
            >
              <Typography sx={{ color: theme.palette.text.secondary }}>
                Thinking...
              </Typography>
            </Paper>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={getPlaceholderText()}
          disabled={loading}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.background.default,
            }
          }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={internetSearch}
              onChange={handleInternetSearchToggle}
              color="primary"
            />
          }
          label={
            <Box component="span" sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: internetSearch ? 'primary.main' : 'text.secondary',
              fontSize: '0.875rem'
            }}>
              Web Search
            </Box>
          }
          sx={{ mx: 1, minWidth: 'fit-content' }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          sx={{
            minWidth: '120px',
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
          }}
        >
          {loading ? 'Sending...' : (
            <>
              Send
              <SendIcon sx={{ ml: 1 }} />
            </>
          )}
        </Button>
        <Button
          variant="outlined"
          onClick={() => setSaveDialogOpen(true)}
          disabled={messages.length === 0}
          sx={{
            minWidth: '120px',
          }}
        >
          <SaveIcon sx={{ mr: 1 }} />
          Save
        </Button>
      </Box>

      {/* Save Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        keepMounted={false}
      >
        <DialogTitle>Save Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Conversation Title"
            type="text"
            fullWidth
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Internet Search Warning Dialog */}
      <Dialog
        open={warningDialogOpen}
        onClose={() => setWarningDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="warning" />
          Enable Web Search
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Currently, the AI only looks through your uploaded documents for answers. Enabling web search will allow the AI to:
            <Box component="ul" sx={{ mt: 1 }}>
              <li>Search the internet for additional information</li>
              <li>Combine knowledge from your documents and the web</li>
              <li>Provide broader context and explanations</li>
            </Box>
            Please note:
            <Box component="ul" sx={{ mt: 1 }}>
              <li>Responses may include information not verified in your documents</li>
              <li>Processing time may be longer</li>
              <li>The AI will still prioritize information from your documents when relevant</li>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWarningDialogOpen(false)} color="inherit">
            Keep Document-Only Mode
          </Button>
          <Button onClick={handleWarningConfirm} variant="contained" autoFocus>
            Enable Web Search
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ChatBox; 