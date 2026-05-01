import { Card, CardContent, Box, Typography } from "@mui/material";
import { ReactNode } from "react";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";

interface Props {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color?: string;
}

export function StatCard({ icon, label, value, sub, trend, color = "#1A56DB" }: Props) {
  const positive = (trend ?? 0) >= 0;
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${color}22`,
              color,
            }}
          >
            {icon}
          </Box>
          {trend !== undefined && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: positive ? "success.main" : "error.main",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {positive ? <TrendingUpIcon sx={{ fontSize: 14 }} /> : <TrendingDownIcon sx={{ fontSize: 14 }} />}
              {Math.abs(trend)}%
            </Box>
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {sub && (
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 1 }}>
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
