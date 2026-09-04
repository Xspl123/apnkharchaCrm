import './InvoicePrintPDF.css';

class InvoicePrintPDF {

    // ── Format currency ───────────────────────────────────
    static formatCurrency = (amount) => {
        if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
        const num = parseFloat(amount);
        return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    };

    // ── Format date ───────────────────────────────────────
    static formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // ── Calculate GST % from actual values ────────────────
    static calculateGSTPercentage = (gstAmount, subtotal, defaultPercent = 2.5) => {
        if (!gstAmount || !subtotal) return defaultPercent.toFixed(2);
        const gst = parseFloat(gstAmount);
        const sub = parseFloat(subtotal);
        if (isNaN(gst) || isNaN(sub) || sub === 0) return defaultPercent.toFixed(2);
        const percentage    = (gst / sub) * 100;
        const roundedPercent = Math.round(percentage * 100) / 100;
        if (roundedPercent > 100 || roundedPercent < 0) return defaultPercent.toFixed(2);
        return roundedPercent.toFixed(2);
    };

    // ── Calculate totals (supply_type aware) ──────────────
    static calculateTotals = (items, invoice) => {
        const toNumber = (val) => {
            if (!val) return 0;
            return Number(String(val).replace(/[^0-9.-]+/g, '')) || 0;
        };

        let subtotal = 0;
        let cgst     = 0;
        let sgst     = 0;
        let igst     = 0;

        // supply_type invoice se lo — default 'intra'
        const isInter = (invoice?.supply_type || 'intra') === 'inter';

        items.forEach(item => {
            const qty     = toNumber(item.qty);
            const rate    = toNumber(item.rate);
            const amount  = toNumber(item.amount) || (qty * rate);
            const taxRate = toNumber(item.tax_rate) || 0;

            subtotal += amount;

            if (taxRate > 0) {
                const taxAmount = (amount * taxRate) / 100;

                if (isInter) {
                    // Inter-state → sirf IGST
                    igst += taxAmount;
                } else {
                    // Intra-state → CGST + SGST equally
                    cgst += taxAmount / 2;
                    sgst += taxAmount / 2;
                }
            }
        });

        const total   = subtotal + cgst + sgst + igst;
        const paid    = toNumber(invoice?.paid_amount);
        const balance = total - paid;

        return {
            subtotal: Number(subtotal.toFixed(2)),
            cgst:     Number(cgst.toFixed(2)),
            sgst:     Number(sgst.toFixed(2)),
            igst:     Number(igst.toFixed(2)),
            total:    Number(total.toFixed(2)),
            paid:     Number(paid.toFixed(2)),
            balance:  Number(balance.toFixed(2)),
        };
    };

    // ── Load logo from backend ────────────────────────────
    static loadLogo = async (logoUrl) => {
        if (!logoUrl) return null;
        try {
            const response = await fetch(logoUrl, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'image/*'
                }
            });
            if (response.ok) {
                const blob = await response.blob();
                return await new Promise((resolve) => {
                    const reader       = new FileReader();
                    reader.onloadend   = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            }
        } catch {
            return null;
        }
        return null;
    };

    // ── Invoice type label + color ────────────────────────
    static getInvoiceTypeStyle = (type) => {
        const map = {
            b2b:    { label: 'B2B',    color: '#1976d2', bg: '#e3f2fd' },
            b2cs:   { label: 'B2CS',   color: '#2e7d32', bg: '#e8f5e9' },
            b2cl:   { label: 'B2CL',   color: '#ed6c02', bg: '#fff3e0' },
            export: { label: 'EXPORT', color: '#9c27b0', bg: '#f3e5f5' },
        };
        return map[type] || { label: (type || '').toUpperCase(), color: '#0f172a', bg: '#f8fafc' };
    };

