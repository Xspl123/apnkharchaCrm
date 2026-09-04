import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Container, LinearProgress } from "@mui/material";
import {
    getInvoices,
    getNextInvoiceNumber,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    reset,
} from "../redux/features/invoiceSlice";
import { getClients } from "../redux/features/clientSlice";
import { getCompanies } from "../redux/features/companySlice";
import { getHsnCodes } from "../redux/features/hsnCodeSlice";
import { getProducts } from "../features/inventory/state/inventorySlice";
import InvoiceDialogs from "./invoices/components/InvoiceDialogs";
import InvoiceFormSection from "./invoices/components/InvoiceFormSection";
import InvoiceListHeader from "./invoices/components/InvoiceListHeader";
import InvoiceTableSection from "./invoices/components/InvoiceTableSection";
import "./InvoiceList.css";

const defaultInvoiceItem = () => ({
    item_name: "",
    description: "",
    hsn_code: "",
    qty: 1,
    unit: "pcs",
    rate: 0,
    tax_rate: 18,
    amount: 0,
    tax_amount: 0,
    product_id: null,
});

const defaultDates = () => ({
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
});

const InvoiceList = () => {
    const dispatch = useDispatch();
    const invoicePrintRef = useRef();
    const loadInvoicePrintModule = useCallback(
        () => import("../components/InvoicePrintPDF/InvoicePrintPDF"),
        []
    );

    const invoiceState = useSelector((state) => state.invoices);
    const invoices = invoiceState?.invoices || [];
    const nextInvoiceNumber = invoiceState?.nextInvoiceNumber || "";

    const clientState = useSelector((state) => state.clients);
    const clients = clientState?.clients || [];

    const companyState = useSelector((state) => state.companies);
    const companies = companyState?.companies || [];

    const hsnCodeState = useSelector((state) => state.hsnCodes);
    const hsnCodes = hsnCodeState?.hsnCodes || [];

    const { products } = useSelector((state) => state.inventory);

    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [gstType, setGstType] = useState('intra');
    const [, setActiveStep] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [returnDialog, setReturnDialog] = useState(false);
    const [invoiceToReturn, setInvoiceToReturn] = useState(null);

    const [formData, setFormData] = useState({
        company_id: "",
        client_id: "",
        invoice_no: "",
        ...defaultDates(),
        cgst: 0,
        sgst: 0,
        igst: 0,
        notes: "",
        terms_conditions: "1. Payment due within 15 days\n2. Interest @ 18% p.a. on delayed payments\n3. This is a computer-generated invoice",
        invoice_type: "b2b",
        place_of_supply: "",
        is_reverse_charge: false,
        items: [defaultInvoiceItem()],
    });

    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [viewDialog, setViewDialog] = useState(false);
    const [invoiceToView, setInvoiceToView] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const appendSpeech = (value, transcript) =>
        [value, transcript].filter(Boolean).join(' ').trim();

    const showSnackbar = (message, severity = "success") =>
        setSnackbar({ open: true, message, severity });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                dispatch(getInvoices()),
                dispatch(getClients()),
                dispatch(getCompanies()),
                dispatch(getHsnCodes()),
                dispatch(getProducts()),
            ]);
        } catch {
            showSnackbar("Error loading data", "error");
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        loadData();
        return () => { dispatch(reset()); };
    }, [dispatch, loadData]);

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount || 0);

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
        });
    };

    const calculateItemTotals = (item) => {
        const qty = parseFloat(item.qty) || 0;
        const rate = parseFloat(item.rate) || 0;
        const taxRate = parseFloat(item.tax_rate) || 0;
        const amount = qty * rate;
        const taxAmount = (amount * taxRate) / 100;
        return { ...item, amount: amount.toFixed(2), tax_amount: taxAmount.toFixed(2) };
    };

    const calculateInvoiceTotals = () => {
        let subTotal = 0, totalTax = 0;
        formData.items.forEach((item) => {
            subTotal += parseFloat(item.amount) || 0;
            totalTax += parseFloat(item.tax_amount) || 0;
        });
        let cgst = 0, sgst = 0, igst = 0;
        if (gstType === 'intra') {
            cgst = (totalTax / 2).toFixed(2);
            sgst = (totalTax / 2).toFixed(2);
        } else {
            igst = totalTax.toFixed(2);
        }
        return {
            subTotal: subTotal.toFixed(2),
            cgst,
            sgst,
            igst,
            grandTotal: (subTotal + totalTax).toFixed(2),
        };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;
        updatedItems[index] = calculateItemTotals(updatedItems[index]);
        setFormData((prev) => ({ ...prev, items: updatedItems }));
    };

    const handleHsnSelect = (index, hsnCodeObj) => {
        if (hsnCodeObj) {
            const updatedItems = [...formData.items];
            updatedItems[index] = {
                ...updatedItems[index],
                hsn_code: hsnCodeObj.hsn_code,
                tax_rate: parseFloat(hsnCodeObj.gst_rate),
                description: hsnCodeObj.description,
                ...(updatedItems[index].item_name === '' && {
                    item_name: hsnCodeObj.description,
                }),
            };
            updatedItems[index] = calculateItemTotals(updatedItems[index]);
            setFormData((prev) => ({ ...prev, items: updatedItems }));
        }
    };

    const handleProductSelect = (index, product) => {
        if (!product) {
            handleItemChange(index, 'product_id', null);
            return;
        }
        const updatedItems = [...formData.items];
        updatedItems[index] = {
            ...updatedItems[index],
            product_id: product.id,
            item_name: product.name,
            hsn_code: product.hsn_code || updatedItems[index].hsn_code,
            unit: product.unit || 'pcs',
            rate: parseFloat(product.selling_price) || 0,
            tax_rate: parseFloat(product.tax_rate) || 18,
            description: updatedItems[index].description || product.description || '',
        };
        updatedItems[index] = calculateItemTotals(updatedItems[index]);
        setFormData((prev) => ({ ...prev, items: updatedItems }));
        showSnackbar(`${product.name} — auto filled! ✅`, 'success');
    };

    const handleAddItem = () => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, defaultInvoiceItem()],
        }));
    };

    const handleRemoveItem = (index) => {
        if (formData.items.length > 1) {
            const updatedItems = formData.items.filter((_, i) => i !== index);
            setFormData((prev) => ({ ...prev, items: updatedItems }));
        } else {
            showSnackbar("At least one item is required", "warning");
        }
    };

    const handleOpenForm = async () => {
        if (!showForm) {
            setActiveStep(0);
            await dispatch(getNextInvoiceNumber());
            setFormData((prev) => ({
                ...prev,
                invoice_no: nextInvoiceNumber || `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`,
                ...defaultDates(),
            }));
        }
        setShowForm(!showForm);
        setEditMode(false);
        setSelectedInvoice(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.company_id) { showSnackbar("Please select your company!", "error"); return; }
        if (!formData.client_id) { showSnackbar("Please select a client!", "error"); return; }
        if (formData.items.some(item => !item.item_name || !item.hsn_code || !item.rate || item.rate <= 0)) {
            showSnackbar("Please fill all item details correctly!", "error"); return;
        }

        for (const item of formData.items) {
            if (!item.product_id) continue;
            const linkedProduct = products?.find((p) => p.id === item.product_id);
            if (!linkedProduct) continue;

            if (linkedProduct.is_out_of_stock || linkedProduct.current_stock <= 0) {
                showSnackbar(`❌ "${linkedProduct.name}" out of stock hai! Invoice create nahi ho sakta.`, "error");
                return;
            }
            if (Number(item.qty) > Number(linkedProduct.current_stock)) {
                showSnackbar(
                    `❌ "${linkedProduct.name}" — Requested: ${item.qty} ${linkedProduct.unit}, Available: ${linkedProduct.current_stock} ${linkedProduct.unit}`,
                    "error"
                );
                return;
            }
        }

        const totals = calculateInvoiceTotals();
        const submitData = {
            ...formData,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: totals.igst,
            total_amount: totals.grandTotal,
            sub_total: totals.subTotal,
            balance_amount: totals.grandTotal,
            status: 'unpaid',
            supply_type: gstType,
            invoice_type: formData.invoice_type,
            place_of_supply: formData.place_of_supply,
            is_reverse_charge: formData.is_reverse_charge,
        };

        try {
            setLoading(true);
            if (editMode && selectedInvoice) {
                await dispatch(updateInvoice({ id: selectedInvoice.id, data: submitData })).unwrap();
                showSnackbar("Invoice updated successfully!", "success");
            } else {
                await dispatch(createInvoice(submitData)).unwrap();
                showSnackbar("Invoice created successfully!", "success");
            }
            handleCancel();
            await dispatch(getInvoices());
        } catch (err) {
            showSnackbar(getErrorMessage(err, "Operation failed!"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (invoice) => {
        setEditMode(true);
        setSelectedInvoice(invoice);
        let companyId = invoice.company_id;
        if (!companyId && companies.length > 0) {
            const clientName = invoice.client?.company_name;
            if (clientName) {
                const matchedCompany = companies.find(c =>
                    c.company_name.toLowerCase().includes(clientName.toLowerCase()) ||
                    clientName.toLowerCase().includes(c.company_name.toLowerCase())
                );
                companyId = matchedCompany?.id || companies[0]?.id || "";
            } else {
                companyId = companies[0]?.id || "";
            }
        }
        const fmtD = (d) => d ? new Date(d).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        const processedItems = invoice.items?.map(item => ({
            item_name: item.item_name || "",
            description: item.description || "",
            hsn_code: item.hsn_code || "",
            qty: parseFloat(item.qty) || 1,
            unit: item.unit || "pcs",
            rate: parseFloat(String(item.rate).replace(/,/g, '')) || 0,
            tax_rate: parseFloat(item.tax_rate) || 18,
            amount: parseFloat(String(item.amount).replace(/,/g, '')) || 0,
            tax_amount: parseFloat(String(item.tax_amount).replace(/,/g, '')) || 0,
            product_id: item.product_id || null,
        })) || [];
        setFormData({
            company_id: companyId,
            client_id: invoice.client_id || invoice.client?.id || "",
            invoice_no: invoice.invoice_no || "",
            invoice_date: fmtD(invoice.invoice_date),
            due_date: fmtD(invoice.due_date),
            cgst: parseFloat(invoice.cgst) || 0,
            sgst: parseFloat(invoice.sgst) || 0,
            igst: parseFloat(invoice.igst) || 0,
            notes: invoice.notes || "",
            terms_conditions: invoice.terms_conditions || "",
            invoice_type: invoice.invoice_type || "b2b",
            place_of_supply: invoice.place_of_supply || "",
            is_reverse_charge: invoice.is_reverse_charge || false,
            items: processedItems,
        });
        setGstType(parseFloat(invoice.igst) > 0 ? 'inter' : 'intra');
        setShowForm(true);
    };

    const handleDeleteConfirm = (invoice) => {
        setInvoiceToDelete(invoice);
        setDeleteDialog(true);
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            await dispatch(deleteInvoice(invoiceToDelete.id)).unwrap();
            showSnackbar("Invoice deleted successfully!", "success");
            setDeleteDialog(false);
            setInvoiceToDelete(null);
            await dispatch(getInvoices());
        } catch (err) {
            showSnackbar(getErrorMessage(err, "Failed to delete invoice!"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleView = (invoice) => {
        setInvoiceToView(invoice);
        setViewDialog(true);
    };

    const handleReturnClick = (invoice) => {
        setInvoiceToReturn(invoice);
        setReturnDialog(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditMode(false);
        setSelectedInvoice(null);
        setGstType('intra');
        setActiveStep(0);
        setFormData((prev) => ({
            company_id: "",
            client_id: "",
            invoice_no: "",
            ...defaultDates(),
            cgst: 0,
            sgst: 0,
            igst: 0,
            notes: "",
            terms_conditions: prev.terms_conditions,
            invoice_type: "b2b",
            place_of_supply: "",
            is_reverse_charge: false,
            items: [defaultInvoiceItem()],
        }));
    };

    const handlePrint = async () => {
        const { default: InvoicePrintPDF } = await loadInvoicePrintModule();
        return InvoicePrintPDF.handlePrint(invoiceToView, setLoading, showSnackbar);
    };

    const handleExportPDF = async () => {
        const [{ default: InvoicePrintPDF }, { default: html2pdf }] = await Promise.all([
            loadInvoicePrintModule(),
            import("html2pdf.js"),
        ]);
        return InvoicePrintPDF.handleExportPDF(
            invoiceToView,
            setLoading,
            showSnackbar,
            html2pdf
        );
    };

    const filteredInvoices = invoices.filter((invoice) => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
            invoice.invoice_no?.toLowerCase().includes(searchLower) ||
            invoice.client?.company_name?.toLowerCase().includes(searchLower) ||
            invoice.status?.toLowerCase().includes(searchLower) ||
            formatCurrency(invoice.total_amount).includes(searchLower);
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const paginatedInvoices = filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const handleChangePage = (_, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const totals = calculateInvoiceTotals();

    const statistics = {
        total: invoices.length,
        paid: invoices.filter(i => i.status === "paid").length,
        unpaid: invoices.filter(i => i.status === "unpaid").length,
        return: invoices.filter(i => i.status === "return").length,
        partial: invoices.filter(i => i.status === "partial").length,
        overdue: invoices.filter(i => i.status === "overdue").length,
        totalAmount: invoices.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0),
        totalPaid: invoices.reduce((s, i) => s + parseFloat(i.paid_amount || 0), 0),
        totalBalance: invoices.reduce((s, i) => s + parseFloat(i.balance_amount || 0), 0),
    };

    return (
        <>
            {loading && (
                <Box className="invoice-page__loader">
                    <LinearProgress color="primary" />
                </Box>
            )}

            <Container maxWidth="xl" className="invoice-page__shell">
                <InvoiceListHeader
                    appendSpeech={appendSpeech}
                    dateFilter={dateFilter}
                    formatCurrency={formatCurrency}
                    handleOpenForm={handleOpenForm}
                    loadData={loadData}
                    searchQuery={searchQuery}
                    setDateFilter={setDateFilter}
                    setSearchQuery={setSearchQuery}
                    setStatusFilter={setStatusFilter}
                    showForm={showForm}
                    statistics={statistics}
                    statusFilter={statusFilter}
                />

                <InvoiceFormSection
                    appendSpeech={appendSpeech}
                    clients={clients}
                    companies={companies}
                    editMode={editMode}
                    formData={formData}
                    formatCurrency={formatCurrency}
                    gstType={gstType}
                    handleAddItem={handleAddItem}
                    handleCancel={handleCancel}
                    handleChange={handleChange}
                    handleHsnSelect={handleHsnSelect}
                    handleItemChange={handleItemChange}
                    handleProductSelect={handleProductSelect}
                    handleRemoveItem={handleRemoveItem}
                    handleSubmit={handleSubmit}
                    hsnCodes={hsnCodes}
                    products={products}
                    selectedInvoice={selectedInvoice}
                    setFormData={setFormData}
                    setGstType={setGstType}
                    showForm={showForm}
                    totals={totals}
                />

                <InvoiceTableSection
                    filteredInvoices={filteredInvoices}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    handleChangePage={handleChangePage}
                    handleChangeRowsPerPage={handleChangeRowsPerPage}
                    handleDeleteConfirm={handleDeleteConfirm}
                    handleEdit={handleEdit}
                    handleOpenForm={handleOpenForm}
                    handleReturnClick={handleReturnClick}
                    handleView={handleView}
                    page={page}
                    paginatedInvoices={paginatedInvoices}
                    rowsPerPage={rowsPerPage}
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                />

                <InvoiceDialogs
                    deleteDialog={deleteDialog}
                    formatCurrency={formatCurrency}
                    formatDate={formatDate}
                    handleDelete={handleDelete}
                    handleExportPDF={handleExportPDF}
                    handlePrint={handlePrint}
                    handleReturnClick={handleReturnClick}
                    invoicePrintRef={invoicePrintRef}
                    invoiceToDelete={invoiceToDelete}
                    invoiceToReturn={invoiceToReturn}
                    invoiceToView={invoiceToView}
                    returnDialog={returnDialog}
                    setDeleteDialog={setDeleteDialog}
                    setReturnDialog={setReturnDialog}
                    setSnackbar={setSnackbar}
                    setViewDialog={setViewDialog}
                    showSnackbar={showSnackbar}
                    snackbar={snackbar}
                    viewDialog={viewDialog}
                />
            </Container>
        </>
    );
};

export default InvoiceList;
