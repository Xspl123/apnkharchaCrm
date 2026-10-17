import { getErrorMessage } from "../utils/getErrorMessage";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Container, LinearProgress } from "@mui/material";
import { useLocation } from "react-router-dom";
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
import EWayBillDialog from '../features/gst/components/EWayBillDialog';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
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

const defaultTotals = () => ({
    subtotal: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0,
});

const sanitizeVoiceText = (text = "") =>
    text
        .toLowerCase()
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, " ")
        .trim();

const fuzzyMatch = (source = "", target = "") => {
    const s = sanitizeVoiceText(source);
    const t = sanitizeVoiceText(target);
    if (!s || !t) return false;
    return s.includes(t) || t.includes(s);
};

const wordsToNumbersMap = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    hundred: 100,
    thousand: 1000,
    lakh: 100000,
    crore: 10000000,
};

const parseSpokenNumber = (text = "") => {
    const directNumber = text.replace(/[^0-9.]/g, "");
    if (directNumber) return parseFloat(directNumber);

    const words = sanitizeVoiceText(text).split(" ");
    let total = 0;
    let current = 0;

    for (const word of words) {
        if (wordsToNumbersMap[word] !== undefined) {
            const val = wordsToNumbersMap[word];
            if (val === 100) {
                current = (current || 1) * val;
            } else if (val >= 1000) {
                total += (current || 1) * val;
                current = 0;
            } else {
                current += val;
            }
        }
    }
    return total + current || null;
};

