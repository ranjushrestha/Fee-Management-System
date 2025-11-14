import axios from "axios";

export const API_BASE_URL = 'http://localhost:5000';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json'},
})

export function setAuthHeader(token) {
    if (token) {
        apiClient.defaults.headers.common.Authorization = `Bearer ${token}`
    } else {
        delete apiClient.defaults.headers.common.Authorization
        
    }
}