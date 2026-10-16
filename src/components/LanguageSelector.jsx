import React, { useState } from 'react';
import i18n from "../i18n";
import {
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Typography,
    Tooltip,
    Chip,
    Box,
} from '@mui/material';
import {
    Translate as LanguageIcon,
    Check as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'hinglish', label: 'Hinglish', nativeName: 'Hinglish (बोलचाल)', flag: '🇮🇳' },
    { code: 'gu', label: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'mr', label: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
    { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', label: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', label: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
    { code: 'pa', label: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const currentCode = (i18n.language || 'en').split('-')[0];
    const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentCode) || SUPPORTED_LANGUAGES[0];

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelectLanguage = (code) => {
        i18n.changeLanguage(code);
        localStorage.setItem('app_language', code);
        handleClose();
    };

    return (
        <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <Tooltip title="Select Language / भाषा चुनें">
                <Chip
                    icon={<LanguageIcon sx={{ fontSize: 18, color: '#2563eb !important' }} />}
                    label={
                        <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            {currentLang.flag} {currentLang.nativeName}
                        </Typography>
                    }
                    onClick={handleClick}
                    variant="outlined"
                    size="small"
                    sx={{
                        cursor: 'pointer',
                        borderColor: '#cbd5e1',
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        px: 0.5,
                        height: 32,
                        '&:hover': {
                            borderColor: '#3b82f6',
                            bgcolor: 'rgba(59, 130, 246, 0.08)',
                        },
                    }}
                />
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        borderRadius: '14px',
                        mt: 1,
                        minWidth: 220,
                        maxHeight: 380,
                        overflowY: 'auto',
                        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12)',
                        border: '1px solid #e2e8f0',
                    },
                }}
            >
                <Box sx={{ px: 2, py: 1.2, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Choose Language (10 Languages)
                    </Typography>
                </Box>

                {SUPPORTED_LANGUAGES.map((lang, index) => {
                    const isSelected = currentLang.code === lang.code;
                    return (
                        <MenuItem
                            key={lang.code}
                            onClick={() => handleSelectLanguage(lang.code)}
                            selected={isSelected}
                            sx={{
                                py: 1,
                                px: 2,
                                borderBottom: index === 2 ? '1px dashed #e2e8f0' : 'none',
                                '&.Mui-selected': {
                                    bgcolor: 'rgba(37, 99, 235, 0.08)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32, fontSize: '1.2rem' }}>
                                {lang.flag}
                            </ListItemIcon>
                            <ListItemText
                                primary={lang.nativeName}
                                secondary={lang.label !== lang.nativeName ? lang.label : null}
                                primaryTypographyProps={{ fontSize: '0.88rem', fontWeight: isSelected ? 700 : 500 }}
                                secondaryTypographyProps={{ fontSize: '0.75rem', color: '#64748b' }}
                            />
                            {isSelected && <CheckIcon fontSize="small" sx={{ color: '#2563eb' }} />}
                        </MenuItem>
                    );
                })}
            </Menu>
        </Box>
    );
}