const parseDateFromSpeech = (text = "") => {
    const t = sanitizeVoiceText(text);
    const now = new Date();

    if (t.includes("today")) return now.toISOString().split("T")[0];
    if (t.includes("tomorrow")) {
        const d = new Date(now);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split("T")[0];
    }
    if (t.includes("yesterday")) {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        return d.toISOString().split("T")[0];
    }

    const inDaysMatch = t.match(/in (\d+|one|two|three|four|five|ten|fifteen) days/);
    if (inDaysMatch) {
        const days = parseSpokenNumber(inDaysMatch[1]) || 0;
        const d = new Date(now);
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
    }

    const directDateMatch = t.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (directDateMatch) {
        const [, y, m, d] = directDateMatch;
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    const months = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
    ];
    for (let i = 0; i < months.length; i++) {
        if (t.includes(months[i])) {
            const dayMatch = t.match(/(\d{1,2})(st|nd|rd|th)?/);
            if (dayMatch) {
                const day = dayMatch[1].padStart(2, "0");
                const month = String(i + 1).padStart(2, "0");
                const year = now.getFullYear();
                return `${year}-${month}-${day}`;
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
    const [ewayModal, setEwayModal] = useState({ open: false, invoice: null });
    const [gstType, setGstType] = useState('intra');
    const location = useLocation();

    
    const [, setActiveStep] = useState(0);
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [returnDialog, setReturnDialog] = useState(false);
    const [invoiceToReturn, setInvoiceToReturn] = useState(null);

    const [paymentDialog, setPaymentDialog] = useState(false);
    const [invoiceForPayment, setInvoiceForPayment] = useState(null);

    const [formData, setFormData] = useState({
        company_id: "",
        client_id: "",
        invoice_no: "",
        invoice_date: defaultDates().invoice_date,
        due_date: defaultDates().due_date,
        notes: "",
        invoice_type: "b2b",
        supply_type: "intra",
        place_of_supply: "",
        is_reverse_charge: false,
        items: [defaultInvoiceItem()],
    });

    const [totals, setTotals] = useState(defaultTotals());
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [viewDialog, setViewDialog] = useState(false);
    const [invoiceToView, setInvoiceToView] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([
                dispatch(getInvoices()).unwrap(),
                dispatch(getClients()).unwrap(),
                dispatch(getCompanies()).unwrap(),
                dispatch(getHsnCodes()).unwrap(),
                dispatch(getProducts()).unwrap(),
                dispatch(getAttributeGroups()).unwrap(),
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

    // crm-lead-auto-fill: Auto-open form with client & product from CRM Lead
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlClientId = params.get('client_id');
        const urlCompanyName = params.get('company_name');
        const urlProduct = params.get('product_interest');

        if ((urlClientId || urlCompanyName) && clients && clients.length > 0) {
            const targetClient = clients.find(c =>
                (urlClientId && String(c.id) === String(urlClientId)) ||
                (urlCompanyName && c.company_name && c.company_name.toLowerCase() === urlCompanyName.toLowerCase())
            );

            if (targetClient) {
                let initialItems = undefined;
                if (urlProduct && products && products.length > 0) {
                    const foundProd = products.find(p =>
                        (p.name && p.name.toLowerCase().includes(urlProduct.toLowerCase())) ||
                        (urlProduct.toLowerCase().includes(p.name ? p.name.toLowerCase() : ''))
                    );
                    if (foundProd) {
                        const rate = parseFloat(foundProd.selling_price) || 0;
                        const taxRate = parseFloat(foundProd.tax_rate) || 18;
                        initialItems = [{
                            product_id: foundProd.id,
                            item_name: foundProd.name,
                            description: foundProd.description || '',
                            hsn_code: foundProd.hsn_code || '',
                            qty: 1,
                            unit: foundProd.unit || 'pcs',
                            rate: rate,
                            amount: rate,
                            tax_rate: taxRate,
                            attributes: []
                        }];
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    client_id: targetClient.id,
                    items: initialItems ? initialItems : prev.items
                }));
                setShowForm(true);
            }
        }
    }, [location.search, clients, products]);

    // ⚡ Auto-open Create Invoice form with pre-selected client from CRM Lead
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlClientId = params.get("client_id");
        const urlCompanyName = params.get("company_name");

        if ((urlClientId || urlCompanyName) && clients && clients.length > 0) {
            const targetClient = clients.find((c) =>
                (urlClientId && String(c.id) === String(urlClientId)) ||
                (urlCompanyName && c.company_name?.toLowerCase() === urlCompanyName.toLowerCase())
            );

            if (targetClient) {
                setFormData((prev) => ({
                    ...prev,
                    client_id: targetClient.id,
                }));
                setShowForm(true); 
            }
        }
    }, [location.search, clients]);

    useEffect(() => {
        if (!editMode && showForm) {
            dispatch(getNextInvoiceNumber())
                .unwrap()
                .then((invoiceNumber) => {
                    setFormData((prev) => ({
                        ...prev,
                        invoice_no: invoiceNumber,
                    }));
                })
                .catch((error) => console.error("Failed to get next invoice number:", error));
        }
    }, [dispatch, editMode, showForm]);

    useEffect(() => {
        if (companies.length > 0 && !formData.company_id && !editMode) {
            setFormData((prev) => ({
                ...prev,
                company_id: companies[0].id,
            }));
        }
    }, [companies, formData.company_id, editMode]);

    useEffect(() => {
        let subtotal = 0;
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        formData.items.forEach((item) => {
            const itemAmount = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
            const taxRate = parseFloat(item.tax_rate) || 0;
            const itemTaxAmount = (itemAmount * taxRate) / 100;

            subtotal += itemAmount;

            if (gstType === 'intra') {
                cgst += itemTaxAmount / 2;
                sgst += itemTaxAmount / 2;
            } else {
                igst += itemTaxAmount;
            }
        });

        const total = subtotal + cgst + sgst + igst;

        setTotals({
            subtotal: parseFloat(subtotal.toFixed(2)),
            cgst: parseFloat(cgst.toFixed(2)),
            sgst: parseFloat(sgst.toFixed(2)),
            igst: parseFloat(igst.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
        });
    }, [formData.items, gstType]);

    const showSnackbar = useCallback((message, severity = "success") => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    }, []);

    const handleItemChange = useCallback((index, field, value) => {
        setFormData((prev) => {
            const updatedItems = [...prev.items];
            const currentItem = { ...updatedItems[index], [field]: value };

            if (field === "qty" || field === "rate") {
                const qty = field === "qty" ? parseFloat(value) || 0 : parseFloat(currentItem.qty) || 0;
                const rate = field === "rate" ? parseFloat(value) || 0 : parseFloat(currentItem.rate) || 0;
                const amount = qty * rate;
                const taxRate = parseFloat(currentItem.tax_rate) || 0;

                currentItem.amount = parseFloat(amount.toFixed(2));
                currentItem.tax_amount = parseFloat(((amount * taxRate) / 100).toFixed(2));
            }

            if (field === "tax_rate") {
                const taxRate = parseFloat(value) || 0;
                const amount = parseFloat(currentItem.amount) || 0;
                currentItem.tax_amount = parseFloat(((amount * taxRate) / 100).toFixed(2));
            }

            updatedItems[index] = currentItem;
            return { ...prev, items: updatedItems };
        });
    }, []);

    const handleAddItem = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            items: [...prev.items, defaultInvoiceItem()],
        }));
    }, []);

    const handleRemoveItem = useCallback((index) => {
        setFormData((prev) => {
            if (prev.items.length === 1) {
                return { ...prev, items: [defaultInvoiceItem()] };
            }
            return {
                ...prev,
                items: prev.items.filter((_, i) => i !== index),
            };
        });
    }, []);

    const handleHsnSelect = useCallback((index, hsnCode) => {
        setFormData((prev) => {
            const updatedItems = [...prev.items];
            const currentItem = { ...updatedItems[index] };
            const matchedHsn = hsnCodes.find((item) => item.hsn_code === hsnCode);

            if (matchedHsn) {
                currentItem.hsn_code = matchedHsn.hsn_code;
                currentItem.tax_rate = matchedHsn.gst_rate;
                currentItem.description = currentItem.description || matchedHsn.description;

                const amount = (parseFloat(currentItem.qty) || 0) * (parseFloat(currentItem.rate) || 0);
                currentItem.tax_amount = parseFloat(((amount * matchedHsn.gst_rate) / 100).toFixed(2));
            } else {
                currentItem.hsn_code = hsnCode;
            }

            updatedItems[index] = currentItem;
            return { ...prev, items: updatedItems };
        });
    }, [hsnCodes]);

    const handleProductSelect = useCallback(async (index, productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        setFormData((prev) => {
            const updatedItems = [...prev.items];
            const currentItem = { ...updatedItems[index] };

            currentItem.product_id = product.id;
            currentItem.item_name = product.product_name;
            currentItem.description = product.description || '';
            currentItem.hsn_code = product.hsn_code || '';
            currentItem.unit = product.unit || 'pcs';
            currentItem.rate = parseFloat(product.sales_price) || 0;
            currentItem.tax_rate = parseFloat(product.tax_rate) || 18;

            const qty = parseFloat(currentItem.qty) || 1;
            const rate = currentItem.rate;
            const amount = qty * rate;
            const taxAmount = (amount * currentItem.tax_rate) / 100;

            currentItem.amount = parseFloat(amount.toFixed(2));
            currentItem.tax_amount = parseFloat(taxAmount.toFixed(2));

            updatedItems[index] = currentItem;
            return { ...prev, items: updatedItems };
        });

        try {
            const embeddedAttributes = product.attribute_values ?? product.attributes;
            const attributeValues = Array.isArray(embeddedAttributes) && embeddedAttributes.length > 0
                ? embeddedAttributes
                : await dispatch(getProductAttributes(product.id)).unwrap();
            const attributes = createProductAttributeSnapshot(attributeValues, attributeGroups);
            setFormData((prev) => {
                if (prev.items[index]?.product_id !== product.id) return prev;
                const items = [...prev.items];
                items[index] = { ...items[index], attributes };
                return { ...prev, items };
            });
        } catch {
            // Attribute load error is non-fatal
        }
    }, [products, attributeGroups, dispatch]);

    const resetForm = useCallback(() => {
        setFormData({
            company_id: companies.length > 0 ? companies[0].id : "",
            client_id: "",
            invoice_no: nextInvoiceNumber,
            invoice_date: defaultDates().invoice_date,
            due_date: defaultDates().due_date,
            notes: "",
            invoice_type: "b2b",
            supply_type: "intra",
            place_of_supply: "",
            is_reverse_charge: false,
            items: [defaultInvoiceItem()],
        });
        setTotals(defaultTotals());
        setEditMode(false);
        setSelectedInvoice(null);
        setGstType('intra');
        setActiveStep(0);
    }, [companies, nextInvoiceNumber]);

    const handleToggleForm = useCallback(() => {
        if (showForm) {
            resetForm();
            setShowForm(false);
        } else {
            setShowForm(true);
        }
    }, [resetForm, showForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.company_id) {
            showSnackbar("Please select a company", "error");
            return;
        }

        if (!formData.client_id) {
            showSnackbar("Please select a client", "error");
            return;
        }

        if (!formData.invoice_no) {
            showSnackbar("Invoice number is required", "error");
            return;
        }

        for (let i = 0; i < formData.items.length; i++) {
            const item = formData.items[i];
            if (!item.item_name) {
                showSnackbar(`Item ${i + 1}: Name is required`, "error");
                return;
            }
            if (!item.qty || parseFloat(item.qty) <= 0) {
                showSnackbar(`Item ${i + 1}: Quantity must be greater than 0`, "error");
                return;
            }
            if (item.rate === "" || parseFloat(item.rate) < 0) {
                showSnackbar(`Item ${i + 1}: Rate cannot be negative`, "error");
                return;
            }
        }

        setLoading(true);

        const payload = {
            ...formData,
            sub_total: totals.subtotal,
            cgst: totals.cgst,
            sgst: totals.sgst,
            igst: totals.igst,
            total_amount: totals.total,
            supply_type: gstType,
            items: formData.items.map((item) => ({
                ...item,
                qty: parseFloat(item.qty),
                rate: parseFloat(item.rate),
                tax_rate: parseFloat(item.tax_rate),
                amount: parseFloat(item.amount),
                tax_amount: parseFloat(item.tax_amount),
                attributes: createProductAttributeSnapshot(item.selectedAttributes, attributeGroups),
            })),
        };

        try {
            if (editMode && selectedInvoice) {
                await dispatch(updateInvoice({ id: selectedInvoice.id, invoiceData: payload })).unwrap();
                showSnackbar("Invoice updated successfully!");
            } else {
                await dispatch(createInvoice(payload)).unwrap();
                showSnackbar("Invoice created successfully!");
            }

            resetForm();
            setShowForm(false);
            dispatch(getInvoices());
            dispatch(reset());
        } catch (error) {
            console.error("Failed to save invoice:", error);
            showSnackbar(getErrorMessage(error), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = useCallback((invoice) => {
        setSelectedInvoice(invoice);
        setEditMode(true);
        setShowForm(true);

        setFormData({
            company_id: invoice.company_id,
            client_id: invoice.client_id,
            invoice_no: invoice.invoice_no,
            invoice_date: invoice.invoice_date.split("T")[0],
            due_date: invoice.due_date.split("T")[0],
            notes: invoice.notes || "",
            invoice_type: invoice.invoice_type || "b2b",
            supply_type: invoice.supply_type || "intra",
            place_of_supply: invoice.place_of_supply || "",
            is_reverse_charge: invoice.is_reverse_charge || false,
            items: invoice.items.map((item) => ({
                id: item.id,
                product_id: item.product_id || null,
                item_name: item.item_name,
                description: item.description || "",
                hsn_code: item.hsn_code || "",
                qty: item.qty,
                unit: item.unit,
                rate: item.rate,
                tax_rate: item.tax_rate,
                amount: item.amount,
                tax_amount: item.tax_amount,
                selectedAttributes: (item.attributes || []).reduce((acc, a) => {
                    const group = attributeGroups.find((g) => g.name === a.attribute_name);
                    if (group) acc[group.id] = a.value;
                    return acc;
                }, {}),
            })),
        });

        setGstType(invoice.supply_type || 'intra');
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [attributeGroups]);

    const handleDeleteConfirm = useCallback((invoice) => {
        setInvoiceToDelete(invoice);
        setDeleteDialog(true);
    }, []);

    const handleDelete = async () => {
        if (!invoiceToDelete) return;

        setLoading(true);
        try {
            await dispatch(deleteInvoice(invoiceToDelete.id)).unwrap();
            showSnackbar("Invoice deleted successfully!");
            setDeleteDialog(false);
            setInvoiceToDelete(null);
            dispatch(getInvoices());
        } catch (error) {
            console.error("Failed to delete invoice:", error);
            showSnackbar(getErrorMessage(error), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReturnDialog = useCallback((invoice) => {
        setInvoiceToReturn(invoice);
        setReturnDialog(true);
    }, []);

    const handleOpenPaymentDialog = useCallback((invoice) => {
        setInvoiceForPayment(invoice);
        setPaymentDialog(true);
    }, []);

    const handleSavePayment = useCallback(async (paymentData) => {
        try {
            setLoading(true);
            await dispatch(createPayment(paymentData)).unwrap();
            showSnackbar("Payment recorded successfully!", "success");
            setPaymentDialog(false);
            setInvoiceForPayment(null);
            dispatch(getInvoices());
        } catch (error) {
            console.error("Payment failed:", error);
            showSnackbar(getErrorMessage(error), "error");
        } finally {
            setLoading(false);
        }
    }, [dispatch, showSnackbar]);

    const handleOpenEWayDialog = useCallback((invoice) => {
        setEwayModal({ open: true, invoice });
    }, []);

    const handleViewInvoice = useCallback((invoice) => {
        setInvoiceToView(invoice);
        setViewDialog(true);
    }, []);

    const handlePrintPDF = async (invoice) => {
        if (!invoice) return;
        try {
            const { default: InvoicePrintPDF } = await loadInvoicePrintModule();
            await InvoicePrintPDF.handlePrint(invoice);
        } catch (error) {
            console.error("Print error:", error);
            showSnackbar("Failed to print invoice", "error");
        }
    };

    const handleExportPDF = async (invoice) => {
        if (!invoice) return;
        try {
            const [{ default: InvoicePrintPDF }, { default: html2pdf }] = await Promise.all([
                loadInvoicePrintModule(),
                import("html2pdf.js"),
            ]);
            await InvoicePrintPDF.handleExportPDF(
                invoice,
                setLoading,
                showSnackbar,
                html2pdf,
                companies
            );
        } catch (error) {
            console.error("PDF generation error:", error);
            showSnackbar("Failed to generate PDF", "error");
        }
    };

    const formatCurrency = useCallback((amount) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
        }).format(amount || 0);
    }, []);

    const formatDate = useCallback((dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }, []);

    const handleChangePage = useCallback((event, newPage) => {
        setPage(newPage);
    }, []);

    const handleChangeRowsPerPage = useCallback((event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    }, []);

    const appendSpeech = useCallback((prevText, text) => {
        const cleanedPrev = (prevText || "").trim();
        const cleanedNext = (text || "").trim();
        if (!cleanedPrev) return cleanedNext;
        if (!cleanedNext) return cleanedPrev;
        return `${cleanedPrev} ${cleanedNext}`;
    }, []);

    const filteredInvoices = useMemo(() => {
        return invoices.filter((invoice) => {
            const matchesSearch =
                invoice.invoice_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                invoice.client?.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                invoice.status?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || invoice.status === statusFilter;

            let matchesDate = true;
            if (dateFilter !== "all") {
                const invoiceDate = new Date(invoice.invoice_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dateFilter === "today") {
                    matchesDate = invoiceDate >= today;
                } else if (dateFilter === "week") {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    matchesDate = invoiceDate >= weekAgo;
                } else if (dateFilter === "month") {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    matchesDate = invoiceDate >= monthAgo;
                } else if (dateFilter === "quarter") {
                    const quarterAgo = new Date(today);
                    quarterAgo.setMonth(quarterAgo.getMonth() - 3);
                    matchesDate = invoiceDate >= quarterAgo;
                }
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [invoices, searchQuery, statusFilter, dateFilter]);

    const paginatedInvoices = useMemo(() => {
        return filteredInvoices.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [filteredInvoices, page, rowsPerPage]);

    const statistics = useMemo(() => {
        const total = invoices.length;
        const paid = invoices.filter((i) => i.status === "paid").length;
        const unpaid = invoices.filter((i) => i.status === "unpaid").length;
        const partial = invoices.filter((i) => i.status === "partial").length;
        const returnCount = invoices.filter((i) => i.status === "return").length;
        const totalAmount = invoices.reduce(
            (sum, i) => sum + (parseFloat(i.total_amount) || 0),
            0
        );

        return { total, paid, unpaid, partial, return: returnCount, totalAmount };
    }, [invoices]);

    return (
        <>
            {loading && (
                <LinearProgress
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                    }}
                />
            )}

            <Container maxWidth="xl" className="invoice-page">
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
                    attributeGroups={attributeGroups}
                    clients={clients}
                    companies={companies}
                    editMode={editMode}
                    formData={formData}
                    formatCurrency={formatCurrency}
                    fuzzyMatch={fuzzyMatch}
                    gstType={gstType}
                    handleAddItem={handleAddItem}
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
                    handleOpenEWayDialog={handleOpenEWayDialog}
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
                    handleOpenEWayDialog={handleOpenEWayDialog}
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

                <EWayBillDialog
                    open={ewayModal.open}
                    invoice={ewayModal.invoice}
                    onClose={() => setEwayModal({ open: false, invoice: null })}
                    onUpdated={(updatedInvoice) => {
                        setEwayModal({ open: true, invoice: updatedInvoice });
                        dispatch(getInvoices());
                    }}
                />
            </Container>
        </>
    );
};

export default InvoiceList;