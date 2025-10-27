import axios from "axios";
const API = axios.create({ baseURL: "http://localhost:5050/api/auth" });

export const registerUser = (data) => API.post("/register", data);
export const loginUser = (data) => API.post("/login", data);
export const updateUser = (id, data) => API.put(`/update/${id}`, data);