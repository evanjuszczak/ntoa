import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from '../components/FileUpload';
import ChatBox from '../components/ChatBox';
import { listFiles, deleteFile, getFileUrl } from '../services/fileService';
import { processFiles } from '../services/aiService';
import {
  Typography,
  Paper,
  Container,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Checkbox,
  ListItemSecondaryAction,
  Collapse,
  Link,
  CssBaseline,
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
  Logout as LogoutIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  OpenInNew as OpenInNewIcon,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useThemeContext } from '../contexts/ThemeContext';
import SavedNotes from '../components/SavedNotes';
import Logo from '../components/Logo';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showFileManager, setShowFileManager] = useState(true);
  const [filesProcessed, setFilesProcessed] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [showSavedNotes, setShowSavedNotes] = useState(false);
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeContext();

  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      await loadFiles();
    };

    checkAuth();
  }, [user, navigate]);

  const loadFiles = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const fileList = await listFiles();
      setFiles(Array.isArray(fileList) ? fileList : []);
      setSelectedFiles([]);
    } catch (err) {
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to logout. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadFiles();
    setFilesProcessed(false);
    setChatKey(prevKey => prevKey + 1);
    setSelectedFiles([]);
  };

  const handleUploadComplete = async (results) => {
    setUploadDialogOpen(false);
    await loadFiles();
    setNotification({
      open: true,
      message: `Successfully uploaded ${results.length} file(s)`,
      severity: 'success'
    });
  };

  const handleDelete = async (path) => {
    try {
      await deleteFile(path);
      setFiles(prevFiles => prevFiles.filter(file => file.path !== path));
      setSelectedFiles(prev => prev.filter(fileName => fileName !== path));
      
      setNotification({
        open: true,
        message: 'File deleted successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Delete error:', err);
      setNotification({
        open: true,
        message: 'Failed to delete file. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleFileSelect = (fileName) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileName)) {
        return prev.filter(f => f !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };

  const handleSubmitToAI = async () => {
    if (selectedFiles.length === 0) {
      setNotification({
        open: true,
        message: 'Please select at least one file to process',
        severity: 'warning'
      });
      return;
    }

    try {
      setProcessing(true);
      setFilesProcessed(false);
      setChatKey(prevKey => prevKey + 1);
      setNotification({
        open: true,
        message: 'Processing files...',
        severity: 'info'
      });

      // Get signed URLs for selected files
      const fileUrls = await Promise.all(
        selectedFiles.map(async (fileName) => {
          const file = files.find(f => f.name === fileName);
          if (!file) {
            throw new Error(`File not found: ${fileName}`);
          }
          return getFileUrl(file.path);
        })
      );
      
      // Process files with AI service
      await processFiles(fileUrls);

      setNotification({
        open: true,
        message: 'Files processed successfully!',
        severity: 'success'
      });
      setSelectedFiles([]);
      setFilesProcessed(true);
      setShowFileManager(false);
    } catch (error) {
      setNotification({
        open: true,
        message: error.message || 'Failed to process files. Please try again.',
        severity: 'error'
      });
      setFilesProcessed(false);
    } finally {
      setProcessing(false);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf':
        return <PdfIcon color="error" />;
      case 'doc':
      case 'docx':
        return <DocIcon color="primary" />;
      default:
        return <DocIcon />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.default,
          m: 0,
          p: 0,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
        <Container 
          maxWidth={false} 
          disableGutters
          sx={{ 
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: 'none',
            m: 0,
            p: 0,
            boxSizing: 'border-box'
          }}
        >
          <Box
            sx={{
              width: '100%',
              backgroundColor: theme.palette.background.paper,
              borderBottom: `1px solid ${theme.palette.divider}`,
              px: { xs: 2, sm: 3 },
              py: 3,
              boxSizing: 'border-box'
            }}
          >
            <Container
              maxWidth="lg"
              sx={{
                mx: 'auto',
                width: '100%'
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid item xs>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Logo size={48} />
                    <Box>
                      <Typography variant="h4">N2A AI Assistant</Typography>
                      <Typography variant="subtitle1" color="text.secondary">
                        Hello {user?.email}!
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item>
                  <Box display="flex" gap={2} alignItems="center">
                    <Button
                      variant="outlined"
                      startIcon={showFileManager ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => setShowFileManager(!showFileManager)}
                    >
                      {showFileManager ? 'Hide' : 'Show'} File Manager
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={showSavedNotes ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      onClick={() => setShowSavedNotes(!showSavedNotes)}
                    >
                      {showSavedNotes ? 'Hide' : 'Show'} Saved Notes
                    </Button>
                    <IconButton
                      onClick={toggleColorMode}
                      sx={{
                        bgcolor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
                        '&:hover': {
                          bgcolor: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
                        },
                        width: 40,
                        height: 40,
                      }}
                    >
                      {mode === 'light' ? <DarkMode /> : <LightMode />}
                    </IconButton>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </Box>

          <Container
            maxWidth="lg"
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              py: 4,
              px: { xs: 2, sm: 3 }
            }}
          >
            {error && (
              <Alert 
                severity="error" 
                action={
                  <Button color="inherit" size="small" onClick={handleRefresh}>
                    Retry
                  </Button>
                }
                sx={{ mb: 3 }}
              >
                {error}
              </Alert>
            )}

            <Collapse in={showFileManager}>
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">File Manager</Typography>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={handleRefresh}
                      disabled={loading}
                    >
                      Refresh
                    </Button>
                    <Link
                      href="https://www.ilovepdf.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textDecoration: 'none' }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={<OpenInNewIcon />}
                      >
                        Convert Files Online
                      </Button>
                    </Link>
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      Upload Notes
                    </Button>
                  </Box>
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : files.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary" gutterBottom>
                      No files uploaded yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => setUploadDialogOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      Upload your first file
                    </Button>
                  </Box>
                ) : (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1">
                        {selectedFiles.length} file(s) selected
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SendIcon />}
                        onClick={handleSubmitToAI}
                        disabled={selectedFiles.length === 0 || processing}
                      >
                        {processing ? 'Processing...' : 'Submit to AI'}
                      </Button>
                    </Box>
                    <List>
                      {files.map((file) => (
                        <ListItem
                          key={file.name}
                          divider
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={selectedFiles.includes(file.name)}
                              onChange={() => handleFileSelect(file.name)}
                            />
                          </ListItemIcon>
                          <ListItemIcon>
                            {getFileIcon(file.name)}
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={`Size: ${formatFileSize(file.metadata?.size)} • Uploaded: ${new Date(file.created_at).toLocaleString()}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDelete(file.path)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </Paper>
            </Collapse>

            <Collapse in={showSavedNotes}>
              <Box sx={{ mb: 3 }}>
                <SavedNotes key={chatKey} />
              </Box>
            </Collapse>

            {filesProcessed && (
              <Box sx={{ width: '100%' }}>
                <ChatBox 
                  key={chatKey} 
                  isProcessing={processing}
                  onSave={() => setShowSavedNotes(true)}
                />
              </Box>
            )}
          </Container>
        </Container>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              m: 2
            }
          }}
        >
          <DialogTitle>Upload Notes</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FileUpload
                onUploadComplete={handleUploadComplete}
                multiple={true}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          </DialogActions>
        </Dialog>

        {/* Notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: 2 }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default Dashboard; 