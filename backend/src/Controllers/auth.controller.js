const userModel =require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs")

async function registerUser(req,res){
 const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
 const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
 const {password} = req.body;
 if(!username || !email || typeof password !== "string" || password.length < 6){
     return res.status(400).json({ message: "Username, email, and password are required" });
 }
 const role = req.body.role === 'artist' ? 'artist' : 'user';
 const isUserAlreadyExits = await userModel.findOne({
    $or:[
        {username},
        {email}

    ]
})
if(isUserAlreadyExits){
    return res.status(409).json({
        message: "User already exists"
    })
}
const hash = await bcrypt.hash(password,10)
const user  = await userModel.create({
    username,
    email,
    password:hash,
    role
})
const token = jwt.sign({
    id:user._id,
    role:user.role
},process.env.JWT_SECRET)
res.cookie("token",token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
})

res.status(201).json({
    message: "User created successfully",
    user:{
        id:user._id,
        username:user.username,
        email:user.email,
        role:user.role
    }
})


}


async function loginUser(req,res){
    const identifier = typeof req.body.username === "string"
        ? req.body.username.trim()
        : typeof req.body.email === "string" ? req.body.email.trim() : "";
    const {password} = req.body;
    if(!identifier || typeof password !== "string"){
        return res.status(401).json({ message: "Invalid credentials" });
    }
const user = await userModel.findOne({
    $or:[
        {username: identifier},
        {email: identifier},
        {email: identifier.toLowerCase()}
    ]
})

if(!user){
    return res.status(401).json({
        message: "Invalid credentials"
    })


}
let isPasswordValid = false;
if(typeof user.password === "string" && user.password.startsWith("$2")){
    isPasswordValid = await bcrypt.compare(password,user.password);
}else if(user.password === password){
    // Migrate legacy plaintext passwords after a successful login.
    user.password = await bcrypt.hash(password,10);
    await user.save();
    isPasswordValid = true;
}

if(!isPasswordValid){
    return res.status(401).json({
        message: "Invalid credentials"
    })
}
    const token = jwt.sign({
        id:user._id,
        role: user.role
    },process.env.JWT_SECRET)

    res.cookie("token",token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
    })

    res.status(200).json({
        message : "user logged in successfully",
        user:{
            id : user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    })


}


async function logoutUser(req,res){
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
    })
    res.status(200).json({
        message: "User logged out successfully"
    })
}
module.exports ={registerUser,loginUser,logoutUser};