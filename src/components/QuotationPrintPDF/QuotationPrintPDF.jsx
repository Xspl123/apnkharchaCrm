class QuotationPrintPDF {

    // ── Format currency ───────────────────────────────────
    static formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
        const num = parseFloat(amount);
        return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };

    // ── Format date ───────────────────────────────────────
    static formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // ── Load logo from backend (data URI, so html2canvas can embed it) ──
    static loadLogo = async (logoUrl) => {
        if (!logoUrl) return null;
        try {
            const response = await fetch(logoUrl, { method: 'GET', credentials: 'include', headers: { Accept: 'image/*' } });
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }
        } catch {
            return null;
        }
        return null;
    };

    static statusStyle = (status) => {
        const map = {
            draft: { label: 'DRAFT', color: '#64748b', bg: '#f1f5f9' },
            sent: { label: 'SENT', color: '#0284c7', bg: '#eff6ff' },
            approved: { label: 'APPROVED', color: '#16a34a', bg: '#dcfce7' },
            rejected: { label: 'REJECTED', color: '#dc2626', bg: '#fee2e2' },
            expired: { label: 'EXPIRED', color: '#b45309', bg: '#fffbeb' },
        };
        return map[status] || map.draft;
    };

    // ── Generate full print HTML ──────────────────────────
    static generatePrintHTML = (quotation, logoBase64) => {
        const company = quotation?.company || {};
        const party = quotation?.lead || quotation?.client || {};
        const items = quotation?.items || [];
        const st = this.statusStyle(quotation?.status);

        const rows = items.map((item, i) => `
            <tr>
                <td class="col-sno">${i + 1}</td>
                <td class="col-item">
                    <div class="item-name">${item.item_name || ''}</div>
                    ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                    ${item.hsn_code ? `<div class="item-hsn">HSN: ${item.hsn_code}</div>` : ''}
                </td>
                <td class="col-qty">${item.qty} ${item.unit || ''}</td>
                <td class="col-rate">₹${this.formatCurrency(item.rate)}</td>
                <td class="col-tax">${item.tax_rate || 0}%</td>
                <td class="col-amount">₹${this.formatCurrency(item.amount ?? (item.qty * item.rate))}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Quotation ${quotation?.quotation_no || ''}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                    <style>${this.getCSS()}</style>
                </head>
                <body>
                    <div class="print-container">

                        <!-- ═══ HEADER ═══ -->
                        <div class="header">
                            <div class="logo-area">
                                ${logoBase64 ? `
                                    <div class="logo-box"><img src="${logoBase64}" alt="Logo" /></div>
                                ` : `
                                    <div class="logo-fallback">${company?.company_name?.charAt(0) || 'A'}</div>
                                `}
                                <div class="company-info">
                                    <h1>${company?.company_name || 'Your Company'}</h1>
                                    <div class="company-details">
                                        ${company?.address ? `<span class="detail-chip">📍 ${company.address}${company.city ? ', ' + company.city : ''}</span>` : ''}
                                        ${company?.phone ? `<span class="detail-chip">📞 ${company.phone}</span>` : ''}
                                        ${company?.email ? `<span class="detail-chip">✉️ ${company.email}</span>` : ''}
                                    </div>
                                    ${company?.gstin ? `<div class="company-details" style="margin-top:5px;"><span class="detail-chip gst-chip">GST: ${company.gstin}</span></div>` : ''}
                                </div>
                            </div>
                            <div class="quotation-badge">
                                <h2>QUOTATION</h2>
                                <div class="status-pill" style="background:${st.bg};color:${st.color};">${st.label}</div>
                                <div class="quotation-meta">
                                    <div class="meta-row"><span class="meta-label">Quotation No:</span><span class="meta-value">${quotation?.quotation_no || 'N/A'}</span></div>
                                    <div class="meta-row"><span class="meta-label">Date:</span><span class="meta-value">${this.formatDate(quotation?.quotation_date)}</span></div>
                                    ${quotation?.expiry_date ? `<div class="meta-row"><span class="meta-label">Valid Till:</span><span class="meta-value">${this.formatDate(quotation.expiry_date)}</span></div>` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- ═══ BILL TO ═══ -->
                        <div class="bill-to">
                            <div class="bill-to-label">QUOTATION FOR</div>
                            <div class="bill-to-name">${party?.company_name || 'N/A'}</div>
                            ${party?.contact_person ? `<div class="bill-to-line">Attn: ${party.contact_person}</div>` : ''}
                            ${party?.email ? `<div class="bill-to-line">${party.email}</div>` : ''}
                            ${party?.phone ? `<div class="bill-to-line">${party.phone}</div>` : ''}
                        </div>

                        <!-- ═══ ITEMS TABLE ═══ -->
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th class="col-sno">#</th>
                                        <th class="col-item">ITEM</th>
                                        <th class="col-qty">QTY</th>
                                        <th class="col-rate">RATE</th>
                                        <th class="col-tax">TAX</th>
                                        <th class="col-amount">AMOUNT</th>
                                    </tr>
                                </thead>
                                <tbody>${rows}</tbody>
                            </table>
                        </div>

                        <!-- ═══ TOTALS ═══ -->
                        <div class="totals">
                            <div class="totals-box">
                                <div class="total-item"><span>Sub Total</span><span>₹${this.formatCurrency(quotation?.sub_total)}</span></div>
                                ${quotation?.cgst > 0 ? `<div class="total-item"><span>CGST</span><span>₹${this.formatCurrency(quotation.cgst)}</span></div>` : ''}
                                ${quotation?.sgst > 0 ? `<div class="total-item"><span>SGST</span><span>₹${this.formatCurrency(quotation.sgst)}</span></div>` : ''}
                                ${quotation?.igst > 0 ? `<div class="total-item"><span>IGST</span><span>₹${this.formatCurrency(quotation.igst)}</span></div>` : ''}
                                <div class="total-item grand"><span>Total</span><span>₹${this.formatCurrency(quotation?.total_amount)}</span></div>
                            </div>
                        </div>

                        <!-- ═══ NOTES / TERMS ═══ -->
                        ${quotation?.notes ? `
                            <div class="notes">
                                <div class="notes-header"><span>📝</span><span>NOTES</span></div>
                                <div class="notes-content">${quotation.notes}</div>
                            </div>
                        ` : ''}
                        ${quotation?.terms_conditions ? `
                            <div class="notes">
                                <div class="notes-header"><span>📋</span><span>TERMS &amp; CONDITIONS</span></div>
                                <div class="notes-content">${quotation.terms_conditions}</div>
                            </div>
                        ` : ''}

                        <!-- ═══ SIGNATURE ═══ -->
                        <div class="signature">
                            <div class="signature-box">
                                <div class="signature-title">CUSTOMER ACCEPTANCE</div>
                                <div class="signature-sub">(Signature &amp; date)</div>
                            </div>
                            <div class="signature-box right">
                                <div class="signature-title">AUTHORIZED SIGNATORY</div>
                                <div class="signature-company">${company?.company_name || 'Your Company'}</div>
                            </div>
                        </div>

                        <!-- ═══ FOOTER ═══ -->
                        <div class="footer">
                            <div class="thankyou">THANK YOU FOR YOUR CONSIDERATION!</div>
                            <div class="footer-text">This is a computer-generated quotation.</div>
                            ${company?.email ? `<div class="footer-email">📧 ${company.email}</div>` : ''}
                            ${company?.phone ? `<div class="footer-phone">📞 ${company.phone}</div>` : ''}
                        </div>

                    </div>
                </body>
            </html>
        `;
    };

    // ── CSS ───────────────────────────────────────────────
    static getCSS = () => `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; background: #fff; padding: 0.3in; }
        .print-container { max-width: 100%; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #1e3a8a; margin-bottom: 16px; }
        .logo-area { display: flex; gap: 12px; align-items: flex-start; }
        .logo-box img { width: 56px; height: 56px; object-fit: contain; border-radius: 8px; }
        .logo-fallback { width: 56px; height: 56px; border-radius: 10px; background: #2563EB; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; }
        .company-info h1 { font-size: 18px; color: #0f172a; margin-bottom: 4px; }
        .company-details { display: flex; flex-wrap: wrap; gap: 6px; }
        .detail-chip { font-size: 9px; color: #475569; background: #f1f5f9; padding: 2px 7px; border-radius: 10px; }
        .gst-chip { background: #eff6ff; color: #1d4ed8; font-weight: 700; }
        .quotation-badge { text-align: right; min-width: 200px; }
        .quotation-badge h2 { font-size: 22px; color: #1e3a8a; letter-spacing: 1px; }
        .status-pill { display: inline-block; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 12px; margin: 6px 0; }
        .meta-row { display: flex; justify-content: flex-end; gap: 8px; font-size: 10px; margin-top: 2px; }
        .meta-label { color: #64748b; }
        .meta-value { color: #0f172a; font-weight: 700; }
        .bill-to { background: #f8fafc; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; }
        .bill-to-label { font-size: 9px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
        .bill-to-name { font-size: 14px; font-weight: 700; color: #0f172a; }
        .bill-to-line { font-size: 11px; color: #475569; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; }
        thead th { background: #1e3a8a; color: #fff; font-size: 9px; padding: 8px 6px; text-align: left; }
        tbody td { font-size: 10.5px; padding: 8px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
        .col-sno { width: 24px; text-align: center; }
        .col-qty, .col-rate, .col-tax, .col-amount { text-align: right; white-space: nowrap; }
        .item-name { font-weight: 600; color: #0f172a; }
        .item-desc, .item-hsn { font-size: 9px; color: #94a3b8; margin-top: 2px; }
        .totals { display: flex; justify-content: flex-end; margin: 14px 0; }
        .totals-box { width: 240px; }
        .total-item { display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; color: #475569; }
        .total-item.grand { border-top: 2px solid #1e3a8a; margin-top: 4px; padding-top: 8px; font-size: 15px; font-weight: 800; color: #1e3a8a; }
        .notes { margin-top: 12px; page-break-inside: avoid; }
        .notes-header { display: flex; gap: 6px; font-size: 10px; font-weight: 700; color: #1e3a8a; margin-bottom: 4px; }
        .notes-content { font-size: 10.5px; color: #475569; white-space: pre-wrap; }
        .signature { display: flex; justify-content: space-between; margin-top: 32px; page-break-inside: avoid; }
        .signature-box { width: 45%; border-top: 1px solid #94a3b8; padding-top: 6px; }
        .signature-box.right { text-align: right; }
        .signature-title { font-size: 9px; font-weight: 700; color: #475569; }
        .signature-company { font-size: 11px; font-weight: 700; color: #0f172a; }
        .signature-sub { font-size: 9px; color: #94a3b8; }
        .footer { margin-top: 15px; padding-top: 8px; border-top: 1px dashed #cbd5e1; text-align: center; page-break-inside: avoid; }
        .thankyou { font-weight: 700; color: #0f172a; font-size: 12px; margin-bottom: 3px; }
        .footer-text { color: #64748b; font-size: 9px; margin-bottom: 3px; }
        .footer-email, .footer-phone { color: #64748b; font-size: 9px; }
    `;

    // ── Build the HTML element used both for download and for the
    //    email-attachment path, so both stay pixel-identical. ──
    static buildElement = async (quotation) => {
        const logoBase64 = await this.loadLogo(quotation?.company?.logo_url);
        const element = document.createElement('div');
        element.innerHTML = this.generatePrintHTML(quotation, logoBase64);
        document.body.appendChild(element);
        return element;
    };

    static pdfOptions = (quotation) => ({
        margin: [0.1, 0.1, 0.1, 0.1],
        filename: `Quotation_${quotation?.quotation_no || 'QT'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: {
            scale: 2, logging: false, allowTaint: true, useCORS: true,
            letterRendering: true, backgroundColor: '#ffffff',
            windowWidth: 1200, windowHeight: 1600,
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: 'avoid-all' },
    });

    // ── Download PDF directly ──────────────────────────────
    static handleExportPDF = async (quotation, setLoading, showSnackbar, html2pdf) => {
        if (!quotation) return;
        setLoading(true);
        try {
            const element = await this.buildElement(quotation);
            await html2pdf().set(this.pdfOptions(quotation)).from(element).save();
            document.body.removeChild(element);
            showSnackbar('Quotation PDF downloaded!', 'success');
        } catch (error) {
            showSnackbar('Error generating PDF: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Get PDF as base64 (no data-URI prefix), for emailing ──
    static getPdfBase64 = async (quotation, html2pdf) => {
        const element = await this.buildElement(quotation);
        try {
            const dataUri = await html2pdf().set(this.pdfOptions(quotation)).from(element).output('datauristring');
            return dataUri.split(',')[1]; // strip "data:application/pdf;filename=...;base64," prefix
        } finally {
            document.body.removeChild(element);
        }
    };
}

export default QuotationPrintPDF;