import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Button, TextField, Snackbar, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl, Checkbox, ListItemText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const API = {
  getDoctors: async () => (await fetch('/api/doctors', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })).json(),
  addDoctor: async (data) => (await fetch('/api/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) })).json(),
  removeDoctor: async (id) => (await fetch(`/api/doctors/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })).json(),
  getUsers: async (role) => (await fetch(`/api/${role === 'doctor' ? 'doctors' : 'patients'}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })).json(),
  notify: async (type, data) => (await fetch(`/api/notifications/${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }, body: JSON.stringify(data) })).json(),
};

const AdminPanel = () => {
  const [tab, setTab] = useState(0);
  // Doctor management
  const [doctors, setDoctors] = useState([]);
  const [addForm, setAddForm] = useState({ email: '', password: '', firstName: '', lastName: '', walletAddress: '' });
  // Notifications
  const [notifType, setNotifType] = useState('doctors');
  const [notifMsg, setNotifMsg] = useState('');
  const [customRecipients, setCustomRecipients] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  // UI
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, doctorId: null });

  useEffect(() => { fetchDoctors(); }, []);
  const fetchDoctors = async () => {
    const res = await API.getDoctors();
    setDoctors(res.doctors || []);
  };

  const handleAddDoctor = async () => {
    const res = await API.addDoctor(addForm);
    if (res.success) {
      setSnackbar({ open: true, message: 'Doctor added', severity: 'success' });
      setAddForm({ email: '', password: '', firstName: '', lastName: '', walletAddress: '' });
      fetchDoctors();
    } else {
      setSnackbar({ open: true, message: res.message || 'Error', severity: 'error' });
    }
  };

  const handleRemoveDoctor = async (id) => {
    setConfirmDialog({ open: false, doctorId: null });
    const res = await API.removeDoctor(id);
    if (res.success) {
      setSnackbar({ open: true, message: 'Doctor removed', severity: 'success' });
      fetchDoctors();
    } else {
      setSnackbar({ open: true, message: res.message || 'Error', severity: 'error' });
    }
  };

  // Notification logic
  useEffect(() => {
    if (notifType === 'custom') {
      // Fetch all users for custom selection
      Promise.all([
        API.getUsers('doctor'),
        API.getUsers('patient')
      ]).then(([docs, pats]) => {
        setAllUsers([...(docs.doctors || []), ...(pats.patients || pats.doctors || [])]);
      });
    }
  }, [notifType]);

  const handleSendNotif = async () => {
    let res;
    if (notifType === 'custom') {
      res = await API.notify('custom', { message: notifMsg, recipientIds: customRecipients });
    } else {
      res = await API.notify(notifType, { message: notifMsg });
    }
    if (res.success) {
      setSnackbar({ open: true, message: 'Notification sent', severity: 'success' });
      setNotifMsg('');
      setCustomRecipients([]);
    } else {
      setSnackbar({ open: true, message: res.message || 'Error', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>Admin Panel</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Manage Doctors" />
        <Tab label="Send Notifications" />
      </Tabs>
      {tab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>Add Doctor</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label="First Name" value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} />
            <TextField label="Last Name" value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} />
            <TextField label="Email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} />
            <TextField label="Wallet Address" value={addForm.walletAddress} onChange={e => setAddForm(f => ({ ...f, walletAddress: e.target.value }))} />
            <TextField label="Password" type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
            <Button variant="contained" onClick={handleAddDoctor}>Add</Button>
          </Box>
          <Typography variant="h6" gutterBottom>Doctors List</Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Wallet</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {doctors.map(doc => (
                  <TableRow key={doc._id}>
                    <TableCell>{doc.firstName} {doc.lastName}</TableCell>
                    <TableCell>{doc.email}</TableCell>
                    <TableCell>{doc.walletAddress}</TableCell>
                    <TableCell>
                      <IconButton color="error" onClick={() => setConfirmDialog({ open: true, doctorId: doc._id })}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, doctorId: null })}>
            <DialogTitle>Remove Doctor?</DialogTitle>
            <DialogContent>Are you sure you want to remove this doctor?</DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog({ open: false, doctorId: null })}>Cancel</Button>
              <Button color="error" onClick={() => handleRemoveDoctor(confirmDialog.doctorId)}>Remove</Button>
            </DialogActions>
          </Dialog>
        </Box>
      )}
      {tab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>Send Notification</Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl>
              <InputLabel>Recipient</InputLabel>
              <Select value={notifType} label="Recipient" onChange={e => setNotifType(e.target.value)}>
                <MenuItem value="doctors">All Doctors</MenuItem>
                <MenuItem value="patients">All Patients</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>
            {notifType === 'custom' && (
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Users</InputLabel>
                <Select
                  multiple
                  value={customRecipients}
                  onChange={e => setCustomRecipients(e.target.value)}
                  renderValue={selected => selected.length + ' selected'}
                >
                  {allUsers.map(u => (
                    <MenuItem key={u._id} value={u._id}>
                      <Checkbox checked={customRecipients.indexOf(u._id) > -1} />
                      <ListItemText primary={u.firstName + ' ' + u.lastName + ' (' + u.email + ')'} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField label="Message" value={notifMsg} onChange={e => setNotifMsg(e.target.value)} fullWidth />
            <Button variant="contained" onClick={handleSendNotif}>Send</Button>
          </Box>
        </Box>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPanel; 