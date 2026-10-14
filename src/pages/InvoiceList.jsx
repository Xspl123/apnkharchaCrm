import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, LinearProgress } from "@mui/material";
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
import { getAttributeGroups, getProductAttributes } from "../redux/features/attributeSlice";
import { createProductAttributeSnapshot } from "../utils/productAttributeSnapshot";
import { createPayment } from "../redux/features/invoicePaymentSlice";
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

const GST_STATE_CODE_MAP = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '26': 'Dadra & Nagar Haveli and Daman & Diu',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh',
};

const resolveState = (entity) => {
    if (!entity) return '';
    if (entity.gstin && typeof entity.gstin === 'string' && entity.gstin.trim().length >= 2) {
        const code = entity.gstin.trim().substring(0, 2);
        if (GST_STATE_CODE_MAP[code]) {
            return GST_STATE_CODE_MAP[code];
        }
    }
    if (entity.state && typeof entity.state === 'string' && entity.state.trim()) {
        const cleanState = entity.state.trim().toLowerCase();
        const exactMatch = Object.values(GST_STATE_CODE_MAP).find(
            s => s.toLowerCase() === cleanState
        );
        if (exactMatch) return exactMatch;
        const subMatch = Object.values(GST_STATE_CODE_MAP).find(
            s => cleanState.includes(s.toLowerCase())
        );
        if (subMatch) return subMatch;
        return entity.state.trim();
    }
    const combined = [entity.city, entity.address].filter(Boolean).join(' ').toLowerCase();
    if (combined) {
        for (const s of Object.values(GST_STATE_CODE_MAP)) {
            if (combined.includes(s.toLowerCase())) {
                return s;
            }
        }
    }
    return '';
};

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

    const products = useSelector((state) => state.inventory?.products) || [];
    const attributeGroups = useSelector((state) => state.attributes?.groups) || [];

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

    // Payment Dialog state
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [invoiceForPayment, setInvoiceForPayment] = useState(null);

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
                dispatch(getAttributeGroups()),
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

    const autoDetectGstType = (companyId, placeOfSupply) => {
        const company = companies.find(c => String(c.id) === String(companyId)) || (companies.length > 0 ? companies[0] : null);
        const companyState = resolveState(company);
        const supplyState = (placeOfSupply || '').trim();

        if (!companyState || !supplyState) {
            return 'intra';
        }

        const compMatch = Object.values(GST_STATE_CODE_MAP).find(s => s.toLowerCase() === companyState.toLowerCase()) || companyState;
        const supplyMatch = Object.values(GST_STATE_CODE_MAP).find(s => s.toLowerCase() === supplyState.toLowerCase()) || supplyState;

        return compMatch.toLowerCase() === supplyMatch.toLowerCase() ? 'intra' : 'inter';
    };

    useEffect(() => {
        if (!formData.place_of_supply) return;
        const detected = autoDetectGstType(formData.company_id, formData.place_of_supply);
        setGstType(detected);
    }, [formData.company_id, formData.place_of_supply, companies]);

    const handlePlaceOfSupplyChange = (newPlace) => {
        const detectedGstType = autoDetectGstType(formData.company_id, newPlace);
        setFormData(prev => ({ ...prev, place_of_supply: newPlace }));
        setGstType(detectedGstType);

        if (newPlace) {
            const comp = companies.find(c => String(c.id) === String(formData.company_id)) || (companies.length > 0 ? companies[0] : null);
            const compState = resolveState(comp);
            if (detectedGstType === 'intra') {
                showSnackbar('Intra-State (CGST + SGST) selected (' + (compState || 'Local') + ')', 'info');
            } else {
                showSnackbar('Inter-State (IGST) selected: ' + (compState || 'Origin') + ' ➔ ' + newPlace, 'info');
            }
        }
    };

    const handleClientChange = (clientId) => {
        const selectedClient = clients.find(c => String(c.id) === String(clientId));
        const clientState = resolveState(selectedClient);

        let newPlace = formData.place_of_supply;
        if (clientState) {
            newPlace = clientState;
        }

        const detectedGstType = autoDetectGstType(formData.company_id, newPlace);

        setFormData(prev => ({
            ...prev,
            client_id: clientId,
            ...(newPlace ? { place_of_supply: newPlace } : {}),
            ...(selectedClient?.gstin ? { invoice_type: 'b2b' } : { invoice_type: 'b2cs' }),
        }));

        setGstType(detectedGstType);

        if (clientState) {
            showSnackbar('Client state (' + clientState + ') detected: Place of Supply & GST auto-updated ✅', 'info');
        }
    };

    const handleCompanyChange = (companyId) => {
        const company = companies.find(c => String(c.id) === String(companyId));
        const companyState = resolveState(company);
        let newPlace = formData.place_of_supply;
        if (!newPlace && companyState) {
            newPlace = companyState;
        }
        const detectedGstType = autoDetectGstType(companyId, newPlace);

        setFormData(prev => ({
            ...prev,
            company_id: companyId,
            ...(newPlace ? { place_of_supply: newPlace } : {})
        }));
        if (newPlace) {
            setGstType(detectedGstType);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'company_id') {
            handleCompanyChange(value);
        } else if (name === 'client_id') {
            handleClientChange(value);
        } else if (name === 'place_of_supply') {
            handlePlaceOfSupplyChange(value);
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleItemChange = (index, field, value) => {
        const updatedItems = [...formData.items];
        updatedItems[index][field] = value;
        if (field === 'item_name') {
            updatedItems[index].product_id = null;
            updatedItems[index].attributes = [];
        }
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

    const handleProductSelect = async (index, product) => {
        if (!product) {
            const updatedItems = [...formData.items];
            updatedItems[index] = { ...updatedItems[index], product_id: null, attributes: [] };
            setFormData((prev) => ({ ...prev, items: updatedItems }));
            return;
        }
        const updatedItems = [...formData.items];
        updatedItems[index] = {
            ...updatedItems[index],
            product_id: product.id,
            attributes: createProductAttributeSnapshot(
                product.attribute_values || product.attributes || [],
                attributeGroups
            ),
            item_name: product.name,
            hsn_code: product.hsn_code || updatedItems[index].hsn_code,
            unit: product.unit || 'pcs',
            rate: parseFloat(product.selling_price) || 0,
            tax_rate: parseFloat(product.tax_rate) || 18,
            description: updatedItems[index].description || product.description || '',
        };
        updatedItems[index] = calculateItemTotals(updatedItems[index]);
        setFormData((prev) => ({ ...prev, items: updatedItems }));
        try {
            const embeddedAttributes = product.attribute_values ?? product.attributes;
            const attributeValues = Array.isArray(embeddedAttributes) && embeddedAttributes.length > 0
                ? embeddedAttributes
                : await dispatch(getProductAttributes(product.id)).unwrap();
            const attributes = createProductAttributeSnapshot(
                attributeValues,
                attributeGroups
            );
            setFormData((prev) => {
                if (prev.items[index]?.product_id !== product.id) return prev;
                const items = [...prev.items];
                items[index] = { ...items[index], attributes };
                return { ...prev, items };
            });
        } catch {
            // Keep the product selection usable if its optional attributes cannot load.
        }
        showSnackbar(product.name + ' — auto filled! ✅', 'success');
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

    const handleToggleForm = () => {
        if (!showForm) {
            const defaultComp = companies.length > 0 ? companies[0] : null;
            const compState = resolveState(defaultComp);
            setFormData((prev) => ({
                ...prev,
                company_id: defaultComp?.id || prev.company_id || "",
                place_of_supply: compState || prev.place_of_supply || "",
                invoice_no: "",
                ...defaultDates(),
                items: [defaultInvoiceItem()],
            }));
            setGstType("intra");
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
                showSnackbar('❌ "' + linkedProduct.name + '" is out of stock. The invoice cannot be created.', "error");
                return;
            }
            if (Number(item.qty) > Number(linkedProduct.current_stock)) {
                showSnackbar(
                    '❌ "' + linkedProduct.name + '" — Requested: ' + item.qty + ' ' + linkedProduct.unit + ', Available: ' + linkedProduct.current_stock + ' ' + linkedProduct.unit,
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
                companyId = matchedCompany ? matchedCompany.id : companies[0].id;
            } else {
                companyId = companies[0].id;
            }
        }

        const fmtD = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
        const items = invoice.items?.map(item => ({
            item_name: item.item_name || "",
            description: item.description || "",
            hsn_code: item.hsn_code || "",
            qty: item.qty || 1,
            unit: item.unit || "pcs",
            rate: item.rate || 0,
            tax_rate: item.tax_rate || 0,
            amount: item.amount || 0,
            tax_amount: item.tax_amount || 0,
            product_id: item.product_id || null,
            attributes: item.attributes || [],
        })) || [];
        setFormData({
            company_id: companyId,
            client_id: invoice.client_id || invoice.client?.id || "",
            invoice_no: invoice.invoice_no || "",
            invoice_date: fmtD(invoice.invoice_date),
            due_date: fmtD(invoice.due_date),
            cgst: invoice.cgst || 0,
            sgst: invoice.sgst || 0,
            igst: invoice.igst || 0,
            notes: invoice.notes || "",
            terms_conditions: invoice.terms_conditions || "",
            invoice_type: invoice.invoice_type || "b2b",
            place_of_supply: invoice.place_of_supply || "",
            is_reverse_charge: invoice.is_reverse_charge || false,
            items: items.length > 0 ? items : [defaultInvoiceItem()],
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
            dispatch(getInvoices());
        } catch (err) {
            showSnackbar(getErrorMessage(err, "Delete failed!"), "error");
        } finally {
            setLoading(false);
        }
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

    const handlePrintPDF = async (invoice = invoiceToView) => {
        const inv = invoice || invoiceToView;
        if (!inv) return;
        try {
            const { default: InvoicePrintPDF } = await loadInvoicePrintModule();
            await InvoicePrintPDF.print(inv, companies);
        } catch (error) {
            console.error("Failed to load or print invoice PDF:", error);
            showSnackbar("Failed to print invoice PDF", "error");
        }
    };

    const handleExportPDF = async (invoice = invoiceToView) => {
        const inv = invoice || invoiceToView;
        if (!inv) return;
        try {
            setLoading(true);
            const [{ default: InvoicePrintPDF }, { default: html2pdf }] = await Promise.all([
                loadInvoicePrintModule(),
                import("html2pdf.js"),
            ]);
            await InvoicePrintPDF.handleExportPDF(
                inv,
                setLoading,
                showSnackbar,
                html2pdf,
                companies
            );
        } catch (error) {
            console.error("Failed to export PDF:", error);
            showSnackbar("Failed to download PDF: " + (error?.message || "Error"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReturnDialog = (invoice) => {
        setInvoiceToReturn(invoice);
        setReturnDialog(true);
    };

    const handleCloseReturnDialog = () => {
        setInvoiceToReturn(null);
        setReturnDialog(false);
    };

    // Payment Handlers (Component ke andar)
    const handleOpenPaymentDialog = (invoice) => {
        setInvoiceForPayment(invoice);
        setPaymentDialog(true);
    };

    const handleSavePayment = async (paymentData) => {
        try {
            setLoading(true);
            await dispatch(createPayment(paymentData)).unwrap();
            showSnackbar("Payment recorded successfully! ✅", "success");
            setPaymentDialog(false);
            setInvoiceForPayment(null);
            await dispatch(getInvoices());
        } catch (err) {
            showSnackbar(getErrorMessage(err, "Failed to record payment"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = (invoice) => {
        setInvoiceToView(invoice);
        setViewDialog(true);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const filteredInvoices = useMemo(() => {
        return invoices.filter((invoice) => {
            const matchesSearch =
                invoice.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                invoice.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
            let matchesDate = true;
            if (dateFilter !== 'all') {
                const invoiceDate = new Date(invoice.invoice_date);
                const now = new Date();
                if (dateFilter === 'this_month' || dateFilter === 'month') {
                    matchesDate = invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
                } else if (dateFilter === 'last_month') {
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    matchesDate = invoiceDate.getMonth() === lastMonth.getMonth() && invoiceDate.getFullYear() === lastMonth.getFullYear();
                } else if (dateFilter === 'today') {
                    matchesDate = invoiceDate.toISOString().split('T')[0] === now.toISOString().split('T')[0];
                } else if (dateFilter === 'week') {
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = invoiceDate >= oneWeekAgo && invoiceDate <= now;
                } else if (dateFilter === 'this_year') {
                    matchesDate = invoiceDate.getFullYear() === now.getFullYear();
                }
            }
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [invoices, searchQuery, statusFilter, dateFilter]);

    const paginatedInvoices = useMemo(() => {
        return filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    }, [filteredInvoices, page, rowsPerPage]);

    const statistics = useMemo(() => {
        const isReturn = (i) => {
            const s = String(i.status || '').toLowerCase();
            return s === 'return' || Boolean(i.is_return);
        };

        const isCancelled = (i) => {
            const s = String(i.status || '').toLowerCase();
            return s === 'cancelled';
        };

        const isPaid = (i) => {
            const s = String(i.status || '').toLowerCase();
            const bal = parseFloat(i.balance_amount || 0);
            const tot = parseFloat(i.total_amount || 0);
            return !isReturn(i) && !isCancelled(i) && (s === 'paid' || (tot > 0 && bal <= 0));
        };

        const isPartial = (i) => {
            const s = String(i.status || '').toLowerCase();
            const paid = parseFloat(i.paid_amount || 0);
            const bal = parseFloat(i.balance_amount || 0);
            return !isReturn(i) && !isCancelled(i) && !isPaid(i) && (s === 'partial' || (paid > 0 && bal > 0));
        };

        const isUnpaid = (i) => {
            return !isReturn(i) && !isCancelled(i) && !isPaid(i) && !isPartial(i);
        };

        const activeInvoices = invoices.filter((i) => !isReturn(i) && !isCancelled(i));

        return {
            total: invoices.length,
            paid: invoices.filter(isPaid).length,
            partial: invoices.filter(isPartial).length,
            unpaid: invoices.filter(isUnpaid).length,
            return: invoices.filter(isReturn).length,
            totalAmount: activeInvoices.reduce((sum, i) => sum + (parseFloat(i.total_amount) || 0), 0),
        };
    }, [invoices]);

    const totals = calculateInvoiceTotals();

    return (
        <>
            <div ref={invoicePrintRef} style={{ display: 'none' }} />
            <Container maxWidth="xl" className="invoice-page__container">
                {loading && <LinearProgress className="invoice-page__progress" />}

                <InvoiceListHeader
                    appendSpeech={appendSpeech}
                    dateFilter={dateFilter}
                    formatCurrency={formatCurrency}
                    handleOpenForm={handleToggleForm}
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
                    handleOpenForm={handleToggleForm}
                    handleReturnClick={handleOpenReturnDialog}
                    handleOpenPaymentDialog={handleOpenPaymentDialog}
                    handleView={handleViewInvoice}
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
                    handleExportPDF={() => invoiceToView && handleExportPDF(invoiceToView)}
                    handlePrint={() => invoiceToView && handlePrintPDF(invoiceToView)}
                    handleReturnClick={handleOpenReturnDialog}
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
                    paymentDialog={paymentDialog}
                    setPaymentDialog={setPaymentDialog}
                    invoiceForPayment={invoiceForPayment}
                    handleSavePayment={handleSavePayment}
                    loading={loading}
                />
            </Container>
        </>
    );
};

export default InvoiceList;