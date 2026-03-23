'use client';

export const extractApiData = (response) => response?.data?.data ?? null;

export const extractApiMessage = (response, fallback = '') =>
  response?.data?.message || fallback;

export const getApiErrorMessage = (
  error,
  fallback = 'Something went wrong while talking to the backend.'
) =>
  error?.userMessage ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

export const isNetworkError = (error) =>
  error?.message === 'Network Error' || (!error?.response && !error?.status);
