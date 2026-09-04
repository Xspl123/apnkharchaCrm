import { Card, CardContent, Typography, Box } from "@mui/material";

const KpiCard = ({ title, value, icon, color }) => {
  return (
    <Card
      sx={{
        backdropFilter: "blur(10px)",
        background: "rgba(255,255,255,0.75)",
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
        transition: "all 0.3s ease",
        borderRadius: 3,
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
        },
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>

            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              backgroundColor: color,
              color: "#fff",
              borderRadius: "50%",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default KpiCard;
