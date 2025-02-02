const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const nodemailer=require("nodemailer")

exports.getProspects = onRequest(async (request, response) => {
    const {location,titles}=request.body;
    
  const url = `https://api.apollo.io/api/v1/mixed_people/search?person_titles[]=${titles}&person_locations[]=${location}&person_seniorities[]=`;
  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json',
      'x-api-key': 'JSqrgvwAWntLIDmLjb5Y6w'
    }
  };

  try {
    const result = await axios(url, options);
    logger.info('API response received', { data: result.data });
    response.json(result.data.people); // Send the API response to the client
  } catch (error) {
    logger.error('Error fetching data', { error: error });
    response.status(500).json({ error: 'Failed to fetch data' });
  }
});



exports.sendMail=onRequest(async(req,res)=>{
  const {email,subject,user_email,receiver_email,appPassword}=req.body
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // or 'STARTTLS'
    auth: {
      user: user_email,
      pass: appPassword

    }


  })
  const mailOptions = 
  {
    from: user_email,
    to: receiver_email,
    subject: subject,
    text: email,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response);
  }
  );
  res.json({message:"Email sent successfully",
           status:200
  })




    
})