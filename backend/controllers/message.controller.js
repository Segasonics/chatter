import User from "../models/user.model.js";
import Message from '../models/message.model.js'
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar =async(req,res)=>{
       try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id:{$ne:loggedInUserId}}).select("-password"); //find all users except the present loggedInUser

        res.status(200).json(filteredUsers)
       } catch (error) {
        console.error("Error in getUsersSideBar:",error.message);
        res.status(500).json({error:"Internal server error"});
       }
}

export const getMessages=async(req,res)=>{
    try {
        const {id:userToChatId}=req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId:myId, receiverId:userToChatId},
                {senderId:userToChatId, receiverId:myId}
            ]
        })

        return res.status(200).json({messages})
    } catch (error) {
        console.error("Error in getMessages:",error.message);
        res.status(500).json({error:"Internal server error"});
    }
}

export const sendMessage=async(req,res)=>{
   try {
    const {text,image}=req.body;
    const {id:receiverId}=req.params;
    const senderId = req.user._id;

    let imageUrl;
    if(image){
        const uploadResponse= await cloudinary.uploader.upload(image);
        imageUrl =uploadResponse.secure_url
    };

    const newMessage = new Message({
        senderId,
        receiverId,
        image:imageUrl,
        text
    });

    await newMessage.save();

    //todo:real time functionality with socket.io
    //when we send a message we saved it to the data base and send it to the user in real time
    const receiverSocketId = getReceiverSocketId(receiverId);

    if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage",newMessage)
    }

    res.status(200).json(newMessage)
   } catch (error) {
        console.error("Error in sendMessages:",error.message);
        res.status(500).json({error:"Internal server error"});
   }
}