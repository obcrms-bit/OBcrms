import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

export const getFullProfile = async (id: string, type: 'lead' | 'student') => {
  const res = await api.get(`/client-profile/${id}?type=${type}`);
  return res.data;
};

export const generateCourseRecommendations = async (id: string, type: 'lead' | 'student') => {
  const res = await api.get(`/course-ai/${id}/generate?type=${type}`);
  return res.data;
};

export const getCourseRecommendations = async (id: string, type: 'lead' | 'student') => {
  const res = await api.get(`/course-ai/${id}?type=${type}`);
  return res.data;
};

export const toggleCourseShortlist = async (recommendationId: string, isShortlisted: boolean) => {
  const res = await api.patch(`/course-ai/recommendation/${recommendationId}/shortlist`, { isShortlisted });
  return res.data;
};

export const addProfileNote = async (id: string, type: 'lead' | 'student', content: string, isInternal: boolean = true) => {
  const res = await api.post(`/client-profile/${id}/notes?type=${type}`, { content, isInternal });
  return res.data;
};

export const addCallLog = async (id: string, type: 'lead' | 'student', payload: any) => {
  const res = await api.post(`/client-profile/${id}/calls?type=${type}`, payload);
  return res.data;
};

export const addOfficeVisit = async (id: string, type: 'lead' | 'student', payload: any) => {
  const res = await api.post(`/client-profile/${id}/visits?type=${type}`, payload);
  return res.data;
};

export const updateProfileData = async (id: string, type: 'lead' | 'student', payload: any) => {
  const res = await api.put(`/client-profile/${id}?type=${type}`, payload);
  return res.data;
};
