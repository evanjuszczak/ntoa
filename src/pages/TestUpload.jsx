import { useState, useEffect } from 'react';
import FileUpload from '../components/FileUpload';
import { listFiles, deleteFile, getFileUrl } from '../services/fileService';

const TestUpload = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const fileList = await listFiles();
      setFiles(fileList);
    } catch (err) {
      setError('Failed to load files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUploadComplete = async (results) => {
    console.log('Upload completed:', results);
    await loadFiles(); // Refresh the file list
  };

  const handleDelete = async (path) => {
    try {
      await deleteFile(path);
      await loadFiles(); // Refresh the file list
    } catch (err) {
      setError('Failed to delete file');
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">File Upload Test</h1>
      
      <div className="mb-8">
        <FileUpload onUploadComplete={handleUploadComplete} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
        
        {loading && <div className="text-gray-600">Loading files...</div>}
        
        {error && (
          <div className="text-red-600 mb-4">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {files.map((file) => (
            <div 
              key={file.name}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center">
                <span className="text-lg mr-2">📄</span>
                <span>{file.name}</span>
              </div>
              <div className="flex gap-2">
                <a
                  href={getFileUrl(file.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  View
                </a>
                <button
                  onClick={() => handleDelete(file.name)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          
          {!loading && files.length === 0 && (
            <div className="text-gray-600">
              No files uploaded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestUpload; 