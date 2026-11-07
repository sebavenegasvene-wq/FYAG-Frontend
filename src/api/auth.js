import client from "./client";

export const login = (username, password) =>
  client.post("/login", { username, password }).then((r) => {
    localStorage.setItem("token", r.data.token);
    localStorage.setItem("refreshToken", r.data.refreshToken);
    return r.data;
  });

export const logout = () => localStorage.clear();
