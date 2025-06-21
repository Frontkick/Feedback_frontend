import axios from 'axios';
const API = axios.create({ baseURL: 'https://imaginative-sharline-hellfire-16382f1c.koyeb.app' });
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
// eslint-disable-next-line
export default {
  login: data => API.post('/auth/login', data).then(res => res.data),
  register: data => API.post('/auth/register', data),
  getEmployees: () => API.get('/feedback/employees').then(res => res.data),
  getTeamOverview: () => API.get('/feedback/team-overview').then(res => res.data),
  getFeedbackGiven: () => API.get('/feedback/given').then(res => res.data),
  createFeedback: data => API.post('/feedback/', data).then(res => res.data),
  getMyFeedback: () => API.get('/user/feedback').then(res => res.data),
  acknowledge: id => API.put(`/feedback/${id}/acknowledge`),
  addComment: (id, data) => API.put(`/feedback/${id}/comment`, data),
  updateFeedback: (id, data) => API.put(`/feedback/${id}`, data).then(res => res.data)
};