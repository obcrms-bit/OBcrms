import { studentAPI } from './api';

// Fetch all students with pagination and search
export const getStudents = async (page = 1, limit = 10, search = '') => {
  try {
    const response = await studentAPI.getAllStudents(page, limit, search);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get single student by ID
export const getStudentById = async (id) => {
  try {
    const response = await studentAPI.getStudentById(id);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create new student
export const createStudent = async (studentData) => {
  try {
    const response = await studentAPI.createStudent(studentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update student
export const updateStudent = async (id, studentData) => {
  try {
    const response = await studentAPI.updateStudent(id, studentData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete student
export const deleteStudent = async (id) => {
  try {
    const response = await studentAPI.deleteStudent(id);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Assign counselor to student
export const assignCounselor = async (studentId, counselorId) => {
  try {
    const response = await studentAPI.assignCounselor(studentId, counselorId);
    return response.data;
  } catch (error) {
    throw error;
  }
};
