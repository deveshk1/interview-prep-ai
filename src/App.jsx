import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box
} from "@mui/material";

function App() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");

  const generateGuide = () => {
    console.log({
      company,
      role,
      experience
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          AI Interview Preparation Guide
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          Enter company details and generate a personalized interview roadmap.
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <TextField
            label="Company Name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            fullWidth
          />

          <TextField
            label="Role / Designation"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            fullWidth
          />

          <TextField
            label="Years of Experience"
            type="number"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            fullWidth
          />

          <Button
            variant="contained"
            size="large"
            onClick={generateGuide}
          >
            Generate Guide
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default App;