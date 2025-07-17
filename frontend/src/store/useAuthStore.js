import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check-auth");
      set({
        authUser: res?.data,
        isCheckingAuth: false,
      });
      get().connectSocket();
    } catch (error) {
      console.log("Error checking authentication:", error);
      set({
        authUser: null,
        isCheckingAuth: false,
      });
    }
  },
  signup: async (formData) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", formData);
      toast.success("Account created successfully!");
      console.log("Signup response:", res);
      set({
        authUser: res?.data,
        isSigningUp: false,
      });
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      console.log("Error signing up:", error);
      set({ isSigningUp: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully!");
      get().disconnectSocket();
    } catch (error) {
      console.log("Error logging out:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },
  login: async (formData) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", formData, {
        withCredentials: true,
      });
      toast.success("Logged in successfully!");
      console.log("Login response:", res);
      set({
        authUser: res?.data,
        isLoggingIn: false,
      });
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      console.log("Error logging in:", error);
      set({ isLoggingIn: false });
    }
  },
  updateProfile: async (formData) => {
    try {
      set({ isUpdatingProfile: true });
      const res = await axiosInstance.post("/auth/update-profile", formData);
      toast.success("Profile updated successfully!");
      console.log("Update profile response:", res);
      set((state) => ({
        authUser: { ...state.authUser, ...res?.data },
        isUpdatingProfile: false,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
      console.log("Error updating profile:", error);
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get();

    if (!authUser || get().socket?.connected) return;

    console.log(authUser, "authUserauthUserauthUserauthUser");

    const socket = io(BASE_URL, {
      query: {
        userId: authUser?.user?._id,
      },
    });
    socket.connect();
    console.log("Socket connected:", socket.id);
    set({ socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
  disconnectSocket: () => {
    if (get()?.socket?.connected) {
      get().socket.disconnect();
      console.log("Socket disconnected");
    }
  },
}));
