import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { supabase, STORAGE_BUCKET } from '../config/supabase';
import {
  Box,
  Paper,
  Typography,
  Button,
  LinearProgress,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const ALLOWED_TYPES = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.ms-powerpoint': 'PPT'
};

const FileUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const isValidFileType = (fileType) => {
    return Object.keys(ALLOWED_TYPES).includes(fileType);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (isValidFileType(droppedFile?.type)) {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please upload a PDF, PPTX, or PPT file');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (isValidFileType(selectedFile?.type)) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please upload a PDF, PPTX, or PPT file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);

      // Upload file to Supabase Storage
      const filePath = `${user.uid}/${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get the URL (it will be private by default)
      const { data: urlData } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(filePath, 3600); // URL valid for 1 hour

      // Save file metadata to Firestore
      await addDoc(collection(db, 'notes'), {
        userId: user.uid,
        fileName: file.name,
        filePath: filePath,
        fileType: ALLOWED_TYPES[file.type],
        fileUrl: urlData.signedUrl,
        uploadedAt: serverTimestamp(),
        processed: false
      });

      setProgress(100);
      setFile(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      setError('Failed to upload file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
      >
        <input
          type="file"
          accept=".pdf,.pptx,.ppt"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop your file here
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported formats: PDF, PPTX, PPT (up to 500MB)
          </Typography>
        </label>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {file && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Selected file: {file.name}
          </Typography>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            sx={{ mt: 1 }}
          >
            Upload File
          </Button>
        </Box>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      )}
    </Paper>
  );
};

export default FileUpload; 