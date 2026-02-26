import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router";
import { Provider } from 'react-redux';
import './index.css';
import App from './App.tsx';
import { StrictMode } from "react";
import { ToasterConfig } from "@/components/ToasterConfig";
import { store } from './store';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <ToasterConfig />
                <App/>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);
