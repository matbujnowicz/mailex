import React, { useEffect, useState } from "react";
import { useFirebase } from "../../firebase_context";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Snackbar, Alert, Typography } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { routes } from "../../app_router";
import { Box, TextField, OutlinedInput, InputAdornment, IconButton, Button, FormControl, InputLabel } from "@mui/material";
import { Visibility, VisibilityOff, AccountCircle } from "@mui/icons-material";
import { sendEmail } from "../../api/api";
const MarketingEmails = () => {
  const [emails, setEmails] = useState([]);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const { db, user } = useFirebase();

  // new states
  const [senderEmail, setSenderEmail] = useState(null)
  const [appPassword, setAppPassword] = useState(null)
  const [showPassword, setShowPassword] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate(routes.login);
    }

    const fetchMarketingData = async () => {
      const docRef = doc(db, "marketings", id);

      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
         // console.log(data)
          setEmails(data.emails);
          setName(data.name);
        } else {
          setError("Marketing not found");
         // console.log("No such document!");
        }
      } catch (error) {
        setError("Failed to fetch marketing data");
        console.error(error);
      }
    };

    fetchMarketingData();
  }, [user, db, navigate, id]);

  const handleSendEmails = async () => {
    setLoading(true);
  
    try {
      const docRef = doc(db, "marketings", id);
      const docSnap = await getDoc(docRef);
  
      if (!docSnap.exists()) {
        alert("No Email Found");
        setLoading(false);
        return;
      }
  
      const data = docSnap.data();
     // console.log("awkkkkk")
      //console.log(data.emails);
  
      const mailPrep = data.emails.map((item) => {
        return {
          to_email: item.lead.email,
          body: item.email,
          subject: `${item.lead.name}, A special message for you`,
          sender_mail: senderEmail,  // Replace with the correct sender email variable
          appPassword: appPassword, // Ensure this is correctly assigned
        };
      });
      
      console.log(mailPrep);
  
      // Send emails concurrently and wait for all to complete
      const responses = await Promise.allSettled(mailPrep.map((item) => sendEmail(item)));
  
      let num_mails_sent = 0;
      let num_mails_notsent = 0;

  
      responses.forEach((result) => {
        if (result.status === "fulfilled" && result.value.status === 200) {
          num_mails_sent++;
        } else {
          num_mails_notsent++;
        }
      });
     // console.log(num_mails_sent)
  
      // Show the result message
      alert(`Sent ${num_mails_sent} emails and failed to send ${num_mails_notsent} emails`);
    } catch (error) {
      console.error("Error sending emails:", error);
    }
  
    setLoading(false);
  };
  
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleMouseUpPassword = (event) => {
    event.preventDefault();
  };
 // console.log(emails);

  return (
    <Container component="main">
      {error && (
        <Snackbar
          open={true}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert
            onClose={() => setError(null)}
            severity="error"
            sx={{ width: "100%" }}
          >
            {error}
          </Alert>
        </Snackbar>
      )}
      <Container
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          style={{ marginTop: "5vh", marginBottom: "5vh" }}
        >
          {"AI generated emails for '" + name + "' Marketing"}
        </Typography>
        {emails.map((email, index) => (
          <Container
            key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              marginBottom: "2vh",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: 0,
            }}
          >
            <Container
              style={{
                display: "flex",
                paddingTop: "10px",
                justifyContent: "space-between",
                backgroundColor: "darkgrey",
              }}
            >
              <Typography variant="h6">{email.lead.name}</Typography>
              <Button
                variant="contained"
                color="primary"
                href={email.lead.linkedin_url}
                target="_blank"
                style={{ marginBottom: "1vh" }}
              >
                LinkedIn
              </Button>
            </Container>
            <Typography
              variant="body1"
              style={{ whiteSpace: "pre-wrap", padding: "10px" }}
            >
              {email.email}
            </Typography>
          </Container>
        ))}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            p: 4,
            maxWidth: 800,
            mx: "auto"
          }}
        >

          <Typography
            component="h3"
            variant="h5"
            style={{ marginTop: "5vh", marginBottom: "5vh", color: 'royalblue' }}
          >
            Email Campaign Dashboard
          </Typography>
          {/* Email & Password Container */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              width: "100%",
              justifyContent: "center"
            }}
          >
            {/* Email Input */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <AccountCircle sx={{ color: "action.active", fontSize: 48, mr: 1 }} />
              <TextField
                id="senderEmail"
                label="Email Address"
                variant="standard"
                onChange={(e) => { setSenderEmail((e.target.value)) }}
                sx={{ fontSize: 20, width: 250 }}
              />
            </Box>

            {/* Password Input with Label */}
            <FormControl sx={{ width: 250 }}>
              <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={showPassword ? "text" : "password"}
                label="Password"
                onChange={(e) => { setAppPassword(e.target.value) }}

                sx={{ fontSize: 20 }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
            </FormControl>
          </Box>

          {/* Send Button */}
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 3, width: "60%", fontSize: 18, py: 1 }}
            onClick={handleSendEmails}

            disabled={loading}
          >
            {loading ? "Loading..." : "SEND"}
          </Button>
        </Box>

      </Container>
    </Container>
  );
};

export default MarketingEmails;
