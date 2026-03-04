import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-slate-500 font-medium animate-pulse">Cargando...</div>
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
