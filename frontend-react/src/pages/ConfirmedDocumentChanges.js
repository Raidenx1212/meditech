import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Button, Snackbar, Alert } from '@mui/material';
import { MedicalDocService } from '../services/api.service';
import DownloadIcon from '@mui/icons-material/Download';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const ConfirmedDocumentChanges = () => {
  const [docs, setDocs] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    MedicalDocService.getDoctorConfirmedDocs().then(setDocs);
  }, []);

  const handleView = async (doc) => {
    setPreviewDoc(doc);
    // Try to fetch and preview if it's an image or PDF
    const token = localStorage.getItem('token');
    const fileId = doc.fileId || (doc.fileUrl && doc.fileUrl.split('/').pop());
    if (!fileId) return;
    const response = await fetch(`/api/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      setPreviewUrl(null);
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    setPreviewUrl(url);
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const downloadFile = async (doc) => {
    const token = localStorage.getItem('token');
    const fileId = doc.fileId || (doc.fileUrl && doc.fileUrl.split('/').pop());
    if (!fileId) return;
    const response = await fetch(`/api/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      alert('Failed to download file');
      return;
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', doc.fileName || 'document');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Confirmed Document Changes</Typography>
      <List>
        {docs.map(doc => (
          <ListItem
            key={doc._id}
            divider
            secondaryAction={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label="Confirmed" color="success" />
                <Button variant="outlined" color="primary" size="small" onClick={() => handleView(doc)}>
                  View
                </Button>
                {doc.fileUrl && (
                  <Button
                    startIcon={<DownloadIcon />}
                    onClick={() => downloadFile(doc)}
                    variant="outlined"
                    size="small"
                  >
                    Download
                  </Button>
                )}
              </Box>
            }
          >
            <ListItemText
              primary={`${doc.patientId?.firstName || ''} ${doc.patientId?.lastName || ''} - ${doc.description || doc.doc}`}
              secondary={`Date: ${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : ''} | Submitted by: You`}
            />
          </ListItem>
        ))}
      </List>
      <Dialog open={!!previewDoc} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {previewDoc && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                {previewDoc.description || previewDoc.doc}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Patient: {previewDoc.patientId?.firstName || ''} {previewDoc.patientId?.lastName || ''}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Uploaded: {previewDoc.uploadedAt ? new Date(previewDoc.uploadedAt).toLocaleString() : ''}
              </Typography>
              {previewUrl && previewDoc.fileName && previewDoc.fileName.match(/\.(jpg|jpeg|png|gif)$/i) && (
                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', marginTop: 16 }} />
              )}
              {previewUrl && previewDoc.fileName && previewDoc.fileName.match(/\.pdf$/i) && (
                <iframe src={previewUrl} title="PDF Preview" style={{ width: '100%', height: 500, marginTop: 16 }} />
              )}
              {!previewUrl && <Typography color="text.secondary">No preview available for this file type.</Typography>}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
      >
        <Alert severity="info" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConfirmedDocumentChanges; 