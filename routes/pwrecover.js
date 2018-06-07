const express    = require("express"),
      crypto     = require("crypto"),
      nodemailer = require("nodemailer");      

const User= require("../models/user");
const router= express.Router();


//Password recovery
router.get("/forgot", (req, res) => {
	res.render("forgot");
});

router.post("/forgot", async (req, res, next) => {

    try{
        const resolvedPromise= await Promise.all([
                                            generateToken(),
                                            User.findOne({email: req.body.email})
                                        ]);

        const token = resolvedPromise[0];
        const handleUser= resolvedPromise[1];                                 
        console.log(token);
        console.log(handleUser);

        const mailOptions= {
            to: handleUser.email,
            from: process.env.NODEMAILER_EMAIL,
            subject: 'YelpCamp Password Recovery',
            text: `You are receiving this email because you (or someone else) have requested the reset of the password
                Please Click the following link below, or copy and paste it into your browser to reset your password
                \n\n http://${req.headers.host}/reset/${token}  \n\n
                If you did not request this, please ignore this mail and your password  will remain unchanged`
        };

        handleUser.resetPasswordToken= token;
        handleUser.resetPasswordExpires= Date.now()+3600000;// +1 Hour
                    
        handleUser.save((err) => {
            if(err){
                console.log(err);
            }else{
				sendMailOut(mailOptions);
				req.flash("success", "You got an Email with Password recovery Information!");
				res.redirect("/forgot");
            }
        });
    }catch(err){
        console.log(`REACHED CATCH BLOCK. RESPONSE: ${err}`);
    }

});

router.get("/reset/:token", (req, res) => {
	User.findOne({
		resetPasswordToken: req.params.token, 
		resetPasswordExpires: { $gt: Date.now() }
	}, (err, foundUser) => {
		if(!foundUser){
			req.flash("error", "Password reset token is invalid or has expired!");
			return res.redirect("/forgot");
		}
		res.render('reset', {token: req.params.token});
	});
});

router.post("/reset/:token", (req, res) => {
	
	User.findOne({
		resetPasswordToken: req.params.token,
		resetPasswordExpires: { $gt: Date.now()}
	}, (err, foundUser) => {
		if(!foundUser){
			req.flash("error", "Token is invalid or has expired");
			return res.redirect("back");
		}
		if(req.body.newPassword === req.body.confirmPassword){
			foundUser.setPassword(req.body.newPassword, (err) => {
				const mailOptions= {
					to: foundUser.email,
					from: process.env.NODEMAILER_EMAIL,
					subject: 'Your password has been changed for YelpCamp',
					text: `You reseted your password successfully. Have fun at
						\n\n http://${req.headers.host}/login  \n\n`
				};
				foundUser.resetPasswordToken= undefined;
				foundUser.resetPasswordExpires= undefined;

				foundUser.save((err) => {
					req.logIn(foundUser, (err) => {
						if(err){
							console.log(`ERROR in req.logIn. RESPONSE: ${err}`);
						}else{
							req.flash("success", `Password successfully changed!! ${foundUser.username} have a nice day!!`);
							res.redirect('/campgrounds');
						}
					});
				});
				
				sendMailOut(mailOptions);
						
			});
		}else{
			req.flash("error", "Passwords do not match");
			return res.redirect("back");
		}
	});
		
});

const generateToken = async () => {
    console.log("in generate token");
    let token= crypto.randomBytes(20);  // Synchron version

    return token.toString('hex');
}

const sendMailOut= (mailOptions) => {
    const smtpTransport= nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASS
        }
    });

    smtpTransport.sendMail(mailOptions, (err) => {
        if(err){
            console.log(err);
            return { status: 500,
                text: err
            };   
        }else{
            console.log('mail sent');
            return { status: 200,
                     text: "mail sent"
            };  
        }
    });
}

module.exports= router;