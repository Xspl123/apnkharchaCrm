import { useState, useMemo, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogTitle, IconButton, Box, Typography, Tabs, Tab,
  TextField, MenuItem, Grid, Paper, Stack, Button, Divider, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Snackbar, Alert, Avatar, Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon, Link as LinkIcon, ContentCopy as CopyIcon,
  QrCode2 as QrIcon, WhatsApp as WhatsAppIcon, Facebook as FacebookIcon,
  Instagram as InstagramIcon, Google as GoogleIcon, Email as EmailIcon,
  Store as IndiaMartIcon, Handshake as ReferralIcon,
  Print as PrintIcon, Download as DownloadIcon, Bolt as GenerateIcon,
  Schedule as HistoryIcon, Dashboard as TemplatesIcon,
} from '@mui/icons-material';

const SOURCES = [
  { value: 'facebook', label: 'Facebook', icon: <FacebookIcon sx={{ color: '#1877f2' }} /> },
  { value: 'instagram', label: 'Instagram', icon: <InstagramIcon sx={{ color: '#e1306c' }} /> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <WhatsAppIcon sx={{ color: '#25d366' }} /> },
  { value: 'google', label: 'Google', icon: <GoogleIcon sx={{ color: '#4285f4' }} /> },
  { value: 'indiamart', label: 'IndiaMART', icon: <IndiaMartIcon sx={{ color: '#f04b23' }} /> },
  { value: 'referral', label: 'Referral', icon: <ReferralIcon sx={{ color: '#8b5cf6' }} /> },
  { value: 'email', label: 'Email', icon: <EmailIcon sx={{ color: '#64748b' }} /> },
];

const MEDIUMS = ['organic', 'cpc', 'social', 'status', 'referral', 'email'];

const TEMPLATES = [
  {
    emoji: '🪔', title: 'Diwali Sale', campaign: 'diwali_sale_2026',
    source: 'facebook', medium: 'cpc',
    message: 'Diwali special offers live hain! Hamare latest deals dekhne aur enquiry bhejne ke liye niche diye gaye link par click karein.',
  },
  {
    emoji: '🌺', title: 'Navratri Offer', campaign: 'navratri_offer',
    source: 'whatsapp', medium: 'status',
    message: 'Namaste! Hamare latest products dekhne aur enquiry bhejne ke liye niche diye gaye link par click karein.',
  },
  {
    emoji: '🎄', title: 'New Year', campaign: 'new_year_offer',
    source: 'instagram', medium: 'organic',
    message: 'New Year, naye offers! Hamare latest catalog dekhne ke liye niche diye gaye link par click karein.',
  },
];

const HISTORY_KEY = 'apnakharcha_utm_past_links';
const MAX_HISTORY = 25;

const slugify = (str) => str.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

const timeAgo = (iso) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (rows) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, MAX_HISTORY)));
  } catch {
    // storage full/unavailable — ignore silently
  }
};

