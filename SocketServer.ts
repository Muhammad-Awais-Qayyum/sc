import {Server as SocketIOServer} from 'socket.io'
import http from 'http'


export const initSocketServer=(server:http.Server)=>{
    const io=new SocketIOServer(server)

    io.on("connection",(socket)=>{
        console.log(' A User Connnectd')

        // Listen for notification event from the frontend
        socket.on("notification",(data)=>(
            // BroadCast the notification data to all connected client (admin Dashbaord)
            io.emit('newNotification',data)
        ))

        socket.on('disconnect',()=>{
            console.log("A User disconneted")
        })
    })
}