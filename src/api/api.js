import axios from 'axios';

const getProspects = async (locations, keywords, positions) => {
  const body = {
    locations: locations,
    keywords: keywords,
    positions: positions,
  };

  return await axios.post(`${process.env.REACT_APP_FUNCTIONS_URL}/getProspects`, body);
};

const getEmail = async (lead) => {
  const body ={
    linkedinURL:lead.linkedinURL,
    sender_name:"John cron",
    sender_details:"CEO at mailex, expertise in digitall marketing "
}
  // const mockMail="Hi Gary,<br><br>I hope this finds you well! I've long admired your thoughtful and innovative approach in navigating the rapidly changing digital landscape. The breadth and depth of the industries you've chosen to invest in, from Facebook to Major League Pickleball, is a testament to your forward-thinking.<br><br>Just recently came across your LinkedIn post about the SlamBall League revival, and I couldn't have been more impressed. Your knack for identifying trends and then capitalizing on them never fails to inspire.<br><br>As the CEO of mailex, I find myself constantly learning from your strategies, insights and acumen. I'd love the opportunity to connect over a brief call and listen to your thoughts on how businesses can better adapt to the ever-evolving demands of consumer attention.<br><br>I'm looking forward to your response; just a phrase or two from you would make my day!<br><br>Take care,<br><br>John Cron<br>CEO, mailex<br>Expertise in Digital Marketing"
  // return mockMail
  return await axios.post(`${process.env.REACT_APP_FUNCTIONS_URL}/generateMail`, body);
};
const sendEmail = async (email_info) => {
  const body = {
    email: email_info.body, // Email content
    subject: email_info.subject, // Email subject
    user_email: email_info.sender_mail, // Sender's email from environment variables
    receiver_email: email_info.to_email, // Recipient's email
    appPassword: email_info.appPassword, // App password for authentication
  };

  try {
    const response = await axios.post(`${process.env.REACT_APP_FUNCTIONS_URL}/sendMail`, body);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    return error.response || { status: 500, message: "Unknown error" };
  }
};

export { getProspects, getEmail, sendEmail };