export default function UtmLinkGenerator({ open, onClose, organisation }) {
  const [tab, setTab] = useState(0);
  const [campaignName, setCampaignName] = useState('');
  const [source, setSource] = useState('facebook');
  const [medium, setMedium] = useState('organic');
  const [term, setTerm] = useState('');
  const [content, setContent] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateMsg, setTemplateMsg] = useState('');
  const [history, setHistory] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open) setHistory(loadHistory());
  }, [open]);

  const params = useMemo(() => ({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: slugify(campaignName) || '-',
    utm_term: slugify(term) || '',
    utm_content: slugify(content) || '',
  }), [source, medium, campaignName, term, content]);

  const link = useMemo(() => {
    if (!organisation?.slug) return '';
    const base = `${window.location.origin}/lead-form/${organisation.slug}`;
    const qs = new URLSearchParams();
    qs.set('utm_source', params.utm_source);
    qs.set('utm_medium', params.utm_medium);
    qs.set('utm_campaign', params.utm_campaign);
    if (params.utm_term) qs.set('utm_term', params.utm_term);
    if (params.utm_content) qs.set('utm_content', params.utm_content);
    return `${base}?${qs.toString()}`;
  }, [organisation, params]);

  const qrUrl = link ? `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(link)}` : '';
  const sourceMeta = SOURCES.find((s) => s.value === source);

  const showSnack = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const handleApplyTemplate = (tpl) => {
    setCampaignName(tpl.title.toLowerCase().includes(tpl.campaign.split('_')[0]) ? tpl.title : tpl.title);
    setCampaignName(tpl.title);
    setSource(tpl.source);
    setMedium(tpl.medium);
    setTemplateTitle(`${tpl.emoji} ${tpl.title}`);
    setTemplateMsg(tpl.message);
    setTab(0);
    showSnack(`"${tpl.title}" template laga diya`, 'info');
  };

  const handleGenerateLink = () => {
    if (!link) {
      showSnack('Organisation load nahi hui, thodi der baad try karein', 'error');
      return;
    }
    if (!campaignName.trim()) {
      showSnack('Campaign Name bharna zaroori hai', 'error');
      return;
    }
    const entry = {
      id: `${Date.now()}`,
      campaign: params.utm_campaign,
      source, medium, link,
      createdAt: new Date().toISOString(),
    };
    const updated = [entry, ...history.filter((h) => h.link !== link)];
    setHistory(updated);
    saveHistory(updated);
    showSnack('Campaign link generate ho gaya aur history me save ho gaya!', 'success');
  };

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      showSnack('Campaign link copied successfully!', 'success');
    } catch {
      showSnack('Copy nahi ho paya, manually copy karein', 'error');
    }
  };

  const handleCopyPastLink = async (l) => {
    try {
      await navigator.clipboard.writeText(l);
      showSnack('Link copied successfully!', 'success');
    } catch {
      showSnack('Copy nahi ho paya', 'error');
    }
  };

  const handleDownloadQr = async () => {
    if (!qrUrl) return;
    const res = await fetch(qrUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(campaignName) || 'utm'}_qr.png`;
    a.click();
    URL.revokeObjectURL(url);
    showSnack('QR code download ho gaya', 'success');
  };

  const handleCopyQr = async () => {
    if (!qrUrl) return;
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      showSnack('QR code copy ho gaya', 'success');
    } catch {
      showSnack('QR copy is browser me support nahi hai', 'error');
    }
  };

  const handlePrintQr = () => {
    if (!qrUrl) return;
    const win = window.open('', '_blank', 'width=400,height=500');
    win.document.write(`
      <html>
        <head><title>UTM QR — ${campaignName || 'Campaign'}</title></head>
        <body style="text-align:center;font-family:sans-serif;padding:24px;">
          <h3>${campaignName || 'Campaign'}</h3>
          <img src="${qrUrl}" width="260" height="260" />
          <p style="font-size:12px;color:#666;word-break:break-all;">${link}</p>
          <script>window.onload = () => { window.print(); };<\/script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleShareWhatsApp = () => {
    if (!link) return;
    const heading = templateTitle || '🔗 Campaign Link';
    const body = templateMsg || 'Namaste! Hamare latest products dekhne aur enquiry bhejne ke liye niche diye gaye link par click karein.';
    const message = `${heading}\n${body}\n👉 ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LinkIcon sx={{ color: '#4f46e5' }} />
            <Box>
              <Typography variant="h6" fontWeight={800}>Generate UTM Campaign Link</Typography>
              <Typography variant="caption" color="text.secondary">
                Create tracking links for Facebook, WhatsApp, Instagram and more
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
            <Tab icon={<LinkIcon fontSize="small" />} iconPosition="start" label="Link Generator" />
            <Tab icon={<QrIcon fontSize="small" />} iconPosition="start" label="QR Code" />
            <Tab icon={<TemplatesIcon fontSize="small" />} iconPosition="start" label="Templates" />
            <Tab icon={<HistoryIcon fontSize="small" />} iconPosition="start" label="Past Links" />
          </Tabs>

          {/* TAB 0 — Link Generator */}
          {tab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Campaign Name" required
                  value={campaignName} onChange={(e) => setCampaignName(e.target.value)}
                  helperText="Spaces will become underscores" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Traffic Source" required value={source}
                  onChange={(e) => setSource(e.target.value)}>
                  {SOURCES.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      <Stack direction="row" spacing={1} alignItems="center">{s.icon}<span>{s.label}</span></Stack>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Medium" required value={medium}
                  onChange={(e) => setMedium(e.target.value)} helperText="How the traffic came">
                  {MEDIUMS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Term (Optional)" placeholder="e.g. LED_Bulb"
                  value={term} onChange={(e) => setTerm(e.target.value)}
                  helperText="For specific keywords or audience" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Content (Optional)" placeholder="e.g. video_1"
                  value={content} onChange={(e) => setContent(e.target.value)}
                  helperText="To identify your ad or post" />
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#eef2ff' }}>
                  <Typography variant="caption" fontWeight={800} color="#4338ca">Preview Parameters</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                    <Chip size="small" label={params.utm_source} sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 700 }} />
                    <Chip size="small" label={params.utm_medium} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                    <Chip size="small" label={params.utm_campaign} sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700 }} />
                    {params.utm_term && <Chip size="small" label={params.utm_term} sx={{ bgcolor: '#fce7f3', color: '#be185d', fontWeight: 700 }} />}
                    {params.utm_content && <Chip size="small" label={params.utm_content} sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }} />}
                  </Stack>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption" fontWeight={800}>Generated Link</Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ mt: 0.5 }}
                  value={link || 'Organisation load ho rahi hai...'}
                  InputProps={{
                    readOnly: true,
                    sx: { fontSize: 13, bgcolor: '#f8fafc', borderRadius: '10px' },
                    endAdornment: (
                      <Tooltip title="Copy">
                        <IconButton onClick={handleCopy} disabled={!link} edge="end" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button variant="contained" size="small" startIcon={<GenerateIcon />} onClick={handleGenerateLink}
                    sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}>
                    Generate Link
                  </Button>
                  <Button variant="contained" size="small" startIcon={<CopyIcon />} onClick={handleCopy} disabled={!link}
                    sx={{ borderRadius: '10px', textTransform: 'none', bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' } }}>
                    Copy Link
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => { setTab(1); }} disabled={!link}
                    sx={{ borderRadius: '10px', textTransform: 'none' }}>
                    Download QR
                  </Button>
                  <Button variant="contained" color="success" size="small" startIcon={<WhatsAppIcon />}
                    onClick={handleShareWhatsApp} disabled={!link}
                    sx={{ borderRadius: '10px', textTransform: 'none' }}>
                    Share WhatsApp
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}

          {/* TAB 1 — QR Code */}
          {tab === 1 && (
            <Stack alignItems="center" spacing={2} sx={{ py: 2 }}>
              {qrUrl ? (
                <>
                  <Avatar variant="rounded" sx={{ width: 260, height: 260, bgcolor: 'transparent' }}>
                    <img src={qrUrl} alt="UTM QR Code" width={260} height={260} style={{ borderRadius: 10, border: '1px solid #e5e7eb' }} />
                  </Avatar>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="center">
                    <Button variant="contained" size="small" startIcon={<DownloadIcon />} onClick={handleDownloadQr}
                      sx={{ borderRadius: '10px', textTransform: 'none' }}>
                      Download PNG
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<CopyIcon />} onClick={handleCopyQr}
                      sx={{ borderRadius: '10px', textTransform: 'none' }}>
                      Copy QR
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrintQr}
                      sx={{ borderRadius: '10px', textTransform: 'none' }}>
                      Print QR
                    </Button>
                  </Stack>
                </>
              ) : (
                <Typography color="text.secondary">Pehle campaign name aur source fill karein</Typography>
              )}
            </Stack>
          )}

          {/* TAB 2 — Templates */}
          {tab === 2 && (
            <Grid container spacing={2}>
              {TEMPLATES.map((tpl) => (
                <Grid item xs={12} sm={4} key={tpl.campaign}>
                  <Paper
                    variant="outlined"
                    onClick={() => handleApplyTemplate(tpl)}
                    sx={{
                      p: 2, borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
                      transition: '0.15s', '&:hover': { bgcolor: '#f8fafc', borderColor: '#4f46e5' },
                    }}
                  >
                    <Typography variant="h4">{tpl.emoji}</Typography>
                    <Typography variant="body2" fontWeight={800} sx={{ mt: 0.5 }}>{tpl.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                      {tpl.campaign}
                    </Typography>
                    <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 1 }}>
                      <Chip size="small" label={tpl.source} sx={{ fontSize: 10 }} />
                      <Chip size="small" label={tpl.medium} sx={{ fontSize: 10 }} />
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {/* TAB 3 — Past Links */}
          {tab === 3 && (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '10px', maxHeight: 340 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Campaign</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Platform</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Abhi tak koi link generate nahi hua
                      </TableCell>
                    </TableRow>
                  ) : history.map((row) => {
                    const meta = SOURCES.find((s) => s.value === row.source);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{row.campaign}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            {meta?.icon}
                            <Typography variant="caption">{meta?.label || row.source} · {row.medium}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell><Typography variant="caption">{timeAgo(row.createdAt)}</Typography></TableCell>
                        <TableCell align="right">
                          <Tooltip title="Copy">
                            <IconButton size="small" onClick={() => handleCopyPastLink(row.link)}>
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Show QR">
                            <IconButton size="small" component="a"
                              href={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(row.link)}`}
                              target="_blank" rel="noopener">
                              <QrIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}