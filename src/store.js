import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./redux/features/authSlice";
import categoryReducer from "./redux/features/categorySlice";
import accountsReducer from "./redux/features/accountSlice";
import transactionReducer from "./redux/features/transactionSlice";

const store = configureStore({
    reducer: {
        auth: authReducer,
        category:categoryReducer,
        accounts:accountsReducer,
        transactions: transactionReducer,

    },
});

export default store;
