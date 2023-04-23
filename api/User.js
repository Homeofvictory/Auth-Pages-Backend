const express = require("express");
const router = express.Router();

//connect user model


//hash password

const bcrypt = require("bcrypt");
const User =  require("../models/User");


router.post("/register", (req,res)=>{
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
                    newUser.save().then(result=>{
                        res.json({
                            status:"SUCCESS",
                            message:"Sign up successful",
                            data:result
                        });
                        res.render('/');

                    }).catch(err=>{
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

router.post("/login", (req,res)=>{
    //implementation for signin endpoint
    let{ email, password} = req.body;
    email = email.trim();
    password = password.trim();

    if(!email || !password){
        res.json({
            status:"FAILED",
            message:"Empty input field(s)"
        })
    }else{
    User.find({email}).then(data =>{
        if(data.length){
            const hash = data[0].password;
            bcrypt.compare(password, hash).then(result=>{
                if(result){
                    res.json({
                        status:"SUCCESS",
                        message:"Sign in successful",
                        data:data
                    })
                    res.render('/api/login');
                }else{
                    res.json({
                        status:"FAILED",
                        message:"Invalid password"
                    })
                }
        }).catch(err=>{
            res.json({
                status:"FAILED",
                message:"An error occurred while comparing the password!"
            })
        })
    }else{
        res.json({
            status:"FAILED",
            message:"Invalid credentials"
        })
    }

}).catch(err=>{
    res.json({
        status:"FAILED",
        message:"An error occurred while checking for existing user..check email!"
        })
        });
    }
});

module.exports = router;