import React, { useState, useCallback } from 'react';
import { Box, Button, CircularProgress, Typography, Paper, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Web3Service from '../services/web3.service';
import IPFSService from '../services/ipfs.service';

const PdfUpload = ({ patientId, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [ipfsHash, setIpfsHash] = useState(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a valid PDF file');
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const uploadToIpfs = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await IPFSService.uploadFile(formData);
      return response.data.IpfsHash;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Upload to IPFS
      const hash = await uploadToIpfs(file);
      setIpfsHash(hash);

      // 2. Get current wallet address
      const accounts = await Web3Service.web3.eth.getAccounts();
      const userAddress = accounts[0];

      // 3. Create blockchain record
      const result = await Web3Service.approvePdfChange(
        process.env.REACT_APP_CONTRACT_ADDRESS,
        process.env.REACT_APP_CONTRACT_ABI,
        hash,
        userAddress
      );

      setSuccess(true);
      if (onUploadComplete) {
        onUploadComplete({
          ipfsHash: hash,
          transactionHash: result.transactionHash
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload and process the PDF');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main'
          }
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('pdf-upload').click()}
      >
        <input
          type="file"
          id="pdf-upload"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          {file ? file.name : 'Drop PDF here or click to upload'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Only PDF files are accepted
        </Typography>

        {file && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={uploading}
            sx={{ mt: 2 }}
          >
            {uploading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Upload and Process'
            )}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          icon={<CheckCircleIcon fontSize="inherit" />} 
          severity="success"
          sx={{ mt: 2 }}
        >
          PDF uploaded successfully! IPFS Hash: {ipfsHash}
        </Alert>
      )}
    </Paper>
  );
};

export default PdfUpload; 