import { Button, Card, TableCell, TableRow } from "@mui/material";
import { styled } from "@mui/material/styles";

export const GlassCard = styled(Card)(() => ({
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
    },
}));

export const GradientButton = styled(Button)(({ gradient }) => ({
    background: gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: 600,
    padding: '12px 24px',
    borderRadius: '12px',
    textTransform: 'none',
    fontSize: '1rem',
    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.24)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'scale(1.02)',
        boxShadow: '0 12px 24px rgba(102, 126, 234, 0.36)',
    },
}));

export const StyledTableCell = styled(TableCell)(() => ({
    fontWeight: 600,
    padding: '16px',
    borderBottom: '2px solid #f0f2f5',
}));

export const StyledTableRow = styled(TableRow)(() => ({
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: 'rgba(102, 126, 234, 0.04)',
        cursor: 'pointer',
    },
}));
