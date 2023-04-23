require("./config/db");

const express = require("express");
const app = express()
const port =  8000 || process.env.PORT;

const cors = require("cors");
const path = require('path');
app.use(cors());
app.set("view engine","ejs")
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')))
//for collecting post form data
const bodyParser = require('express').json;
app.use(bodyParser());
app.use(express.json());
app.use(express.urlencoded({extended:false}))

var nodemailer = require('nodemailer');

const bcrypt = require("bcrypt");
const User =  require("./models/User");
const jwt = require('jsonwebtoken');
const JWT_SECRET = "rfgvbhnjkml,;.';lkjhgftgyuijkolmjnhbgvtyuiop[]esl;kijuhygfgvhbjuygvbhjnkmnjhiknkljhyuytfrdfcgvhj";

app.post("/register", (req,res)=>{
    let{ firstname, lastname, email, password} = req.body;
    firstname = firstname.trim();
    lastname = lastname.trim();
    email = email.trim();
    password = password.trim();
    
    if(!firstname || !lastname || !email || !password){
        res.json({
            status:"FAILED",
            message:"Empty input field(s)"
        });
    }
    else if(!/^[a-zA-Z]+$/.test(firstname && lastname)){
        res.json({
            status:"FAILED",
            message:"Firstname and lastname must contain only letters"
        });
    }
    //email must be in the form of 
    else if(!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(email)){
        res.json({
            status:"FAILED",
            message:"Invalid email address"
        });
    }
    else if(password.length < 8){
        res.json({
            status:"FAILED",
            message:"Password must contain at least one uppercase, one lowercase, one number and must be at least 8 characters long"
        });
    }
    else{
        //check if user exists already
        User.find({email}).then(result =>{
            if(result.length){
                res.json({
                    status:"FAILED",
                    message:"User with the provided email already exists"
                });
            }
            else{
                //password hashing
                const hashNumber = 10;  
                bcrypt.hash(password, hashNumber).then(hash=>{
                    const newUser = new User({
                        firstname,
                        lastname,
                        email,
                        password:hash
                    });
                    return(
                    newUser.save().then(result=>{
                        res.json({
                            status:"SUCCESS",
                            message:"Sign up successful",
                            data:result
                        });
                    
                        // res.render('/');

                    })
                    ).catch(err=>{
                        res.json({
                            status:"FAILED",
                            message:"An error occurred while trying to create your account!"
                        });
                    });
                }).catch(err=>{
                    res.json({
                        status:"FAILED",
                        message:"An error occurred while hashing the password!"
                    });
                });
            }
        });
    }
    
});

app.post("/login",async (req,res)=>{
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: "User Not found" });
    }
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ email: user.email }, JWT_SECRET, {
        expiresIn: "15m",
      });
      if (res.status(201)) {
          console.log(token);
        return res.json({ 
            status:"SUCCESS",
             message:"Login successful",
            data:token
        });
      } else {
        return res.json({ error: "error" });
      }
    }
    res.json({ status: "error", error: "InvAlid Password" });
});

app.post("/userData", async (req,res)=>{
    const {token} = req.body;
    try{
        const user = jwt.verify(token, JWT_SECRET);
        console.log(user);
        const useremail = user.email;
        User.findOne({email:useremail})
        .then((data)=>{
            res.send({
                status:"ok",
            data:data
        })
        .catch(error  => {
            res.send({
                status:"error",
                data:error
            });
        })
    });
} catch(error){}
});

app.post("/passwordresetemail",async (req,res)=>{
    const {email} = req.body;
    try{
        const oldUser = await User.findOne({email});
        if(!oldUser){
            return res.json({status:"User Does Not Exist"});
        }else{
           
       const secret = JWT_SECRET + oldUser.password;
            const token = jwt.sign({email:oldUser.email, id:oldUser._id},secret,{
                expiresIn:"5m",
            });
            const link= `http://localhost:8000/passwordreset/${oldUser._id}/${token}`;
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'akinyosoyegodwin555@gmail.com',
                  pass: 'nezucydbhwyduycr'
                }
              });
              
              var mailOptions = {
                from: 'youremail@gmail.com',
                to: 'godwintobi125@gmail.com',
                subject: 'Password Reset Notification',
                text:link
              };
              
              transporter.sendMail(mailOptions, function(error, info){
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
           console.log(link);
        }
    }catch(error){
        console.log(error);
    }
})

app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
});
//password reset function


app.get("/passwordreset/:id/:token",async (req,res)=>{
    const {id,token} = req.params;
    console.log(req.params);

    const oldUser = await User.findOne({_id:id});
        if(!oldUser){
            return res.json({status:"User Does Not Exist"});
        }
        const secret = JWT_SECRET + oldUser.password;
        try{
            const verify = jwt.verify(token,secret);
            res.render("index",{ email: verify.email,status:"Not verified" })
        }catch(error){
            console.log(error);
            res.send("Not Verified");
        }

});
app.post("/passwordreset/:id/:token",async (req,res)=>{
    const {id,token} = req.params;
    const {password} = req.body;
    const oldUser = await User.findOne({_id:id});
        if(!oldUser){
            return res.json({status:"User Does Not Exist"});
        }
        const secret = JWT_SECRET + oldUser.password;
        try{
            const verify = jwt.verify(token,secret);
            const hashedPassword = await bcrypt.hash(password,10);
            await User.updateOne({
                _id:id,
            },
            {
            $set:{
                password: hashedPassword,
            }
            }
            )
            res.render("index",{ email: verify.email,status:"verified"})
            res.json("Password Updated Successfully");

        }catch(error){
            console.log(error);
            res.send("Something went wrong");
        }

});