import axiosClient from "../api/axiosClient";

/** POST /auth/login — dùng ten_dang_nhap (username) */
export async function loginApi(username: string, password: string) {
  const response = await axiosClient.post("/auth/login", { username, password });
  return response.data;
}

/** POST /auth/register */
export async function registerApi(
  username: string,
  email: string,
  password: string,
  full_name?: string
) {
  const response = await axiosClient.post("/auth/register", {
    username,
    email,
    password,
    full_name,
  });
  return response.data;
}
