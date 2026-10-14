import { getItemAttributeSnapshot } from '../../../utils/productAttributeSnapshot';

class PurchaseOrderPrintPDF {
    static escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[character]));

    static formatCurrency = (value) => {
        const amount = Number(String(value ?? 0).replace(/,/g, '')) || 0;
        return amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    static formatDate = (value) => value
        ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

    static generateHTML = (purchaseOrder, company) => {
        const po = purchaseOrder || {};
        const vendor = po.vendor || {};
        const comp = company || po.company || {};
        const esc = this.escapeHtml;
        const items = po.items || [];

        const compName = comp.company_name || 'Krudracx';
        const compInitial = compName.charAt(0).toUpperCase() || 'K';
        const compGstin = comp.gstin || '09ABDFK0972D1ZG';
        const compAddress = comp.address || comp.city
            ? `${comp.address || ''}${comp.city ? ', ' + comp.city : ''}${comp.state ? ', ' + comp.state : ''}`.trim()
            : 'A 140 Sec-63 Noida, Uttar Pradesh';
        const compPhone = comp.phone || '7982748233';
        const compEmail = comp.email || 'abhishek@krudracx.com';
        const compLogo = comp.logo_url || comp.logo || null;

        const vendorName = vendor.company_name || vendor.vendor_name || 'Vendor';
        const vendorContact = vendor.vendor_name && vendor.company_name ? vendor.vendor_name : '';
        const vendorAddress = vendor.address
            ? `${vendor.address}${vendor.city ? ', ' + vendor.city : ''}${vendor.state ? ', ' + vendor.state : ''}${vendor.pincode ? ' - ' + vendor.pincode : ''}`
            : 'A-126 Sec-63, Noida, Uttar Pradesh, 201301';

        const subtotal = Number(po.sub_total ?? po.subtotal ?? items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0));
        const cgst = Number(po.cgst ?? 0);
        const sgst = Number(po.sgst ?? 0);
        const igst = Number(po.igst ?? 0);
        const total = Number(po.total_amount ?? (subtotal + cgst + sgst + igst));

        const rows = items.map((item, index) => {
            const attributes = getItemAttributeSnapshot(item).map((attribute) =>
                `${attribute.attribute_name || attribute.name || 'Attribute'}: ${attribute.value}`
            ).join(' · ');

            const itemQty = Number(item.qty || 1);
            const itemRate = Number(item.rate || 0);
            const itemTax = Number(item.tax_rate || 0);
            const itemAmount = Number(item.amount ?? (itemQty * itemRate));

            return `<tr>
                <td class="text-center" style="font-weight:700;color:#64748b;">${String(index + 1).padStart(2, '0')}</td>
                <td>
                    <div class="item-name">${esc(item.item_name || 'Item')}</div>
                    ${item.sku ? `<span class="sku-tag">SKU: ${esc(item.sku)}</span>` : ''}
                    ${item.description ? `<div style="font-size:10px;color:#64748b;margin-top:2px;">${esc(item.description)}</div>` : ''}
                    ${attributes ? `<div class="attr-desc">${esc(attributes)}</div>` : ''}
                </td>
                <td style="font-size:11px;color:#475569;">${esc(item.hsn_code || '998314')}</td>
                <td class="text-center" style="font-weight:700;">${esc(item.qty ?? '1')} ${esc(item.unit || 'pcs')}</td>
                <td class="text-right">₹${this.formatCurrency(itemRate)}</td>
                <td class="text-right" style="color:#64748b;">${this.formatCurrency(itemTax)}%</td>
                <td class="text-right amount-cell">₹${this.formatCurrency(itemAmount)}</td>
            </tr>`;
        }).join('');

        const statusLabel = String(po.status || 'Received').toUpperCase();
        const statusColor = statusLabel === 'RECEIVED' ? '#15803d' : statusLabel === 'APPROVED' ? '#0369a1' : '#b45309';
        const statusBg = statusLabel === 'RECEIVED' ? '#dcfce7' : statusLabel === 'APPROVED' ? '#e0f2fe' : '#fef3c7';

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Purchase Order ${esc(po.po_number || '')}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: white;
            color: #0f172a;
            font-size: 11px;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
        }
        .print-container {
            max-width: 1000px;
            width: 100%;
            margin: 0 auto;
            background: white;
            padding: 10px;
        }

        /* ═══ HEADER ═══ */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 2px solid #0f766e;
        }
        .logo-area {
            display: flex;
            align-items: flex-start;
            gap: 12px;
        }
        .logo-fallback {
            width: 54px;
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0d9488 0%, #047857 100%);
            border-radius: 10px;
            color: white;
            font-size: 26px;
            font-weight: 800;
            box-shadow: 0 4px 12px rgba(13, 148, 136, 0.25);
            flex-shrink: 0;
            overflow: hidden;
        }
        .logo-fallback img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .company-info h1 {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 3px;
            letter-spacing: -0.3px;
        }
        .company-details {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 3px;
        }
        .detail-chip {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            background: #f8fafc;
            padding: 3px 9px;
            border-radius: 20px;
            border: 1px solid #e2e8f0;
            font-size: 9.5px;
            color: #334155;
            font-weight: 500;
        }
        .gst-chip {
            background: #f0fdfa;
            border-color: #99f6e4;
            color: #0f766e;
            font-weight: 700;
        }

        /* PO Badge */
        .invoice-badge {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        .invoice-badge h2 {
            font-size: 24px;
            font-weight: 900;
            color: #0f766e;
            letter-spacing: 0.8px;
            margin-bottom: 6px;
        }
        .invoice-meta {
            background: #f8fafc;
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            width: 230px;
            display: block;
            text-align: left;
        }
        .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 3px;
            font-size: 10.5px;
        }
        .meta-label { color: #64748b; font-weight: 500; }
        .meta-value { font-weight: 700; color: #0f172a; }
        .status-badge {
            display: inline-block;
            padding: 3px 12px;
            font-size: 10px;
            font-weight: 800;
            border-radius: 20px;
            margin-top: 5px;
            text-transform: uppercase;
            background: ${statusBg};
            color: ${statusColor};
            border: 1px solid #86efac;
        }

        /* ═══ PARTIES CARDS ═══ */
        .parties-wrap {
            display: flex;
            gap: 14px;
            margin-bottom: 14px;
        }
        .party-card {
            flex: 1;
            background: #fafbfc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            position: relative;
        }
        .party-card.vendor {
            background: #f0fdfa;
            border-color: #ccfbf1;
            border-left: 4px solid #0f766e;
        }
        .party-card.buyer {
            border-left: 4px solid #3b82f6;
        }
        .section-tag {
            font-size: 9.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 4px;
        }
        .vendor .section-tag { color: #0f766e; }
        .buyer .section-tag { color: #2563eb; }
        .party-name {
            font-size: 14px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 4px;
        }
        .info-row {
            display: flex;
            gap: 6px;
            margin-bottom: 3px;
            font-size: 10.5px;
        }
        .info-label { color: #64748b; min-width: 52px; font-weight: 500; }
        .info-value { color: #334155; }

        /* ═══ TABLE ═══ */
        .table-container {
            margin: 14px 0;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #0f766e;
            font-weight: 700;
            font-size: 10px;
            color: #ffffff;
            padding: 9px 8px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        td {
            padding: 10px 8px;
            font-size: 11px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: top;
        }
        tr:nth-child(even) td { background: #fafbfc; }
        .item-name {
            font-weight: 700;
            color: #0f172a;
            font-size: 12.5px;
            margin-bottom: 2px;
        }
        .sku-tag {
            display: inline-block;
            font-size: 9px;
            font-weight: 600;
            color: #0f766e;
            background: #f0fdfa;
            padding: 1px 5px;
            border-radius: 4px;
            border: 1px solid #99f6e4;
            margin-top: 2px;
        }
        .attr-desc {
            font-size: 10px;
            color: #475569;
            margin-top: 4px;
            line-height: 1.35;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .amount-cell {
            font-weight: 800;
            color: #0f172a;
            background: #f8fafc;
        }

        /* ═══ TOTALS & NOTES ═══ */
        .summary-wrap {
            display: flex;
            gap: 16px;
            align-items: flex-start;
            margin: 12px 0 16px 0;
        }
        .notes-card {
            flex: 1;
            background: #fafbfc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 10px;
            color: #475569;
            line-height: 1.5;
        }
        .notes-header {
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .notes-card ol { margin-left: 16px; }

        .totals-box {
            width: 290px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .total-item {
            display: flex;
            justify-content: space-between;
            padding: 7px 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 11px;
        }
        .total-item .lbl { color: #64748b; font-weight: 500; }
        .total-item .val { color: #0f172a; font-weight: 600; }
        .total-item.grand {
            background: #0f766e;
            color: white;
            font-weight: 800;
            font-size: 14px;
            padding: 11px 12px;
            border-bottom: none;
        }
        .total-item.grand .lbl { color: white; font-weight: 700; }
        .total-item.grand .val { color: white; }

        /* ═══ DISPATCH INFO STRIP ═══ */
        .dispatch-strip {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px dashed #cbd5e1;
            border-radius: 6px;
            padding: 8px 14px;
            font-size: 10px;
            color: #334155;
            margin-bottom: 22px;
        }

        /* ═══ SIGNATURES ═══ */
        .signature-container {
            display: flex;
            justify-content: space-between;
            margin-top: 32px;
            padding-top: 10px;
        }
        .signature-box {
            width: 210px;
            text-align: center;
        }
        .sig-line {
            border-top: 1px dashed #94a3b8;
            padding-top: 6px;
            margin-top: 45px;
            font-size: 10px;
            color: #64748b;
        }
        .sig-company {
            font-weight: 700;
            color: #0f172a;
            font-size: 11px;
            margin-top: 2px;
        }

        /* ═══ FOOTER ═══ */
        .footer {
            margin-top: 28px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 9.5px;
            color: #94a3b8;
            letter-spacing: 0.3px;
        }

        @media print {
            body { background: white; padding: 0; }
            .print-container { padding: 0; max-width: 100%; border: none; }
        }
    </style>
</head>
<body>
    <div class="print-container">
        <!-- ═══ HEADER ═══ -->
        <div class="header">
            <div class="logo-area">
                <div class="logo-fallback">
                    ${compLogo ? `<img src="${compLogo}" alt="Logo" />` : compInitial}
                </div>
                <div class="company-info">
                    <h1>${esc(compName)}</h1>
                    <div class="company-details">
                        <span class="detail-chip">📍 ${esc(compAddress)}</span>
                        <span class="detail-chip">📞 ${esc(compPhone)}</span>
                        <span class="detail-chip">✉️ ${esc(compEmail)}</span>
                    </div>
                    <div class="company-details" style="margin-top:4px;">
                        <span class="detail-chip gst-chip">GSTIN: ${esc(compGstin)}</span>
                    </div>
                </div>
            </div>

            <div class="invoice-badge">
                <h2>PURCHASE ORDER</h2>
                <div class="invoice-meta">
                    <div class="meta-row"><span class="meta-label">PO Number:</span><span class="meta-value">${esc(po.po_number || '—')}</span></div>
                    <div class="meta-row"><span class="meta-label">PO Date:</span><span class="meta-value">${this.formatDate(po.po_date)}</span></div>
                    <div class="meta-row"><span class="meta-label">Delivery Due:</span><span class="meta-value">${this.formatDate(po.expected_delivery_date || po.po_date)}</span></div>
                    <div class="meta-row"><span class="meta-label">Supply Type:</span><span class="meta-value">${esc(po.supply_type === 'inter' ? 'Inter-state' : 'Intra-state (UP)')}</span></div>
                </div>
                <span class="status-badge">✓ ${statusLabel}</span>
            </div>
        </div>

        <!-- ═══ PARTIES ═══ -->
        <div class="parties-wrap">
            <div class="party-card vendor">
                <div class="section-tag">SUPPLIER / VENDOR</div>
                <div class="party-name">${esc(vendorName)}</div>
                <div class="info-row"><span class="info-label">Attn:</span><span class="info-value"><b>${esc(vendorContact || vendorName)}</b></span></div>
                <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${esc(vendorAddress)}</span></div>
                ${vendor.phone ? `<div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${esc(vendor.phone)}</span></div>` : ''}
                ${vendor.email ? `<div class="info-row"><span class="info-label">Email:</span><span class="info-value">${esc(vendor.email)}</span></div>` : ''}
                <div style="margin-top:5px;"><span class="detail-chip gst-chip">Place of Supply: ${esc(po.place_of_supply || '09 (UP)')}</span></div>
            </div>

            <div class="party-card buyer">
                <div class="section-tag">SHIP TO / BILLING DESTINATION</div>
                <div class="party-name">${esc(compName)}</div>
                <div class="info-row"><span class="info-label">Facility:</span><span class="info-value"><b>Central IT Logistics Hub</b></span></div>
                <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${esc(compAddress)}</span></div>
                <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${esc(compPhone)}</span></div>
                <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${esc(compEmail)}</span></div>
                <div style="margin-top:5px;"><span class="detail-chip gst-chip">GSTIN: ${esc(compGstin)}</span></div>
            </div>
        </div>

        <!-- ═══ ITEMS TABLE ═══ -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width:35px;" class="text-center">#</th>
                        <th>ITEM DESCRIPTION &amp; SPECIFICATIONS</th>
                        <th style="width:80px;">HSN/SAC</th>
                        <th style="width:70px;" class="text-center">QTY</th>
                        <th style="width:90px;" class="text-right">RATE (₹)</th>
                        <th style="width:65px;" class="text-right">GST %</th>
                        <th style="width:105px;" class="text-right">NET AMOUNT (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:20px;">No items found</td></tr>'}
                </tbody>
            </table>
        </div>

        <!-- ═══ TOTALS & NOTES ═══ -->
        <div class="summary-wrap">
            <div class="notes-card">
                <div class="notes-header">📝 TERMS &amp; CONDITIONS / DELIVERY PROTOCOL</div>
                ${po.terms_conditions || po.notes ? `
                    <div>${esc(po.terms_conditions || po.notes)}</div>
                ` : `
                    <ol>
                        <li>Payment terms: Net 30 days as per agreed vendor credit cycle.</li>
                        <li>Vendor Tax Invoice mandatory along with material physical delivery.</li>
                        <li>Goods received subject to technical verification and serial matching.</li>
                    </ol>
                `}
            </div>

            <div class="totals-box">
                <div class="total-item">
                    <span class="lbl">Taxable Subtotal</span>
                    <span class="val">₹${this.formatCurrency(subtotal)}</span>
                </div>
                ${cgst > 0 ? `
                <div class="total-item">
                    <span class="lbl" style="padding-left:10px;">CGST (${po.tax_rate ? (po.tax_rate / 2).toFixed(2) : '9.00'}%)</span>
                    <span class="val">₹${this.formatCurrency(cgst)}</span>
                </div>` : ''}
                ${sgst > 0 ? `
                <div class="total-item">
                    <span class="lbl" style="padding-left:10px;">SGST (${po.tax_rate ? (po.tax_rate / 2).toFixed(2) : '9.00'}%)</span>
                    <span class="val">₹${this.formatCurrency(sgst)}</span>
                </div>` : ''}
                ${igst > 0 ? `
                <div class="total-item">
                    <span class="lbl" style="padding-left:10px;">IGST (${po.tax_rate ? Number(po.tax_rate).toFixed(2) : '18.00'}%)</span>
                    <span class="val">₹${this.formatCurrency(igst)}</span>
                </div>` : ''}
                <div class="total-item grand">
                    <span class="lbl">Grand Total PO</span>
                    <span class="val">₹${this.formatCurrency(total)}</span>
                </div>
            </div>
        </div>

        <!-- ═══ DISPATCH INFO STRIP ═══ -->
        <div class="dispatch-strip">
            <span>📦 <strong>Dispatch Mode:</strong> Direct Courier / Hand Delivery</span>
            <span>📍 <strong>Inspection Point:</strong> QA Gate #2</span>
            <span>⚡ <strong>Urgency:</strong> Standard Delivery</span>
        </div>

        <!-- ═══ SIGNATURES ═══ -->
        <div class="signature-container">
            <div class="signature-box">
                <div class="sig-line">
                    SUPPLIER CONFIRMATION<br>
                    <div class="sig-company">${esc(vendorName)}</div>
                </div>
            </div>
            <div class="signature-box">
                <div class="sig-line">
                    AUTHORIZED SIGNATORY<br>
                    <div class="sig-company">For ${esc(compName)}</div>
                </div>
            </div>
        </div>

        <!-- ═══ FOOTER ═══ -->
        <div class="footer">
            THANK YOU FOR YOUR BUSINESS! · This is an authentic computer-generated Purchase Order issued by ${esc(compName)}.
        </div>
    </div>
</body>
</html>`;
    };

    static handlePrint = async (purchaseOrder, setLoading, company) => {
        if (!purchaseOrder) return;
        setLoading(true);
        try {
            const printWindow = window.open('', '_blank', 'width=1100,height=800,scrollbars=yes');
            if (!printWindow) throw new Error('Please allow pop-ups to print the purchase order.');
            printWindow.document.write(this.generateHTML(purchaseOrder, company));
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.onafterprint = () => printWindow.close();
            }, 400);
        } finally {
            setLoading(false);
        }
    };

    static handleExportPDF = async (purchaseOrder, setLoading, showSnackbar, html2pdf, company) => {
        if (!purchaseOrder) return;
        setLoading(true);
        let element;
        try {
            element = document.createElement('div');
            element.innerHTML = this.generateHTML(purchaseOrder, company);
            document.body.appendChild(element);

            let html2pdfLib = html2pdf;
            if (!html2pdfLib) {
                const mod = await import('html2pdf.js');
                html2pdfLib = mod.default || mod;
            }

            const opt = {
                margin:     [0.1, 0.1, 0.1, 0.1],
                filename:   `Purchase_Order_${purchaseOrder.po_number || 'PO'}.pdf`,
                image:      { type: 'jpeg', quality: 0.98 },
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

            await html2pdfLib().set(opt).from(element).save();
            showSnackbar('Purchase Order PDF downloaded!', 'success');
        } catch (error) {
            showSnackbar(`Error generating PO PDF: ${error.message}`, 'error');
        } finally {
            if (element?.parentNode) element.parentNode.removeChild(element);
            setLoading(false);
        }
    };
}

export default PurchaseOrderPrintPDF;