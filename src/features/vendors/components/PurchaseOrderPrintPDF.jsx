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

    static generateHTML = (purchaseOrder) => {
        const po = purchaseOrder || {};
        const vendor = po.vendor || {};
        const esc = this.escapeHtml;
        const items = po.items || [];
        const rows = items.map((item, index) => {
            const attributes = getItemAttributeSnapshot(item).map((attribute) =>
                `${attribute.attribute_name || attribute.name || 'Attribute'}: ${attribute.value}`
            ).join(' · ');
            return `<tr>
                <td class="center">${String(index + 1).padStart(2, '0')}</td>
                <td><strong>${esc(item.item_name || 'Item')}</strong>
                    ${item.description ? `<div class="muted">${esc(item.description)}</div>` : ''}
                    ${item.sku ? `<div class="muted">SKU: ${esc(item.sku)}</div>` : ''}
                    ${attributes ? `<div class="attributes">${esc(attributes)}</div>` : ''}
                </td>
                <td>${esc(item.hsn_code || '—')}</td>
                <td class="center">${esc(item.qty ?? '—')} ${esc(item.unit || '')}</td>
                <td class="right">₹${this.formatCurrency(item.rate)}</td>
                <td class="right">${this.formatCurrency(item.tax_rate)}%</td>
                <td class="right">₹${this.formatCurrency(item.amount ?? (Number(item.qty || 0) * Number(item.rate || 0)))}</td>
            </tr>`;
        }).join('');
        const vendorName = vendor.company_name || vendor.vendor_name || 'Vendor';
        const subtotal = po.sub_total ?? po.subtotal ?? items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        return `<!DOCTYPE html>
            <html><head><meta charset="UTF-8"><title>Purchase Order ${esc(po.po_number || '')}</title>
            <style>
                *{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#0f172a;font:13px Arial,sans-serif}
                .page{width:210mm;min-height:297mm;margin:18px auto;padding:18mm;background:#fff;box-shadow:0 2px 14px #0002}
                .top{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #11998e;padding-bottom:18px}
                h1{margin:0;color:#0f766e;font-size:24px;letter-spacing:1px}.sub{margin-top:5px;color:#64748b}
                .meta{text-align:right;line-height:1.8}.meta strong{color:#0f172a}.vendor{margin:22px 0;padding:14px 16px;background:#f0fdfa;border-left:4px solid #11998e}
                .label{font-size:10px;font-weight:bold;color:#64748b;letter-spacing:.7px}.vendor-name{font-size:17px;font-weight:bold;margin:5px 0}
                .vendor-line{margin-top:3px;color:#475569}.table-wrap{margin-top:22px}table{width:100%;border-collapse:collapse}
                th{padding:10px 8px;background:#0f766e;color:#fff;text-align:left;font-size:10px;letter-spacing:.4px}
                td{padding:11px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}tr{page-break-inside:avoid}
                .center{text-align:center}.right{text-align:right;white-space:nowrap}.muted{margin-top:4px;color:#64748b;font-size:11px;line-height:1.4}
                .attributes{margin-top:5px;color:#0f766e;font-size:11px;font-weight:600;line-height:1.45}
                .bottom{display:flex;justify-content:space-between;gap:30px;margin-top:24px}.notes{flex:1;color:#475569;white-space:pre-wrap;line-height:1.5}
                .totals{width:250px}.total{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e2e8f0}
                .grand{margin-top:5px;padding:11px;background:#0f766e;color:#fff;font-weight:bold;font-size:15px}
                .terms{margin-top:25px;padding-top:12px;border-top:1px dashed #cbd5e1;color:#64748b;white-space:pre-wrap;line-height:1.5}
                .footer{margin-top:30px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:10px}
                @media print{body{background:#fff}.page{margin:0;box-shadow:none;width:auto;min-height:0;padding:12mm}}
            </style></head><body><main class="page">
                <header class="top"><div><h1>PURCHASE ORDER</h1><div class="sub">Purchase document</div></div>
                    <div class="meta"><div><strong>PO No:</strong> ${esc(po.po_number || '—')}</div>
                    <div><strong>Date:</strong> ${this.formatDate(po.po_date)}</div>
                    ${po.expected_delivery_date ? `<div><strong>Expected delivery:</strong> ${this.formatDate(po.expected_delivery_date)}</div>` : ''}
                    <div><strong>Status:</strong> ${esc(po.status || 'pending')}</div></div></header>
                <section class="vendor"><div class="label">SUPPLIER</div><div class="vendor-name">${esc(vendorName)}</div>
                    ${vendor.vendor_name && vendor.company_name ? `<div class="vendor-line">${esc(vendor.vendor_name)}</div>` : ''}
                    ${vendor.address ? `<div class="vendor-line">${esc(vendor.address)}</div>` : ''}
                    ${vendor.phone ? `<div class="vendor-line">Phone: ${esc(vendor.phone)}</div>` : ''}
                    ${vendor.email ? `<div class="vendor-line">Email: ${esc(vendor.email)}</div>` : ''}
                    ${vendor.gstin ? `<div class="vendor-line">GSTIN: ${esc(vendor.gstin)}</div>` : ''}</section>
                <section class="table-wrap"><table><thead><tr><th>#</th><th>ITEM DESCRIPTION</th><th>HSN</th><th>QTY</th><th>RATE</th><th>TAX</th><th>AMOUNT</th></tr></thead>
                    <tbody>${rows || '<tr><td colspan="7" class="center">No items</td></tr>'}</tbody></table></section>
                <section class="bottom"><div class="notes">${po.notes ? `<strong>Notes</strong><br>${esc(po.notes)}` : ''}</div>
                    <div class="totals"><div class="total"><span>Subtotal</span><strong>₹${this.formatCurrency(subtotal)}</strong></div>
                    <div class="total"><span>CGST</span><span>₹${this.formatCurrency(po.cgst)}</span></div>
                    <div class="total"><span>SGST</span><span>₹${this.formatCurrency(po.sgst)}</span></div>
                    <div class="total"><span>IGST</span><span>₹${this.formatCurrency(po.igst)}</span></div>
                    <div class="total grand"><span>Total</span><span>₹${this.formatCurrency(po.total_amount)}</span></div></div></section>
                ${po.terms_conditions ? `<section class="terms"><strong>Terms &amp; Conditions</strong><br>${esc(po.terms_conditions)}</section>` : ''}
                <footer class="footer">This is a computer-generated purchase order.</footer>
            </main></body></html>`;
    };

    static handlePrint = async (purchaseOrder, setLoading) => {
        if (!purchaseOrder) return;
        setLoading(true);
        try {
            const printWindow = window.open('', '_blank', 'width=1100,height=800,scrollbars=yes');
            if (!printWindow) throw new Error('Please allow pop-ups to print the purchase order.');
            printWindow.document.write(this.generateHTML(purchaseOrder));
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

    static handleExportPDF = async (purchaseOrder, setLoading, showSnackbar, html2pdf) => {
        if (!purchaseOrder) return;
        setLoading(true);
        let element;
        try {
            element = document.createElement('div');
            element.innerHTML = this.generateHTML(purchaseOrder);
            document.body.appendChild(element);
            await html2pdf().set({
                margin: [0.1, 0.1, 0.1, 0.1],
                filename: `Purchase_Order_${purchaseOrder.po_number || 'PO'}.pdf`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1000 },
                jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait', compress: true },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            }).from(element).save();
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
