import express from 'express' 
import http  from 'http'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import axios from 'axios'
dotenv.config()

let app = express()
app.use(express.json())

const server = http.createServer(app)
const port = process.env.PORT 

const io = new Server(server,{
    cors:{
         origin: [
      "https://grocify-delivery.vercel.app", 
      "http://localhost:3000" 
    ],
    }
})

io.on('connection',(socket)=>{
    console.log('user connected',socket.id)

    socket.on('identity',async(userId)=>{
        try {
            await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/connect`,{userId,socketId:socket.id})
        } catch (error) {
            console.error('Error in identity:', error.message)
        }
    })
    socket.on('updateLocation',async({userId,latitude,longitude})=>{
         console.log(userId,longitude,latitude)
         const location ={
            type:"Point",
            coordinates:[longitude,latitude]
         }
         await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/update-location`,{userId,location})
    io.emit('update-deliveryboy-location',{userId,location})

    })

    socket.on('join-room',async(roomId)=>{
        console.log('join room with',roomId)
        socket.join(roomId)
    })

    socket.on('send-message',async(message)=>{
        console.log(message)
        await axios.post(`${process.env.NEXT_BASE_URL}/api/chat/save`,message)
        io.to(message.roomId).emit('send-message',message)
    })
    socket.on("disconnect",()=>{
        console.log('user disconnected',socket.id)
    })

})
app.post('/notify',(req,res)=>{
    const {event,data,socketId} = req.body
    if(socketId){
        io.to(socketId).emit(event,data)
    }else{
        io.emit(event,data)
    }
    return res.status(200).json({success:true})
})

server.listen(port,()=>{
    console.log("server started at",port)
})
