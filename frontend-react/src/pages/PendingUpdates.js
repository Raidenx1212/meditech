import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Box,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MedicalServices as MedicalIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Update as UpdateIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  HistoryToggleOff as PendingIcon,
  LocalHospital as HospitalIcon,
  PermContactCalendar as DoctorIcon,
  AccessTime as TimeIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { MedicalDocService } from '../services/api.service';
import BlockchainService from '../services/blockchain.service';

const PendingUpdates = () => {
  const [pendingUpdates, setPendingUpdates] = useState([]);
  const [approvedDocs, setApprovedDocs] = useState([]);
  const [rejectedDocs, setRejectedDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tab, setTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      MedicalDocService.getPendingDocs(),
      MedicalDocService.getApprovedDocs(),
      MedicalDocService.getRejectedDocs()
    ]).then(([pending, approved, rejected]) => {
      setPendingUpdates(pending);
      setApprovedDocs(approved);
      setRejectedDocs(rejected);
      setLoading(false);
    });
  }, []);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleViewDetails = (update) => {
    setSelectedUpdate(update);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleApprove = async (id) => {
    try {
      setApproving(true);
      const update = pendingUpdates.find(u => u._id === id);
      
      // First, try to approve on blockchain
      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const walletAddress = localStorage.getItem('walletAddress');

        if (!walletAddress) {
          throw new Error('No wallet address found. Please make sure you are logged in with the correct account.');
        }

        // Get doctor's wallet address from the update object or user data
        const doctorWalletAddress = update.doctorWalletAddress || update.doctorId;
        if (!doctorWalletAddress) {
          throw new Error('Doctor wallet address not found. Cannot proceed with approval.');
        }

        console.log('Approving document with:', {
          documentId: id,
          patientWallet: walletAddress,
          doctorWallet: doctorWalletAddress
        });

        const { transactionHash, timestamp } = await BlockchainService.approveDocument(
          id,
          walletAddress,
          doctorWalletAddress
        );
        
        // If blockchain approval succeeds, update in database
        await MedicalDocService.approveDoc(id, { 
          blockchainTxHash: transactionHash, 
          blockchainTimestamp: timestamp,
          approverWallet: walletAddress
        });
        
        setPendingUpdates(pendingUpdates.filter(update => update._id !== id));
        setOpenDialog(false);
        setSnackbar({
          open: true,
          message: 'Document approved successfully on blockchain',
          severity: 'success'
        });
      } catch (blockchainError) {
        console.error('Blockchain approval failed:', blockchainError);
        setSnackbar({
          open: true,
          message: blockchainError.message || 'Failed to approve document on blockchain. Please try again.',
          severity: 'error'
        });
        return; // Don't proceed with database update if blockchain fails
      }
    } catch (error) {
      console.error('Error in approval process:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to approve document. Please try again.',
        severity: 'error'
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (id) => {
    await MedicalDocService.rejectDoc(id);
    setPendingUpdates(pendingUpdates.filter(update => update._id !== id));
    setOpenDialog(false);
    setSnackbar({
      open: true,
      message: 'Update rejected',
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'New Diagnosis':
        return <MedicalIcon />;
      case 'Medication Change':
        return <EditIcon />;
      case 'Vaccination Record':
        return <AddIcon />;
      case 'Lab Result Update':
        return <UpdateIcon />;
      default:
        return <UpdateIcon />;
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
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          Pending Medical Updates
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Review and approve updates submitted by your healthcare providers
        </Typography>
      </Box>
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={`Pending (${pendingUpdates.length})`} />
        <Tab label={`Approved (${approvedDocs.length})`} />
        <Tab label={`Rejected (${rejectedDocs.length})`} />
      </Tabs>
      {tab === 0 && (
        pendingUpdates.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <PendingIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Pending Updates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any medical record updates that require your approval at this time.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {pendingUpdates.map((update) => (
              <Grid item xs={12} md={6} key={update._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', mr: 2 }}>
                        <MedicalIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {update.description || 'Medical Document Pending Approval'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Uploaded by: {update.doctorId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Uploaded: {update.uploadedAt ? new Date(update.uploadedAt).toLocaleString() : 'N/A'}
                        </Typography>
                        {update.fileUrl && (
                          <Box mt={1}>
                            <Button
                              startIcon={<DownloadIcon />}
                              onClick={() => downloadFile(update)}
                              variant="outlined"
                              size="small"
                            >
                              Download
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small" 
                      startIcon={<ApproveIcon />}
                      onClick={() => handleApprove(update._id)}
                      disabled={approving}
                    >
                      {approving ? 'Approving...' : 'Approve'}
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small" 
                      startIcon={<RejectIcon />}
                      onClick={() => handleReject(update._id)}
                    >
                      Reject
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}
      {tab === 1 && (
        approvedDocs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <ApproveIcon sx={{ fontSize: 60, color: 'success.light', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Approved Documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have not approved any documents yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {approvedDocs.map((doc) => (
              <Grid item xs={12} md={6} key={doc._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'success.light', color: 'success.contrastText', mr: 2 }}>
                        <ApproveIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {doc.description || 'Approved Medical Document'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Uploaded by: {doc.doctorId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}
                        </Typography>
                        {doc.fileUrl && (
                          <Box mt={1}>
                            <Button
                              startIcon={<DownloadIcon />}
                              onClick={() => downloadFile(doc)}
                              variant="outlined"
                              size="small"
                            >
                              Download
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}
      {tab === 2 && (
        rejectedDocs.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <RejectIcon sx={{ fontSize: 60, color: 'error.light', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Rejected Documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have not rejected any documents yet.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {rejectedDocs.map((doc) => (
              <Grid item xs={12} md={6} key={doc._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'error.light', color: 'error.contrastText', mr: 2 }}>
                        <RejectIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {doc.description || 'Rejected Medical Document'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Uploaded by: {doc.doctorId}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Uploaded: {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}
                        </Typography>
                        {doc.fileUrl && (
                          <Box mt={1}>
                            <Button
                              startIcon={<DownloadIcon />}
                              onClick={() => downloadFile(doc)}
                              variant="outlined"
                              size="small"
                            >
                              Download
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )
      )}

      {/* Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        {selectedUpdate && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                  {getUpdateIcon(selectedUpdate.type)}
                </Avatar>
                <Box>
                  {selectedUpdate.type}
                  <Typography variant="body2" color="text.secondary">
                    {selectedUpdate.description}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Submitted by {selectedUpdate.doctor} ({selectedUpdate.department}) on {selectedUpdate.dateSubmitted}
                </Typography>
              </Box>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Proposed Changes
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  {selectedUpdate.details.map((detail, index) => (
                    <Grid item xs={12} key={index}>
                      <Card variant="outlined" sx={{ mb: 1 }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {detail.field}
                          </Typography>
                          
                          <Grid container spacing={2}>
                            {detail.oldValue && (
                              <Grid item xs={12} sm={6}>
                                <Box sx={{ bgcolor: 'error.light', p: 1, borderRadius: 1, opacity: 0.8 }}>
                                  <Typography variant="body2" fontWeight="medium" color="error.dark">
                                    Previous:
                                  </Typography>
                                  <Typography variant="body2">
                                    {detail.oldValue}
                                  </Typography>
                                </Box>
                              </Grid>
                            )}
                            
                            <Grid item xs={12} sm={detail.oldValue ? 6 : 12}>
                              <Box sx={{ bgcolor: 'success.light', p: 1, borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight="medium" color="success.dark">
                                  {detail.oldValue ? 'New:' : 'Value:'}
                                </Typography>
                                <Typography variant="body2">
                                  {detail.newValue}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </DialogContent>
            <DialogActions>
              <Button 
                variant="outlined" 
                color="error" 
                onClick={() => handleReject(selectedUpdate._id)}
                startIcon={<RejectIcon />}
              >
                Reject
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleApprove(selectedUpdate._id)}
                startIcon={<ApproveIcon />}
              >
                Approve
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PendingUpdates; 