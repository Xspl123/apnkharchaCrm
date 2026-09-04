import { lazy, Suspense } from "react";
import PropTypes from "prop-types";
import Autocomplete from "@mui/material/Autocomplete";
import {
    Paper,
    Typography,
    Grid,
    TextField,
    Select,
    MenuItem,
    Button,
    IconButton,
    Collapse,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { formatCurrency } from "../../hooks/useTransactionsPage";
import { getCreditCardAvailableLimit, getCreditCardOutstanding, isCreditCardAccount } from "../../utils/creditCardAccounts";

const EnterpriseCalculatorDialog = lazy(() => import("../EnterpriseCalculatorDialog"));

const getAccountOptionLabel = (account) => isCreditCardAccount(account)
    ? `${account.account_name} (Available ${formatCurrency(getCreditCardAvailableLimit(account))}, Outstanding ${formatCurrency(getCreditCardOutstanding(account))})`
    : `${account.account_name} (${formatCurrency(account.account_balance)})`;

const TransactionForm = ({
    showForm,
    formData,
    setFormData,
    categories,
    accounts,
    loans,
    handleChange,
    handleSubmit,
    handleSpeechToText,
    categoryType,
    isRepaymentCategory,
    contributionOptions,
    calculatorOpen,
    handleCalculatorOpen,
    handleCalculatorClose,
    handleCalculatorSubmit,
}) => {
    return (
        <>
            <Collapse in={showForm}>
                <Paper className="page-form-card transactions-page__form-card">
                    <Typography variant="h6" gutterBottom className="page-form-title">
                        New Transaction
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <TextField
                                    label="Amount" type="number" name="amount" fullWidth required
                                    value={formData.amount} onChange={handleChange}
                                    InputProps={{
                                        endAdornment: (
                                            <>
                                                <IconButton onClick={handleCalculatorOpen} color="primary" size="small" tabIndex={-1}>
                                                    <AddIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleSpeechToText("amount")} color="secondary" size="small" tabIndex={-1}>
                                                    <span role="img" aria-label="mic">🎤</span>
                                                </IconButton>
                                            </>
                                        )
                                    }}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <TextField
                                    label="Date" type="date" name="transaction_date" fullWidth required
                                    InputLabelProps={{ shrink: true }} value={formData.transaction_date} onChange={handleChange}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <Autocomplete
                                    options={categories}
                                    getOptionLabel={(option) => option.name}
                                    value={categories.find((cat) => cat.id === formData.category) || null}
                                    onChange={(_, newValue) => {
                                        setFormData((prev) => ({
                                            ...prev,
                                            category: newValue ? newValue.id : "",
                                            description: "", transfer_to: "", repayment_date: "", repayment_by: "",
                                        }));
                                    }}
                                    renderInput={(params) => <TextField {...params} label="Select Category" fullWidth required />}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                />
                            </Grid>

                            <Grid item xs={6}>
                                <Select name="account" fullWidth required value={formData.account} onChange={handleChange} displayEmpty>
                                    <MenuItem value="" disabled>Select From Account</MenuItem>
                                    {accounts?.map((acc) => (
                                        <MenuItem key={acc.id} value={acc.id}>
                                            {getAccountOptionLabel(acc)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </Grid>

                            {(() => {
                                const selected = categories.find((c) => c.id === formData.category);
                                if (selected && selected.type?.toLowerCase() === "transfer") {
                                    return (
                                        <Grid item xs={6}>
                                            <Select name="transfer_to" fullWidth required value={formData.transfer_to} onChange={handleChange} displayEmpty>
                                                <MenuItem value="" disabled>Select To Account</MenuItem>
                                                {accounts?.filter((acc) => acc.id !== formData.account).map((acc) => (
                                                    <MenuItem key={acc.id} value={acc.id}>
                                                        {getAccountOptionLabel(acc)}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </Grid>
                                    );
                                }
                                return null;
                            })()}

                            {categoryType?.name === "Borrow Return" && (
                                <Grid item xs={12}>
                                    <Select name="description" fullWidth required value={formData.description} onChange={handleChange} displayEmpty>
                                        <MenuItem value="" disabled>Select Borrowered</MenuItem>
                                        {loans?.loans?.map((acc) => (
                                            <MenuItem key={acc.id} value={acc.person_name}>{acc.person_name}</MenuItem>
                                        ))}
                                    </Select>
                                </Grid>
                            )}

                            {categoryType?.name !== "Borrow Return" && !isRepaymentCategory && (
                                <Grid item xs={12}>
                                    <TextField
                                        label={(() => {
                                            const selectedCategory = categories.find((cat) => cat.id === formData.category);
                                            if (selectedCategory?.type && (selectedCategory.type.toLowerCase() === "borrow" || selectedCategory.type.toLowerCase() === "borrow_return")) {
                                                return "Borrower Name";
                                            }
                                            return "Description";
                                        })()}
                                        name="description" fullWidth multiline rows={2}
                                        value={formData.description} onChange={handleChange}
                                        InputProps={{
                                            endAdornment: (
                                                <IconButton onClick={() => handleSpeechToText("description")} color="secondary" size="small" tabIndex={-1}>
                                                    <span role="img" aria-label="mic">🎤</span>
                                                </IconButton>
                                            )
                                        }}
                                    />
                                </Grid>
                            )}

                            {isRepaymentCategory && (
                                <>
                                    <Grid item xs={12}>
                                        <Select
                                            name="description" fullWidth required value={formData.description} displayEmpty
                                            onChange={(e) => {
                                                const selectedOption = contributionOptions.find((o) => o.description === e.target.value);
                                                setFormData((prev) => ({ ...prev, description: e.target.value, amount: selectedOption?.amount ?? prev.amount }));
                                            }}
                                        >
                                            <MenuItem value="" disabled>Select Contribution Description</MenuItem>
                                            {contributionOptions.map((option) => (
                                                <MenuItem key={option.description} value={option.description}>{option.description}</MenuItem>
                                            ))}
                                        </Select>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Repayment Date" type="date" name="repayment_date" fullWidth required
                                            InputLabelProps={{ shrink: true }} value={formData.repayment_date} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField label="Repayment By" name="repayment_by" fullWidth required
                                            value={formData.repayment_by} onChange={handleChange} />
                                    </Grid>
                                </>
                            )}

                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" color="success" fullWidth>
                                    Save Transaction
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </Paper>
            </Collapse>

            {calculatorOpen ? (
                <Suspense fallback={null}>
                    <EnterpriseCalculatorDialog
                        open={calculatorOpen} onClose={handleCalculatorClose} onConfirm={handleCalculatorSubmit}
                        initialValue={formData.amount} title="Transaction Amount Calculator"
                        subtitle="Use it here or in any other workflow that needs reliable business calculations."
                        confirmLabel="Use Amount"
                    />
                </Suspense>
            ) : null}
        </>
    );
};

TransactionForm.propTypes = {
    showForm: PropTypes.bool.isRequired,
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired,
    accounts: PropTypes.array,
    loans: PropTypes.object,
    handleChange: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    handleSpeechToText: PropTypes.func.isRequired,
    categoryType: PropTypes.object,
    isRepaymentCategory: PropTypes.bool,
    contributionOptions: PropTypes.array.isRequired,
    calculatorOpen: PropTypes.bool.isRequired,
    handleCalculatorOpen: PropTypes.func.isRequired,
    handleCalculatorClose: PropTypes.func.isRequired,
    handleCalculatorSubmit: PropTypes.func.isRequired,
};

export default TransactionForm;
