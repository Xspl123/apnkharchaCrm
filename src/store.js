import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./redux/features/authSlice";
import categoryReducer from "./redux/features/categorySlice";
import accountsReducer from "./redux/features/accountSlice";
import transactionReducer from "./redux/features/transactionSlice";
import budgetReducer from "./redux/features/budgetSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        category:categoryReducer,
        accounts:accountsReducer,
        transactions: transactionReducer,
        budget:budgetReducer

    },
});

export default store;
