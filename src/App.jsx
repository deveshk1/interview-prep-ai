import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box
} from "@mui/material";

import ReactMarkdown from "react-markdown";

import { generateInterviewGuide } from "./services/interviewService";
import Login from "./components/Login";
import { supabase } from "./lib/supabase";

function App() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");

  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const generateGuide = async () => {
    setLoading(true);

    try {
      const guide =
        await generateInterviewGuide(
          company,
          role,
          experience
        );

      setResult(guide);

    } catch (err) {
      console.error(err);
      setResult("Error generating guide");
    }

    setLoading(false);
  };

  if (session === undefined) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          AI Interview Preparation Guide
        </Typography>

        <Typography
          variant="body2"
          sx={{ mb: 2 }}
        >
          Logged in as {session.user.email}
        </Typography>

        <Typography
          variant="body1"
          sx={{ mb: 3 }}
        >
          Enter company details and generate a personalized interview roadmap.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3
          }}
        >
          <TextField
            label="Company Name"
            value={company}
            onChange={(e) =>
              setCompany(e.target.value)
            }
            fullWidth
          />

          <TextField
            label="Role / Designation"
            value={role}
            onChange={(e) =>
              setRole(e.target.value)
            }
            fullWidth
          />

          <TextField
            label="Years of Experience"
            type="number"
            value={experience}
            onChange={(e) =>
              setExperience(e.target.value)
            }
            fullWidth
          />

          <Button
            variant="contained"
            size="large"
            onClick={generateGuide}
            disabled={loading}
          >
            {loading
              ? "Generating..."
              : "Generate Guide"}
          </Button>

          {result && (
            <Paper
              sx={{
                mt: 4,
                p: 3
              }}
            >
              <ReactMarkdown>
                {result}
              </ReactMarkdown>
            </Paper>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default App;