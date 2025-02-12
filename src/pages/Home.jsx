import { Typography, Button, Box, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ChatIcon from '@mui/icons-material/Chat';
import SearchIcon from '@mui/icons-material/Search';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', my: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Note-AI
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Upload your notes and get AI-powered insights and answers
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/login')}
          sx={{ mt: 4 }}
        >
          Get Started
        </Button>
      </Box>

      {/* Features Section */}
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Upload Notes
            </Typography>
            <Typography color="text.secondary">
              Easily upload your PDF notes and study materials
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <ChatIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              AI Interaction
            </Typography>
            <Typography color="text.secondary">
              Ask questions and get intelligent answers based on your notes
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <SearchIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Smart Search
            </Typography>
            <Typography color="text.secondary">
              Search through your notes and get relevant information instantly
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home; 