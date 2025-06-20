import React, { useEffect, useState } from 'react';
import api from '../services/api';
import jsPDF from 'jspdf';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  TextField,
  Grid,
  Chip
} from '@mui/material';

const Employee = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [comment, setComment] = useState({});

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const data = await api.getMyFeedback();
      setFeedbacks(data);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    }
  };

  const acknowledge = async (id) => {
    try {
      await api.acknowledge(id);
      fetchFeedbacks();
    } catch (err) {
      console.error('Acknowledge failed:', err);
    }
  };

  const addComment = async (id) => {
    try {
      await api.addComment(id, { employee_comments: comment[id] });
      setComment({ ...comment, [id]: '' });
      fetchFeedbacks();
    } catch (err) {
      console.error('Add comment failed:', err);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.text('My Feedbacks', 10, y);
    y += 10;

    feedbacks.forEach((fb, i) => {
      doc.text(`${i + 1}. ${fb.content}`, 10, y);
      y += 6;

      doc.text(`Sentiment: ${fb.sentiment}`, 10, y);
      y += 6;

      if (!fb.Date) {
        doc.text(`Date: ${new Date(fb.created_at).toLocaleDateString()}`, 10, y);
        y += 6;
      }

      if (!fb.anonymous && fb.manager_username) {
        doc.text(`From: ${fb.manager_username}`, 10, y);
        y += 6;
      }

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

      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save('employee_feedbacks.pdf');
  };

  return (
    <Box p={4} maxWidth="1000px" mx="auto">
      <Typography variant="h5" gutterBottom>
        My Feedback
      </Typography>

      <Button
        onClick={downloadPDF}
        variant="outlined"
        color="primary"
        sx={{ mb: 3 }}
      >
        Download PDF
      </Button>

      <Grid container spacing={3}>
        {feedbacks.map((fb) => (
          <Grid item xs={12} key={fb.id}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1"><strong>Feedback:</strong> {fb.content}</Typography>
                <Typography><strong>Sentiment:</strong> {fb.sentiment || 'N/A'}</Typography>
                <Typography>
                  <strong>From:</strong>{' '}
                  {fb.anonymous ? 'Anonymous' : fb.manager_username || 'Manager'}
                </Typography>
                <Typography><strong>Date:</strong> {new Date(fb.created_at).toLocaleDateString()}</Typography>

                {fb.strengths && (
                  <Typography><strong>Strengths:</strong> {fb.strengths}</Typography>
                )}
                {fb.improvements && (
                  <Typography><strong>Improvements:</strong> {fb.improvements}</Typography>
                )}
                {fb.tags && fb.tags.length > 0 && (
                  <Box mt={1}>
                    <strong>Tags:</strong>{' '}
                    {fb.tags.map((tag, idx) => (
                      <Chip
                        key={idx}
                        label={tag}
                        size="small"
                        sx={{ mr: 0.5 }}
                        color="default"
                      />
                    ))}
                  </Box>
                )}

                {fb.employee_comments && (
                  <Typography mt={2}><strong>Your Comment:</strong> {fb.employee_comments}</Typography>
                )}
              </CardContent>

              <CardActions>
                {!fb.acknowledged ? (
                  <Button size="small" color="primary" onClick={() => acknowledge(fb.id)}>
                    Acknowledge
                  </Button>
                ) : (
                  <Typography color="success.main" fontWeight="bold" fontSize="14px">
                    Acknowledged
                  </Typography>
                )}
              </CardActions>

              <Box px={2} pb={2}>
                <Box display="flex" gap={2} alignItems="center" mt={1}>
                  <TextField
                    placeholder="Your comment"
                    size="small"
                    fullWidth
                    value={comment[fb.id] || ''}
                    onChange={(e) =>
                      setComment({ ...comment, [fb.id]: e.target.value })
                    }
                  />
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={() => addComment(fb.id)}
                  >
                    Add Comment
                  </Button>
                </Box>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Employee;
