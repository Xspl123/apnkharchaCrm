import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
    Drawer, List, ListItemButton, ListItemIcon, ListItemText,
    Box, Typography, Collapse, Divider, Avatar, Stack,
    Tooltip,
} from "@mui/material";
import {
    Category, ExpandLess, ExpandMore,
    Circle as DotIcon,
} from "@mui/icons-material";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import { useNavigate, useLocation } from "react-router-dom";
import usePermission from "../hooks/usePermission";
import { useSelector } from "react-redux";
import { getSidebarSections, getStandaloneSidebarRoutes } from "../config/appRoutes";
import "./Sidebar.css";

const DRAWER_WIDTH    = 260;
const COLLAPSED_WIDTH = 72;
const EMPTY_COMPANIES = [];

export default function Sidebar({ open, toggleSidebar, isMobile }) {
    const navigate   = useNavigate();
    const location   = useLocation();
    const [openMenus, setOpenMenus] = useState({});

    const permissionApi = usePermission();
    const { user }      = useSelector((s) => s.auth);
    const organisation  = useSelector((s) => s.orgs?.organisation);
    const companies     = useSelector((s) => s.companies?.companies || EMPTY_COMPANIES);

    const standaloneRoutes = getStandaloneSidebarRoutes(permissionApi, user);
    const groupedSections  = getSidebarSections(permissionApi, user);
    const activeSectionKeys = groupedSections
        .filter((section) => section.children.some(
            (child) => location.pathname === child.path || location.pathname.startsWith(child.path + '/')
        ))
        .map((section) => section.key)
        .join('|');

    const primaryCompany = companies[0];
    const brandLogo      = primaryCompany?.logo_url || organisation?.logo || "";
    const brandName      = primaryCompany?.company_name || organisation?.name || "Apna Kharcha Services";

    const handleToggle = useCallback((key) => {
        setOpenMenus((p) => ({ ...p, [key]: !p[key] }));
    }, []);

    // Auto-open active section
    useEffect(() => {
        if (!activeSectionKeys) return;

        const updates = activeSectionKeys
            .split('|')
            .filter(Boolean)
            .reduce((acc, key) => ({ ...acc, [key]: true }), {});

        setOpenMenus((prev) => {
            const hasChanges = Object.entries(updates).some(([key, value]) => prev[key] !== value);
            return hasChanges ? { ...prev, ...updates } : prev;
        });
    }, [activeSectionKeys]);

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const itemSx = (active, nested) => ({
        mx: 1, mb: 0.3,
        px: open ? (nested ? 2.5 : 1.5) : 1.2,
        py: 0.9,
        borderRadius: '10px',
        justifyContent: open ? 'initial' : 'center',
        color: active ? '#1e3a8a' : '#475569',
        bgcolor: active ? '#eff0ffff' : 'transparent',
        borderLeft: active && open ? '3px solid #3b82f6' : '3px solid transparent',
        transition: 'all 0.15s',
        '&:hover': { bgcolor: active ? '#093d82ff' : '#f8fafc', color: active ? "#fff" : '#1e3a8a' },
        '& .MuiListItemIcon-root': {
            minWidth: open ? 36 : 'auto',
            color: active ? '#3b82f6' : '#334155',
        },
        '& .MuiListItemText-primary': {
            fontSize: nested ? '0.88rem' : '0.92rem',
            fontWeight: active ? 700 : 500,
        },
    });

    const renderBtn = (route, nested = false) => {
        const active = isActive(route.path);
        const btn = (
            <ListItemButton key={route.key} onClick={() => { navigate(route.path); if (isMobile) toggleSidebar(); }}
                sx={itemSx(active, nested)}>
                <ListItemIcon>{route.icon || <Category />}</ListItemIcon>
                {open && <ListItemText primary={route.label} />}
                {open && active && (
                    <DotIcon className="app-sidebar__active-dot" />
                )}
            </ListItemButton>
        );
        return !open ? (
            <Tooltip key={route.key} title={route.label} placement="right" arrow>
                {btn}
            </Tooltip>
        ) : btn;
    };

    return (
        <Drawer variant={isMobile ? 'temporary' : 'permanent'}
            open={open} onClose={toggleSidebar}
            className="app-sidebar__drawer"
            sx={{
                width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: open ? DRAWER_WIDTH : COLLAPSED_WIDTH,
                    bgcolor: '#ffffff',
                    borderRight: '1px solid #e2e8f0',
                    boxShadow: '2px 0 12px rgba(15,23,42,0.04)',
                    transition: 'width 0.25s ease',
                    overflowX: 'hidden',
                },
            }}>

            {/* ── Brand ───────────────────────────────────── */}
            <Box className={`app-sidebar__brand ${open ? "app-sidebar__brand--open" : "app-sidebar__brand--closed"}`}>
                {brandLogo ? (
                    <Box component="img" src={brandLogo} alt={brandName}
                        className="app-sidebar__brand-logo" />
                ) : (
                    <Box className="app-sidebar__brand-fallback">
                        <MonetizationOnIcon className="app-sidebar__brand-fallback-icon" />
                    </Box>
                )}
                {open && (
                    <Box className="app-sidebar__brand-copy">
                        <Typography variant="subtitle2" className="app-sidebar__brand-name" noWrap>
                            {brandName}
                        </Typography>
                        <Typography variant="caption" className="app-sidebar__brand-plan">
                            {user?.organisation?.plan === 'premium' ? '✦ Enterprise' :
                             user?.organisation?.plan === 'basic'   ? '✦ Starter'    : 'Personal'}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── User Card ────────────────────────────────── */}
            {open && (
                <Box className="app-sidebar__user">
                    <Stack direction="row" spacing={1.2} alignItems="center">
                        <Avatar className="app-sidebar__user-avatar">
                            {user?.name?.charAt(0)}
                        </Avatar>
                        <Box className="app-sidebar__user-copy">
                            <Typography variant="body2" className="app-sidebar__user-name" noWrap>
                                {user?.name}
                            </Typography>
                            <Typography variant="caption" className="app-sidebar__user-role" noWrap>
                                {user?.role?.label || user?.user_type || 'User'}
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            )}

            {/* ── Nav Items ────────────────────────────────── */}
            <Box className="app-sidebar__scroll">
                <List disablePadding>
                    {standaloneRoutes.map((r) => renderBtn(r))}

                    {open && standaloneRoutes.length > 0 && <Divider className="app-sidebar__divider" />}

                    {groupedSections.map((section) => {
                        const isOpen   = openMenus[section.key] || false;
                        const anyActive = section.children.some((c) => isActive(c.path));

                        return (
                            <React.Fragment key={section.key}>
                                {open && (
                                    <Typography variant="overline"
                                        className="app-sidebar__section-label">
                                        {section.label}
                                    </Typography>
                                )}

                                {!open ? (
                                    <Tooltip title={section.label} placement="right" arrow>
                                        <ListItemButton onClick={() => handleToggle(section.key)}
                                            sx={itemSx(anyActive, false)}>
                                            <ListItemIcon>{section.icon}</ListItemIcon>
                                        </ListItemButton>
                                    </Tooltip>
                                ) : (
                                    <ListItemButton onClick={() => handleToggle(section.key)}
                                        sx={itemSx(anyActive, false)}>
                                        <ListItemIcon>{section.icon}</ListItemIcon>
                                        <ListItemText primary={section.label} />
                                        {isOpen ? <ExpandLess className="app-sidebar__toggle-icon" />
                                                : <ExpandMore className="app-sidebar__toggle-icon" />}
                                    </ListItemButton>
                                )}

                                <Collapse in={open ? isOpen : false} timeout="auto" unmountOnExit>
                                    <List disablePadding className="app-sidebar__nested-list">
                                        {section.children.map((r) => renderBtn(r, true))}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        );
                    })}
                </List>
            </Box>

            {/* ── Footer ───────────────────────────────────── */}
            {open && (
                <Box className="app-sidebar__footer">
                    <Typography variant="caption" className="app-sidebar__footer-text">
                        © {new Date().getFullYear()} {brandName}
                    </Typography>
                </Box>
            )}
        </Drawer>
    );
}

Sidebar.propTypes = {
    open:          PropTypes.bool.isRequired,
    toggleSidebar: PropTypes.func.isRequired,
    isMobile:      PropTypes.bool.isRequired,
};
