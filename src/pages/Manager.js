import React, { useEffect, useState } from 'react';
import api from '../services/api';
import jsPDF from 'jspdf';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress
} from '@mui/material';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#ef5350', '#ffca28', '#66bb6a']; // Positive, Neutral, Negative

const getSentimentChartData = (sentimentBreakdown) => {
  if (!sentimentBreakdown) return [];
  return Object.entries(sentimentBreakdown).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
  }));
};

const Manager = () => {
  const [employees, setEmployees] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [newFeedback, setNewFeedback] = useState({
    strengths: '',
    improvements: '',
    sentiment: 'neutral',
    tags: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setEmployees(await api.getEmployees());
    setOverview(await api.getTeamOverview());
    setHistory(await api.getFeedbackGiven());
  };

  const submitFeedback = async () => {
    setSubmitLoading(true);
    try {
      const payload = {
        employee_id: selectedEmp,
        strengths: newFeedback.strengths,
        improvements: newFeedback.improvements,
        sentiment: newFeedback.sentiment,
        tags: newFeedback.tags.split(',').map(t => t.trim())
      };
      await api.createFeedback(payload);
      setNewFeedback({ strengths: '', improvements: '', sentiment: 'neutral', tags: '' });
      setSelectedEmp('');
      await fetchData();
    } catch (error) {
      console.error('Submit feedback failed:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  const startEdit = fb => {
    setEditingId(fb.id);
    setEditData({
      strengths: fb.strengths || '',
      improvements: fb.improvements || '',
      sentiment: fb.sentiment || 'neutral',
      tags: (fb.tags || []).join(', ')
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async id => {
    const payload = {
      strengths: editData.strengths,
      improvements: editData.improvements,
      sentiment: editData.sentiment,
      tags: editData.tags.split(',').map(t => t.trim())
    };
    await api.updateFeedback(id, payload);
    cancelEdit();
    fetchData();
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Feedbacks Given', 10, 10);

    let y = 20;

    history.forEach((fb) => {
      doc.text(`Name: ${fb.employee_username}`, 10, y);
      y += 6;

      doc.text(`Sentiment: ${fb.sentiment}`, 10, y);
      y += 6;

      if (fb.strengths) {
        doc.text(`Strengths: ${fb.strengths}`, 10, y);
        y += 6;
      }

      if (fb.improvements) {
        doc.text(`Improvements: ${fb.improvements}`, 10, y);
        y += 6;
      }

      if (fb.tags && fb.tags.length) {
        doc.text(`Tags: ${fb.tags.join(', ')}`, 10, y);
        y += 6;
      }

      y += 10;
    });

    doc.save('manager_feedbacks.pdf');
  };

  return (
    <Box p={4} maxWidth="1000px" mx="auto">
      {/* Team Overview */}
      <Box mb={6}>
        <Typography variant="h5" gutterBottom>Team Overview</Typography>
        {overview && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography>Employees: {overview.employees_count}</Typography>
                <Typography>Total Feedbacks: {overview.total_feedbacks}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box width="100%" minWidth={300} height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getSentimentChartData(overview.sentiment_breakdown)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {getSentimentChartData(overview.sentiment_breakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* New Feedback Form */}
      <Box mb={6}>
        <Typography variant="h6" gutterBottom>Give Feedback</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel sx={{ minWidth: '120px' }}>Select Employee</InputLabel>
              <Select
                sx={{ minWidth: '170px' }}
                value={selectedEmp}
                label="Select Employee"
                onChange={(e) => setSelectedEmp(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.id} value={emp.id}>{emp.username}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Strengths"
              fullWidth
              value={newFeedback.strengths}
              onChange={e => setNewFeedback({ ...newFeedback, strengths: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Improvements"
              fullWidth
              value={newFeedback.improvements}
              onChange={e => setNewFeedback({ ...newFeedback, improvements: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Sentiment</InputLabel>
              <Select
                value={newFeedback.sentiment}
                label="Sentiment"
                onChange={e => setNewFeedback({ ...newFeedback, sentiment: e.target.value })}
              >
                <MenuItem value="positive">Positive</MenuItem>
                <MenuItem value="neutral">Neutral</MenuItem>
                <MenuItem value="negative">Negative</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tags (comma-separated)"
              fullWidth
              value={newFeedback.tags}
              onChange={e => setNewFeedback({ ...newFeedback, tags: e.target.value })}
            />
          </Grid>
        </Grid>
        <br />
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            disabled={!selectedEmp || submitLoading}
            onClick={submitFeedback}
          >
            {submitLoading ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
          </Button>
        </Grid>
      </Box>

      {/* Feedback History */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Feedback History</Typography>
          <Button variant="outlined" color="success" onClick={downloadPDF}>
            Download PDF
          </Button>
        </Box>

        {history.map((fb) => (
          <Card key={fb.id} variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              {editingId !== fb.id ? (
                <>
                  <Typography><strong>Name:</strong> {fb.employee_username || '—'}</Typography>
                  <Typography><strong>Strengths:</strong> {fb.strengths || '—'}</Typography>
                  <Typography><strong>Improvements:</strong> {fb.improvements || '—'}</Typography>
                  <Typography><strong>Sentiment:</strong> {fb.sentiment}</Typography>
                  <Typography><strong>Tags:</strong> {(fb.tags || []).join(', ') || '—'}</Typography>
                </>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Strengths"
                      fullWidth
                      value={editData.strengths}
                      onChange={e => setEditData({ ...editData, strengths: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Improvements"
                      fullWidth
                      value={editData.improvements}
                      onChange={e => setEditData({ ...editData, improvements: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sentiment</InputLabel>
                      <Select
                        value={editData.sentiment}
                        label="Sentiment"
                        onChange={e => setEditData({ ...editData, sentiment: e.target.value })}
                      >
                        <MenuItem value="positive">Positive</MenuItem>
                        <MenuItem value="neutral">Neutral</MenuItem>
                        <MenuItem value="negative">Negative</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Tags"
                      fullWidth
                      value={editData.tags}
                      onChange={e => setEditData({ ...editData, tags: e.target.value })}
                    />
                  </Grid>
                </Grid>
              )}
            </CardContent>
            <CardActions>
              {editingId !== fb.id ? (
                <Button size="small" onClick={() => startEdit(fb)}>Edit</Button>
              ) : (
                <>
                  <Button size="small" color="success" onClick={() => saveEdit(fb.id)}>Save</Button>
                  <Button size="small" color="error" onClick={cancelEdit}>Cancel</Button>
                </>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default Manager;
