import { useState, useCallback } from 'react';
import { uploadFile } from '../services/fileService';
import { useAuth } from '../contexts/AuthContext';
import styles from './FileUpload.module.css';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': 'PDF'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

const FileUpload = ({ onUploadComplete, path = '', multiple = true }) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(null);

  const validateFile = (file) => {
    if (!ACCEPTED_FILE_TYPES[file.type]) {
      throw new Error(`Only PDF files are supported. Please convert other file types to PDF before uploading.`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 50MB limit.');
    }
    return true;
  };

  const handleFiles = async (files) => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress({});

      const filesToUpload = Array.from(files);
      
      // Validate all files first
      filesToUpload.forEach(validateFile);

      // Upload files
      const uploadPromises = filesToUpload.map(async (file) => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: 0
        }));

        try {
          const result = await uploadFile(file, path);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
          return result;
        } catch (err) {
          console.error(`Error uploading ${file.name}:`, err);
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 0
          }));
          throw err;
        }
      });

      const results = await Promise.all(uploadPromises);
      
      if (onUploadComplete) {
        onUploadComplete(results);
      }
    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (!multiple && files.length > 1) {
      setError('Only one file can be uploaded at a time.');
      return;
    }
    await handleFiles(files);
  }, [multiple]);

  const handleFileInput = async (e) => {
    const files = Array.from(e.target.files);
    if (!multiple && files.length > 1) {
      setError('Only one file can be uploaded at a time.');
      return;
    }
    await handleFiles(files);
  };

  return (
    <div
      className={`${styles['upload-container']} ${isDragging ? styles['dragging'] : ''} ${isUploading ? styles['uploading'] : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={styles['upload-content']}>
        {isUploading ? (
          <div className={styles['upload-status']}>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} className={styles['progress-item']}>
                <div className={styles['progress-text']}>
                  <span>{fileName}</span>
                  <span>{progress}%</span>
                </div>
                <div className={styles['progress-bar']}>
                  <div 
                    className={styles['progress-fill']} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <input
              type="file"
              onChange={handleFileInput}
              multiple={multiple}
              accept="application/pdf,.pdf"
              className={styles['file-input']}
              id="file-input"
            />
            <label htmlFor="file-input" className={styles['upload-label']}>
              <div className={styles['upload-icon']}>📁</div>
              <span>
                {multiple 
                  ? 'Drag and drop files here or click to select multiple files'
                  : 'Drag and drop a file here or click to select'}
              </span>
              <div className={styles['file-types']}>
                Accepted file type: PDF only
              </div>
            </label>
          </>
        )}
        {error && <div className={styles['upload-error']}>{error}</div>}
      </div>
    </div>
  );
};

export default FileUpload; 