import { API_URL as ENV_API_URL } from '@env';

console.log('ENV_API_URL:', ENV_API_URL);
export const API_URL = ENV_API_URL || 'http://localhost:5000';
