import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    IconButton, Badge, Tooltip, Popover, Box, Typography, Stack,
    Chip, Divider, Button,
} from '@mui/material';
import { NotificationsActive as NotifIcon } from '@mui/icons-material';
import { getDueFollowUps, getNewWebLeads } from '../state/leadSlice';
import { isCrmEnabled } from '../../../config/moduleConfig';

// Refresh due/overdue follow-ups and new web leads periodically so the bell
// stays accurate even if the user never opens the Lead List page.
const POLL_INTERVAL_MS = 5 * 60 * 1000;

const NOTIFIED_FOLLOWUPS_KEY = 'crm_notified_followups';
const NOTIFIED_WEBLEADS_KEY = 'crm_notified_webleads';

const formatActivityDate = (value) => {
    if (!value) return 'No date';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const formatRelativeTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const minutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'abhi abhi';
    if (minutes < 60) return `${minutes} min pehle`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} ghante pehle`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const isToday = (dueDate) => dueDate === new Date().toISOString().slice(0, 10);

// Sits in the Navbar (rendered on every authenticated page via Layout) so
// due/overdue follow-up reminders AND new (unactioned) web-form leads are
// visible app-wide, not just on the Lead List page. Both lists come from
// dedicated, lightweight, server-computed endpoints rather than the `leads`
// list in redux (see getDueFollowUps / getNewWebLeads for why).
export default function FollowUpReminderBell() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isAuthenticated = useSelector((s) => !!s.auth?.user);
    const dueFollowUps = useSelector((s) => s.leads?.dueFollowUps || []);
    const newWebLeads = useSelector((s) => s.leads?.newWebLeads || []);

    const [reminderAnchor, setReminderAnchor] = useState(null);
    const [notifPermission, setNotifPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
    );

    useEffect(() => {
        if (!isCrmEnabled || !isAuthenticated) return;
        const poll = () => {
            dispatch(getDueFollowUps());
            dispatch(getNewWebLeads());
        };
        poll();
        const interval = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [dispatch, isAuthenticated]);

    const requestNotifPermission = () => {
        if (typeof Notification === 'undefined') return;
        Notification.requestPermission().then((result) => setNotifPermission(result));
    };

    const dueFollowUpsList = useMemo(() => {
        return [...dueFollowUps]
            .map((item) => ({ ...item, isDueToday: !item.is_overdue && isToday(item.due_date) }))
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    }, [dueFollowUps]);

    const newWebLeadsList = useMemo(() => {
        return [...newWebLeads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [newWebLeads]);

    const totalCount = dueFollowUpsList.length + newWebLeadsList.length;

    // ── Browser notifications: due/overdue follow-ups (daily dedupe) ────
    useEffect(() => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        if (dueFollowUpsList.length === 0) return;

        const today = new Date().toDateString();
        let notifiedToday = [];
        try {
            const raw = JSON.parse(localStorage.getItem(NOTIFIED_FOLLOWUPS_KEY) || '{}');
            notifiedToday = raw[today] || [];
        } catch { /* localStorage unavailable */ }

        const toNotify = dueFollowUpsList.filter((item) => !notifiedToday.includes(item.follow_up_id));
        if (toNotify.length === 0) return;

        toNotify.forEach((item) => {
            const title = item.is_overdue ? 'Overdue Follow-up' : 'Follow-up Due Today';
            const body = `${item.company_name || `Lead #${item.lead_id}`} — ${item.note || 'No note'}`;
            try {
                const notification = new Notification(title, { body, tag: `followup-${item.follow_up_id}` });
                notification.onclick = () => {
                    window.focus();
                    navigate(`/crm/leads/${item.lead_id}`);
                };
            } catch { /* Notification constructor can throw in some contexts (e.g. service worker required) */ }
        });

        try {
            const raw = JSON.parse(localStorage.getItem(NOTIFIED_FOLLOWUPS_KEY) || '{}');
            raw[today] = [...notifiedToday, ...toNotify.map((item) => item.follow_up_id)];
            // Only keep today's entry to avoid the cache growing forever
            localStorage.setItem(NOTIFIED_FOLLOWUPS_KEY, JSON.stringify({ [today]: raw[today] }));
        } catch { /* localStorage unavailable */ }
    }, [dueFollowUpsList, navigate]);

    // ── Browser notifications: new web leads (persistent dedupe — a web
    // lead can sit unactioned for days, so unlike follow-ups we don't want
    // to re-notify every day it's still 'new'; we just remember every lead
    // id we've ever notified about, capped so it can't grow unbounded).
    useEffect(() => {
        if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
        if (newWebLeadsList.length === 0) return;

        let notifiedIds = [];
        try {
            notifiedIds = JSON.parse(localStorage.getItem(NOTIFIED_WEBLEADS_KEY) || '[]');
        } catch { /* localStorage unavailable */ }

        const toNotify = newWebLeadsList.filter((item) => !notifiedIds.includes(item.lead_id));
        if (toNotify.length === 0) return;

        toNotify.forEach((item) => {
            const body = item.contact_person
                ? `${item.company_name} — ${item.contact_person}`
                : item.company_name;
            try {
                const notification = new Notification('New Web Lead', { body, tag: `weblead-${item.lead_id}` });
                notification.onclick = () => {
                    window.focus();
                    navigate(`/crm/leads/${item.lead_id}`);
                };
            } catch { /* Notification constructor can throw in some contexts (e.g. service worker required) */ }
        });

        try {
            const merged = [...notifiedIds, ...toNotify.map((item) => item.lead_id)];
            // Cap the list so it can't grow forever across months of leads
            const capped = merged.slice(-500);
            localStorage.setItem(NOTIFIED_WEBLEADS_KEY, JSON.stringify(capped));
        } catch { /* localStorage unavailable */ }
    }, [newWebLeadsList, navigate]);

    if (!isCrmEnabled) return null;

    return (
        <>
            <Tooltip title={
                notifPermission === 'granted' ? 'Notifications' :
                notifPermission === 'unsupported' ? 'Browser notifications supported nahi hain' :
                'Browser notifications on karne ke liye click karo'
            }>
                <IconButton
                    color="inherit"
                    onClick={(e) => {
                        if (notifPermission === 'default') requestNotifPermission();
                        setReminderAnchor(e.currentTarget);
                    }}
                >
                    <Badge badgeContent={totalCount} color="error">
                        <NotifIcon />
                    </Badge>
                </IconButton>
            </Tooltip>

            <Popover
                open={!!reminderAnchor}
                anchorEl={reminderAnchor}
                onClose={() => setReminderAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Box sx={{ width: 360, maxHeight: 460, overflowY: 'auto' }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
                        <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
                        {notifPermission !== 'granted' && notifPermission !== 'unsupported' && (
                            <Button size="small" onClick={requestNotifPermission} sx={{ textTransform: 'none', mt: 0.5, p: 0 }}>
                                Browser notifications on karo
                            </Button>
                        )}
                        {notifPermission === 'denied' && (
                            <Typography variant="caption" color="error" display="block">
                                Notifications block hain — browser settings me manually allow karna hoga.
                            </Typography>
                        )}
                    </Box>

                    {totalCount === 0 ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">Sab clear hai 🎉</Typography>
                        </Box>
                    ) : (
                        <>
                            {newWebLeadsList.length > 0 && (
                                <>
                                    <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary">
                                            NEW WEB LEADS ({newWebLeadsList.length})
                                        </Typography>
                                    </Box>
                                    <Stack divider={<Divider />}>
                                        {newWebLeadsList.map((item) => (
                                            <Box key={item.lead_id} sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' } }}
                                                onClick={() => { setReminderAnchor(null); navigate(`/crm/leads/${item.lead_id}`); }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {item.company_name || `Lead #${item.lead_id}`}
                                                    </Typography>
                                                    <Chip
                                                        label="Website"
                                                        size="small"
                                                        sx={{ height: 18, fontSize: 10, fontWeight: 800, bgcolor: '#eef2ff', color: '#4338ca' }}
                                                    />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                    {item.contact_person || item.phone || item.email || 'No contact info'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatRelativeTime(item.created_at)}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </>
                            )}

                            {dueFollowUpsList.length > 0 && (
                                <>
                                    <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                                        <Typography variant="caption" fontWeight={800} color="text.secondary">
                                            FOLLOW-UP REMINDERS ({dueFollowUpsList.length})
                                        </Typography>
                                    </Box>
                                    <Stack divider={<Divider />}>
                                        {dueFollowUpsList.map((item) => (
                                            <Box key={item.follow_up_id} sx={{ p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#f9fafb' } }}
                                                onClick={() => { setReminderAnchor(null); navigate(`/crm/leads/${item.lead_id}`); }}>
                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {item.company_name || `Lead #${item.lead_id}`}
                                                    </Typography>
                                                    <Chip
                                                        label={item.is_overdue ? 'Overdue' : 'Due Today'}
                                                        size="small"
                                                        sx={{
                                                            height: 18, fontSize: 10, fontWeight: 800,
                                                            bgcolor: item.is_overdue ? '#fee2e2' : '#fffbeb',
                                                            color: item.is_overdue ? '#dc2626' : '#b45309',
                                                        }}
                                                    />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                    {item.note || 'No note'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Due: {formatActivityDate(item.due_date)}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </>
                            )}
                        </>
                    )}
                </Box>
            </Popover>
        </>
    );
}