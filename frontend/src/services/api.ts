import axios from 'axios';

// Ensure we're using the correct backend URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

console.log('API Configuration:', {
  API_BASE,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE
});

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add request interceptor to log requests
api.interceptors.request.use(request => {
  console.log('API Request:', {
    method: request.method?.toUpperCase(),
    url: `${request.baseURL}${request.url}`,
    data: request.data,
  });
  return request;
});

// Add response interceptor to log responses
api.interceptors.response.use(
  response => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    });
    return response;
  },
  error => {
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export async function getConversations() {
  const res = await api.get('/conversation/list');
  return res.data;
}

export async function getConversationMessages(conversationId: string) {
  const res = await api.get(`/chat/${conversationId}`);
  return res.data;
}

export async function deleteConversation(conversationId: string) {
  return api.delete(`/conversation/${conversationId}`);
}

export async function renameConversation(conversationId: string, newTitle: string) {
  return api.patch(`/conversation/${conversationId}/rename`, { newTitle });
}

export async function getConversationPDF(conversationId: string) {
  return api.get(`/conversation/${conversationId}/pdf`, { responseType: 'blob' });
}

export async function getConversationDetails(conversationId: string) {
  const { data } = await api.get(`/conversation/${conversationId}/details`);
  return data;
}

export async function uploadPDF(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function sendChatMessage(conversationId: string, question: string) {
  const res = await api.post(`/chat/${conversationId}`, { question });
  return res.data;
}

export async function getConversationSummary(conversationId: string) {
  const res = await api.get(`/conversation/${conversationId}/summary`);
  return res.data;
}

export async function generateConversationSummary(conversationId: string) {
  const res = await api.post(`/conversation/${conversationId}/summary/generate`);
  return res.data;
} 