    // ── Generate full print HTML ──────────────────────────
    static generatePrintHTML = (invoice, logoBase64) => {
        const company  = invoice?.company  || {};
        const client   = invoice?.client   || {};
        const items    = invoice?.items    || [];

        const { subtotal, cgst, sgst, igst, total, paid, balance } =
            this.calculateTotals(items, invoice);

        const typeStyle   = this.getInvoiceTypeStyle(invoice?.invoice_type);
        const isInter     = (invoice?.supply_type || 'intra') === 'inter';
        const hasRCM      = !!invoice?.is_reverse_charge;
        const hasGSTInfo  = !!(invoice?.invoice_type || invoice?.supply_type || invoice?.place_of_supply);

        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Invoice ${invoice?.invoice_no}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                    <style>${this.getCSS()}</style>
                </head>
                <body>
                    <div class="print-container">

                        <!-- ═══ HEADER ═══ -->
                        <div class="header">
                            <div class="logo-area">
                                ${logoBase64 ? `
                                    <div class="logo-box">
                                        <img src="${logoBase64}" alt="Company Logo" />
                                    </div>
                                ` : `
                                    <div class="logo-fallback">
                                        ${company?.company_name?.charAt(0) || 'A'}
                                    </div>
                                `}
                                <div class="company-info">
                                    <h1>${company?.company_name || 'Company Name'}</h1>
                                    <div class="company-details">
                                        <span class="detail-chip">📍 ${company?.address?.split(',').slice(0, 2).join(',') || 'Address'}</span>
                                        <span class="detail-chip">📞 ${company?.phone || 'N/A'}</span>
                                        <span class="detail-chip">✉️ ${company?.email || 'N/A'}</span>
                                    </div>
                                    <div class="company-details" style="margin-top:5px;">
                                        <span class="detail-chip gst-chip">GST: ${company?.gstin || 'N/A'}</span>
                                        ${company?.pan ? `<span class="detail-chip pan-chip">PAN: ${company.pan}</span>` : ''}
                                    </div>
                                </div>
                            </div>

                            <div class="invoice-badge">
                                <h2>INVOICE</h2>
                                <div class="invoice-meta">
                                    <div class="meta-row">
                                        <span class="meta-label">Invoice No:</span>
                                        <span class="meta-value">${invoice?.invoice_no || 'N/A'}</span>
                                    </div>
                                    <div class="meta-row">
                                        <span class="meta-label">Date:</span>
                                        <span class="meta-value">${this.formatDate(invoice?.invoice_date)}</span>
                                    </div>
                                    <div class="meta-row">
                                        <span class="meta-label">Due Date:</span>
                                        <span class="meta-value">${this.formatDate(invoice?.due_date)}</span>
                                    </div>

                                    <!-- ── GST Info rows (new) ── -->
                                    ${hasGSTInfo ? `
                                        <div class="meta-divider"></div>
                                        ${invoice?.invoice_type ? `
                                            <div class="meta-row">
                                                <span class="meta-label">Invoice Type:</span>
                                                <span class="meta-value">
                                                    <span class="type-badge"
                                                        style="background:${typeStyle.bg};color:${typeStyle.color};">
                                                        ${typeStyle.label}
                                                    </span>
                                                </span>
                                            </div>
                                        ` : ''}
                                        ${invoice?.supply_type ? `
                                            <div class="meta-row">
                                                <span class="meta-label">Supply:</span>
                                                <span class="meta-value" style="font-size:10px;">
                                                    ${isInter ? '✈️ Inter-state' : '🏠 Intra-state'}
                                                </span>
                                            </div>
                                        ` : ''}
                                        ${invoice?.place_of_supply ? `
                                            <div class="meta-row">
                                                <span class="meta-label">Place of Supply:</span>
                                                <span class="meta-value" style="font-size:10px;">
                                                    ${invoice.place_of_supply}
                                                </span>
                                            </div>
                                        ` : ''}
                                        ${hasRCM ? `
                                            <div class="meta-row">
                                                <span class="meta-label">RCM:</span>
                                                <span class="meta-value" style="color:#ed6c02;font-size:10px;">
                                                    ⚠️ Applicable
                                                </span>
                                            </div>
                                        ` : ''}
                                    ` : ''}
                                </div>

                                <div class="status-badge ${invoice?.status || 'unpaid'}">
                                    ${invoice?.status === 'paid'    ? '✓ PAID'    :
                                      invoice?.status === 'unpaid'  ? '⏳ UNPAID' :
                                      invoice?.status === 'partial' ? '⚠️ PARTIAL':
                                      (invoice?.status || 'UNPAID').toUpperCase()}
                                </div>
                            </div>
                        </div>

                        <!-- ═══ BILL TO ═══ -->
                        <div class="bill-to">
                            <div class="section-title">
                                <div class="accent"></div>
                                <span>BILL TO</span>
                            </div>
                            <div class="client-card">
                                <div>
                                    <div class="client-name">${client?.company_name || 'Client Name'}</div>
                                    ${client?.contact_person ? `
                                        <div class="info-row">
                                            <span class="info-label">Attn:</span>
                                            <span class="info-value">${client.contact_person}</span>
                                        </div>
                                    ` : ''}
                                    <div class="info-row">
                                        <span class="info-label">Address:</span>
                                        <span class="info-value">${client?.address || 'N/A'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">City:</span>
                                        <span class="info-value">
                                            ${client?.city || ''} ${client?.state || ''} ${client?.pincode ? '- ' + client.pincode : ''}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div class="info-row">
                                        <span class="info-label">📞</span>
                                        <span class="info-value">${client?.phone || 'N/A'}</span>
                                    </div>
                                    <div class="info-row">
                                        <span class="info-label">✉️</span>
                                        <span class="info-value">${client?.email || 'N/A'}</span>
                                    </div>
                                    ${client?.gstin ? `
                                        <div style="margin-top:8px;">
                                            <span class="detail-chip gst-chip">GST: ${client.gstin}</span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <!-- ═══ ITEMS TABLE ═══ -->
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>ITEM DESCRIPTION</th>
                                        <th>HSN/SAC</th>
                                        <th class="text-center">QTY</th>
                                        <th class="text-right">RATE (₹)</th>
                                        <th class="text-right">TAX %</th>
                                        <th class="text-right">AMOUNT (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.length > 0 ? items.map((item, index) => {
                                        const qty    = parseFloat(item.qty) || 1;
                                        const rate   = Number((item.rate   || '0').toString().replace(/,/g, '')) || 0;
                                        const amount = Number((item.amount || '0').toString().replace(/,/g, '')) || (qty * rate);
                                        return `
                                            <tr>
                                                <td>${String(index + 1).padStart(2, '0')}</td>
                                                <td>
                                                    <div class="item-name">${item.item_name || 'Item'}</div>
                                                    ${item.description ? `<div class="item-desc">${item.description}</div>` : ''}
                                                </td>
                                                <td>${item.hsn_code || '—'}</td>
                                                <td class="text-center">${qty.toFixed(2)} ${item.unit || 'pcs'}</td>
                                                <td class="text-right">₹${this.formatCurrency(rate)}</td>
                                                <td class="text-right">${item.tax_rate || 0}%</td>
                                                <td class="text-right amount-cell">₹${this.formatCurrency(amount)}</td>
                                            </tr>
                                        `;
                                    }).join('') : `
                                        <tr>
                                            <td colspan="7" style="text-align:center;color:#94a3b8;padding:20px;">
                                                No items found
                                            </td>
                                        </tr>
                                    `}
                                </tbody>
                            </table>
                        </div>

                        <!-- ═══ TOTALS ═══ -->
                        <div class="totals">
                            <div class="totals-box">
                                <div class="total-item sub">
                                    <span>Subtotal</span>
                                    <span>₹${this.formatCurrency(subtotal)}</span>
                                </div>

                                ${cgst > 0 ? `
                                    <div class="total-item">
                                        <span style="padding-left:10px;">
                                            CGST (${this.calculateGSTPercentage(cgst, subtotal)}%)
                                        </span>
                                        <span>₹${this.formatCurrency(cgst)}</span>
                                    </div>
                                ` : ''}

                                ${sgst > 0 ? `
                                    <div class="total-item">
                                        <span style="padding-left:10px;">
                                            SGST (${this.calculateGSTPercentage(sgst, subtotal)}%)
                                        </span>
                                        <span>₹${this.formatCurrency(sgst)}</span>
                                    </div>
                                ` : ''}

                                ${igst > 0 ? `
                                    <div class="total-item">
                                        <span style="padding-left:10px;">
                                            IGST (${this.calculateGSTPercentage(igst, subtotal, 18)}%)
                                        </span>
                                        <span>₹${this.formatCurrency(igst)}</span>
                                    </div>
                                ` : ''}

                                ${hasRCM ? `
                                    <div class="total-item" style="color:#ed6c02;font-size:10px;">
                                        <span style="padding-left:10px;">⚠️ Reverse Charge Applicable</span>
                                        <span>—</span>
                                    </div>
                                ` : ''}

                                <div class="total-item grand">
                                    <span>Grand Total</span>
                                    <span>₹${this.formatCurrency(total)}</span>
                                </div>

                                ${paid > 0 ? `
                                    <div class="total-item" style="color:#166534;">
                                        <span style="padding-left:10px;">✓ Paid Amount</span>
                                        <span>₹${this.formatCurrency(paid)}</span>
                                    </div>
                                ` : ''}

                                ${balance > 0 ? `
                                    <div class="total-item balance">
                                        <span>Balance Due</span>
                                        <span>₹${this.formatCurrency(balance)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- ═══ BANK DETAILS ═══ -->
                        <div class="bank-section">
                            <div class="bank-accent"></div>
                            <div class="bank-title">
                                <span>🏦</span> BANK DETAILS FOR PAYMENT
                            </div>
                            <div class="bank-grid">
                                <div class="bank-item">
                                    <span class="label">BANK NAME</span>
                                    <span class="value">${company?.bank_name || 'N/A'}</span>
                                </div>
                                <div class="bank-item">
                                    <span class="label">ACCOUNT NO</span>
                                    <span class="value">${company?.bank_account_no || 'N/A'}</span>
                                </div>
                                <div class="bank-item">
                                    <span class="label">IFSC CODE</span>
                                    <span class="value">${company?.bank_ifsc || 'N/A'}</span>
                                </div>
                                <div class="bank-item">
                                    <span class="label">BRANCH</span>
                                    <span class="value">${company?.bank_branch || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <!-- ═══ NOTES ═══ -->
                        ${invoice?.notes ? `
                            <div class="notes">
                                <div class="notes-header">
                                    <span>📝</span>
                                    <span>NOTES</span>
                                </div>
                                <div class="notes-content">${invoice.notes}</div>
                            </div>
                        ` : ''}

                        <!-- ═══ SIGNATURE ═══ -->
                        <div class="signature">
                            <div class="signature-box">
                                <div class="signature-title">CUSTOMER SIGNATURE</div>
                                <div class="signature-sub">(Authorized representative)</div>
                            </div>
                            <div class="signature-box right">
                                <div class="signature-title">AUTHORIZED SIGNATURE</div>
                                <div class="signature-company">${company?.company_name || 'Company Name'}</div>
                                <div class="signature-sub">Authorized Signatory</div>
                            </div>
                        </div>

                        <!-- ═══ FOOTER ═══ -->
                        <div class="footer">
                            <div class="thankyou">THANK YOU FOR YOUR BUSINESS!</div>
                            <div class="footer-text">This is a computer-generated invoice. No physical signature required.</div>
                            <div class="footer-email">📧 For any queries: ${company?.email || 'N/A'}</div>
                            <div class="footer-phone">📞 ${company?.phone || 'N/A'}</div>
                            <div class="footer-watermark">${(company?.company_name || 'COMPANY').toUpperCase()} · EST. 2020</div>
                        </div>

                    </div>
                </body>
            </html>
        `;
    };

    // ── CSS ───────────────────────────────────────────────
    static getCSS = () => {
        return `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Inter', sans-serif;
                background: white;
                padding: 0.2in;
                margin: 0;
            }
            .print-container {
                max-width: 1100px; margin: 0 auto; background: white;
                border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;
            }
            .header { display: flex; justify-content: space-between; margin-bottom: 15px; }
            .logo-area { display: flex; align-items: center; gap: 12px; }
            .logo-box {
                width: 60px; height: 60px; display: flex; align-items: center;
                justify-content: center; border: 1px solid #e2e8f0; border-radius: 8px;
                padding: 4px; background: white;
            }
            .logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
            .logo-fallback {
                width: 60px; height: 60px; display: flex; align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 8px; color: white; font-size: 28px; font-weight: 800;
            }
            .company-info h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 3px; }
            .company-details { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 3px; }
            .detail-chip {
                display: flex; align-items: center; gap: 3px;
                background: #f8fafc; padding: 3px 10px; border-radius: 30px;
                border: 1px solid #e2e8f0; font-size: 10px; color: #334155;
            }
            .gst-chip { background: #f0f9ff; border-color: #bae6fd; color: #0369a1; font-weight: 600; }
            .pan-chip { background: #fef2f2; border-color: #fecaca; color: #991b1b; font-weight: 600; }
            .invoice-badge { text-align: right; }
            .invoice-badge h2 {
                font-size: 28px; font-weight: 800; color: #0f172a;
                margin-bottom: 8px; letter-spacing: 1px;
            }
            .invoice-meta {
                background: #f8fafc; padding: 8px 12px; border-radius: 6px;
                border: 1px solid #e2e8f0; min-width: 240px;
            }
            .meta-row {
                display: flex; justify-content: space-between;
                align-items: center; margin-bottom: 4px; font-size: 11px;
            }
            .meta-label { color: #64748b; }
            .meta-value { font-weight: 700; color: #0f172a; }
            .meta-divider {
                border-top: 1px dashed #e2e8f0; margin: 6px 0;
            }
            .type-badge {
                display: inline-block; padding: 2px 8px; border-radius: 20px;
                font-size: 10px; font-weight: 700;
            }
            .status-badge {
                display: inline-block; padding: 3px 14px; font-size: 11px;
                font-weight: 700; border-radius: 30px; margin-top: 6px;
            }
            .status-badge.unpaid  { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
            .status-badge.paid    { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .status-badge.partial { background: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
            .bill-to { margin: 15px 0; }
            .section-title { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
            .accent { width: 4px; height: 22px; background: #667eea; border-radius: 2px; }
            .section-title span { font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; }
            .client-card {
                background: #fafbfc; border: 1px solid #e2e8f0; border-radius: 8px;
                padding: 12px; display: grid; grid-template-columns: 1fr 1fr;
                gap: 12px; margin-left: 10px;
            }
            .client-name { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
            .info-row { display: flex; gap: 6px; margin-bottom: 4px; font-size: 11px; }
            .info-label { color: #64748b; min-width: 45px; }
            .info-value { color: #334155; }
            .table-container {
                margin: 15px 0; border: 1px solid #e2e8f0;
                border-radius: 8px; overflow: hidden;
            }
            table { width: 100%; border-collapse: collapse; }
            th {
                background: #f8fafc; font-weight: 700; font-size: 10px;
                color: #0f172a; padding: 8px 6px; text-align: left;
                border-bottom: 2px solid #667eea; text-transform: uppercase;
            }
            td { padding: 6px 6px; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #334155; }
            .item-name { font-weight: 600; color: #0f172a; margin-bottom: 2px; font-size: 11px; }
            .item-desc { font-size: 9px; color: #64748b; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .amount-cell { font-weight: 700; color: #0f172a; background: #f8fafc; }
            .totals { display: flex; justify-content: flex-end; margin: 12px 0; }
            .totals-box {
                width: 290px; border: 1px solid #e2e8f0;
                border-radius: 6px; overflow: hidden;
            }
            .total-item {
                display: flex; justify-content: space-between;
                padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;
            }
            .total-item.sub   { background: #f8fafc; }
            .total-item.grand { background: #f1f5f9; font-weight: 800; font-size: 12px; padding: 8px 10px; }
            .total-item.balance { color: #b91c1c; font-weight: 700; border-top: 1px dashed #e2e8f0; }
            .bank-section {
                margin: 12px 0; padding: 12px; border: 1px solid #e2e8f0;
                border-radius: 8px; position: relative;
            }
            .bank-accent {
                position: absolute; left: 0; top: 0; width: 4px; height: 100%;
                background: #667eea; border-radius: 8px 0 0 8px;
            }
            .bank-title {
                font-weight: 700; color: #0f172a; font-size: 12px;
                text-transform: uppercase; margin-bottom: 8px;
                padding-left: 12px; display: flex; align-items: center; gap: 6px;
            }
            .bank-grid {
                display: grid; grid-template-columns: repeat(4, 1fr);
                gap: 8px; padding-left: 12px;
            }
            .bank-item .label {
                font-size: 9px; color: #64748b; font-weight: 600;
                text-transform: uppercase; margin-bottom: 2px; display: block;
            }
            .bank-item .value { font-weight: 600; color: #0f172a; font-size: 11px; }
            .notes {
                margin: 12px 0; padding: 10px; background: #f8fafc;
                border-radius: 6px; border: 1px solid #e2e8f0;
            }
            .notes-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
            .notes-header span:first-child { font-size: 12px; }
            .notes-header span:last-child  { font-weight: 700; color: #0f172a; font-size: 11px; }
            .notes-content { color: #475569; font-size: 11px; padding-left: 18px; }
            .signature { display: flex; justify-content: space-between; margin: 20px 0 12px; }
            .signature-box { border-top: 2px solid #94a3b8; padding-top: 6px; min-width: 160px; }
            .signature-box.right { border-top-color: #667eea; }
            .signature-title   { font-weight: 600; color: #334155; font-size: 10px; }
            .signature-company { font-weight: 700; color: #667eea; font-size: 11px; margin-top: 3px; }
            .signature-sub     { font-size: 7px; color: #64748b; text-transform: uppercase; }
            .footer {
                margin-top: 15px; padding-top: 8px; border-top: 1px dashed #cbd5e1;
                text-align: center; page-break-inside: avoid; break-inside: avoid;
            }
            .thankyou      { font-weight: 700; color: #0f172a; font-size: 12px; margin-bottom: 3px; }
            .footer-text   { color: #64748b; font-size: 9px; margin-bottom: 3px; }
            .footer-email  { color: #667eea; font-weight: 600; font-size: 9px; margin-bottom: 2px; }
            .footer-phone  { color: #64748b; font-size: 9px; }
            .footer-watermark { color: #cbd5e1; font-size: 8px; font-weight: 700; margin-top: 5px; }
            @media print {
                body { padding: 0.1in; }
                .print-container { border: none; box-shadow: none; }
                .header, .bill-to, .table-container, .totals,
                .bank-section, .notes, .signature, .footer {
                    page-break-inside: avoid; break-inside: avoid;
                }
            }
        `;
    };

    // ── Handle Print ──────────────────────────────────────
    static handlePrint = async (invoiceToView, setLoading) => {
        if (!invoiceToView) return;
        try {
            setLoading(true);
            const logoBase64 = await this.loadLogo(invoiceToView?.company?.logo_url);
            const printHTML  = this.generatePrintHTML(invoiceToView, logoBase64);
            const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
            printWindow.document.write(printHTML);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.onafterprint = () => printWindow.close();
            }, 1000);
        } catch {
            const fallbackHTML  = this.generatePrintHTML(invoiceToView, null);
            const printWindow   = window.open('', '_blank', 'width=1200,height=800');
            printWindow.document.write(fallbackHTML);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        } finally {
            setLoading(false);
        }
    };

    // ── Handle PDF Export ─────────────────────────────────
    static handleExportPDF = async (invoiceToView, setLoading, showSnackbar, html2pdf) => {
        if (!invoiceToView) return;
        setLoading(true);
        try {
            const logoBase64 = await this.loadLogo(invoiceToView?.company?.logo_url);
            const element    = document.createElement('div');
            element.innerHTML = this.generatePrintHTML(invoiceToView, logoBase64);
            document.body.appendChild(element);

            const opt = {
                margin:     [0.1, 0.1, 0.1, 0.1],
                filename:   `Invoice_${invoiceToView?.invoice_no || 'INV'}.pdf`,
                image:      { type: 'jpeg', quality: 1.0 },
                html2canvas: {
                    scale: 2, logging: false, allowTaint: true,
                    useCORS: true, letterRendering: true,
                    backgroundColor: '#ffffff',
                    windowWidth: 1200, windowHeight: 1600,
                },
                jsPDF: {
                    unit: 'in', format: 'a4',
                    orientation: 'portrait', compress: true,
                },
                pagebreak: { mode: 'avoid-all' },
            };

            await html2pdf().set(opt).from(element).save();
            document.body.removeChild(element);
            showSnackbar("PDF downloaded successfully!", "success");
        } catch (error) {
            showSnackbar("Error generating PDF: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };
}

export default InvoicePrintPDF;
