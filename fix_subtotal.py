import os

file_path = "src/pages/InvoiceList.jsx"
if not os.path.exists(file_path):
    print("❌ src/pages/InvoiceList.jsx nahi mila! Check current directory.")
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

pos = text.find("calculateInvoiceTotals")
if pos == -1:
    print("❌ calculateInvoiceTotals function nahi mila!")
    exit(1)

# Function ka start aur closing brace dhundo
start = text.rfind("const calculateInvoiceTotals", 0, pos + 30)
if start == -1:
    start = text.rfind("function calculateInvoiceTotals", 0, pos + 30)

open_brace = text.find("{", pos)
idx = open_brace + 1
depth = 1
while idx < len(text) and depth > 0:
    if text[idx] == "{":
        depth += 1
    elif text[idx] == "}":
        depth -= 1
    idx += 1

if idx < len(text) and text[idx] == ";":
    idx += 1

new_func = '''const calculateInvoiceTotals = () => {
        const toNum = (val) => {
            if (val === null || val === undefined) return 0;
            if (typeof val === 'number') return isNaN(val) ? 0 : val;
            const cleaned = String(val).replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        };

        let subTotal = 0;
        let totalTax = 0;

        (formData.items || []).forEach((item) => {
            const qty = toNum(item.qty) || 1;
            const rate = toNum(item.rate);
            const explicitAmt = toNum(item.amount);
            const itemAmt = explicitAmt > 0 ? explicitAmt : (qty * rate);

            const taxRate = toNum(item.tax_rate) || 18;
            const explicitTax = toNum(item.tax_amount);
            const itemTax = explicitTax > 0 ? explicitTax : ((itemAmt * taxRate) / 100);

            subTotal += itemAmt;
            totalTax += itemTax;
        });

        let cgst = 0, sgst = 0, igst = 0;
        if (gstType === 'intra') {
            cgst = (totalTax / 2).toFixed(2);
            sgst = (totalTax / 2).toFixed(2);
        } else {
            igst = totalTax.toFixed(2);
        }

        const grand = (subTotal + totalTax).toFixed(2);
        const sub = subTotal.toFixed(2);

        return {
            subTotal: sub,
            subtotal: sub,
            sub_total: sub,
            cgst: String(cgst),
            sgst: String(sgst),
            igst: String(igst),
            grandTotal: grand,
            total: grand,
            total_amount: grand,
        };
    };'''

updated_text = text[:start] + new_func + text[idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(updated_text)

print("✅ SUCCESS: calculateInvoiceTotals in InvoiceList.jsx successfully updated with all aliases & numeric parsing!")
