import dotenv from "dotenv";
import {app} from "./app.js"
import ConnectDB from "./db/index.js";

dotenv.config({
    path: "../env"
});

ConnectDB()
// .then{
//     app.on("error",()=>{
//         console.log(error);    
//     })
//     app.listen(process.env.PORT,()=>{
//         console.log(`Server is running on port ${process.env.PORT}`);
//     })
// }
// .catch(error){
//     console.log(error);
// }
// app.get("/",(req,res)=>{
//     res.send("Hello World")
// });

// import express from "express";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// dotenv.config();
// import {DB_NAME} from "./constants.js";
// const app = new express();
// app.get("/",(req,res)=>{
//     res.send("Hello World");
// });
// //ifies
// ;( async()=>{
//     try {
//         const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)    
        
//         app.on("Error",(error)=>{
//             console.log("Err: ",error);    
//             throw error
//         })

//         app.listen(3000, () => {
//           console.log("Server is running on port 3000");    
//         });

//         console.log(
//           `MongoDB Connected Successfully...!!! \n DB HOST: ${connectionInstance.connection.host}`
//         );

//     } catch (error) {
//         console.error("ERROR: ", error);    
//         throw error
//     }
// })()