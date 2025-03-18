import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore=create((set,get)=>({
    messages:[],
    users:[],
    selectedUser:null,
    isUsersLoading:false,
    isMessageLoading:false,
    

    getUsers:async()=>{
        set({isUsersLoading:true});
        try {
            const res = await axiosInstance.get('/messages/users');
            set({users:res.data})
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isUsersLoading:false})
        }
    },
    getMessages:async(userId)=>{
        set({isMessageLoading:true});
        try {
            const res = await axiosInstance.get(`/messages/${userId}`);
            console.log(res.data.messages)
            //set({messages:res.data.messsages});
            set({ messages: Array.isArray(res.data.messages) ? res.data.messages: [] }); 
        } catch (error) {
            toast.error(error.response.data.message)
        }finally{
            set({isMessageLoading:false})
        }
    },
    sendMessage: async (messageData) => {
        const { selectedUser, messages } = get(); // Get current state
    
        if (!selectedUser || !selectedUser._id) {
            toast.error("No user selected");
            return;
        }
    
        try {
            const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
    
            if (!res || !res.data) {
                throw new Error("Invalid response from server");
            }
    
            console.log("res.data:", res.data);
    
            // Ensure messages is an array before updating state
            set({messages:[...messages,res.data]});
    
    
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error(error.response?.data?.message || "Failed to send message. Please try again.");
        }
    },
    subscribeToMessages:()=>{
       const {selectedUser}=get();
       if(!selectedUser) return;

       const socket=useAuthStore.getState().socket;
       
       socket.on("newMessage",(newMessage)=>{
        if(newMessage.senderId !== selectedUser._id) return;
        set({
            messages:[...get().messages,newMessage]
        })
       })
    },
    unsubscribeFromMessages:()=>{
     const socket =useAuthStore.getState().socket;
     socket.off("newMessage")
    },
    setSelectedUser:(selectedUser)=>set({selectedUser})
}))