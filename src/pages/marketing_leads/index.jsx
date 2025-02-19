import React, { useEffect, useState } from "react";
import { useFirebase } from "../../firebase_context";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Container,
  Snackbar,
  Alert,
  Typography,
  Button,
} from "@mui/material";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { routes } from "../../app_router";
import { getEmail } from "../../api/api";

const MarketingLeads = () => {
  const [leads, setLeads] = useState([]);
  const [name, setName] = useState("");
  const [offer, setOffer] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const { db, user } = useFirebase();

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
          setLeads(data.leads);
          setName(data.name);
          setOffer(data.offer);
        } else {
          setError("Marketing not found");
          console.log("No such document!");
        }
      } catch (error) {
        setError("Failed to fetch marketing data");
        console.error(error);
      }
    };

    fetchMarketingData();
  }, [user, db, navigate, id]);

  const [selected, setSelected] = useState([]);

  const handleSelect = (event, index) => {
    const selectedIndex = selected.indexOf(index);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, index);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (index) => selected.indexOf(index) !== -1;

  const handleEmailGeneration = async () => {
    setLoading(true);
    setError(null);
  
    try {
      const emails = await Promise.all(
        selected.map(async (index) => ({
          lead: leads[index],
          email: await generateEmail(leads[index]), // Ensure async handling
        }))
      );
  
      const docRef = doc(db, "marketings", id);
      await updateDoc(docRef, { emails });
  
      navigate(routes.marketingEmails.replace(":id", id));
    } catch (error) {
      setError("Failed to generate emails");
      console.error("Email generation error:", error);
    } finally {
      setLoading(false);
    }
  };
  
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
          {"Leads for '" + name + "' Marketing"}
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selected.length > 0 && selected.length < leads.length
                    }
                    checked={
                      leads.length > 0 && selected.length === leads.length
                    }
                    onChange={(event) => {
                      if (event.target.checked) {
                        const newSelecteds = leads.map((_, index) => index);
                        setSelected(newSelecteds);
                        return;
                      }
                      setSelected([]);
                    }}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Organization</TableCell>
                <TableCell>LinkedIn</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>City</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leads.map((lead, index) => {
                const isItemSelected = isSelected(index);
                return (
                  <TableRow
                    key={index}
                    hover
                    onClick={(event) => handleSelect(event, index)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={isItemSelected} />
                    </TableCell>
                    <TableCell>{lead.name}</TableCell>
                    <TableCell>{lead.organization_name}</TableCell>
                    <TableCell>{lead.linkedin_url}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.country}</TableCell>
                    <TableCell>{lead.city}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <Button
          variant="contained"
          color="primary"
          disabled={selected.length === 0 || loading}
          onClick={handleEmailGeneration}
          style={{ marginTop: "5vh" }}
        >
          {loading ? "Loading..." : "GENERATE EMAILS"}
        </Button>
      </Container>
    </Container>
  );
};

export default MarketingLeads;

// mock hardcoded mail
const generateEmailold = (lead, offer) => {
  return `Dear ${lead.name}, \nWe saw your linked in post. We are interested in your profile. We offer: ${offer}. \nBest regards, \nYour future employer`;
};

// {lead.name}
// {lead.organization_name}
// {lead.linkedin_url}
// {lead.email}
// {lead.country}
// {lead.city}



const generateEmail = async (lead) => {

  const data={
    linkedinURL:lead.linkedin_url,
    sender_name:"John cron",
    sender_details:"CEO at mailex, expertise in digitall marketing "

  }
  try {
    const completeMail= await getEmail(data)
    console.log(completeMail)
    // replace <br> to \n
    const mail=completeMail.data.body.replace(/<br>/g, "\n")
    

    return mail
  } catch (error) {
    console.log(error);
    
  }
  

  };