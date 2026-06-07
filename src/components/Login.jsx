import { Button, Box, Typography } from "@mui/material";
import { supabase } from "../lib/supabase";

export default function Login() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo:
          "https://deveshk1.github.io/interview-prep-ai/"
      }
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 3,
      }}
    >
      <Typography variant="h3">
        Interview Prep AI
      </Typography>

      <Typography variant="body1">
        Sign in with GitHub to continue
      </Typography>

      <Button
        variant="contained"
        size="large"
        onClick={signIn}
      >
        Continue with GitHub
      </Button>
    </Box>
  );
}