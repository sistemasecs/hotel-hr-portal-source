"use client";

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            setError("No se ha proporcionado un token válido.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("Contraseña actualizada exitosamente.");
                setTimeout(() => {
                    router.push('/');
                }, 2500);
            } else {
                setError(data.error || 'Ocurrió un error. Intenta de nuevo.');
            }
        } catch (err) {
            setError('Error de red. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="max-w-md w-full p-10 bg-white rounded-xl shadow-lg border border-slate-100 text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Enlace Inválido</h2>
                    <p className="text-slate-600 mb-6">El enlace de restablecimiento de contraseña no es válido o está incompleto.</p>
                    <Link href="/forgot-password" className="text-primary-600 font-medium hover:underline">
                        Solicitar nuevo enlace
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-slate-100">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
                        Crear nueva contraseña
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Ingresa tu nueva contraseña a continuación.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {message && (
                        <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md text-center font-medium">
                            {message} <br /><span className="text-xs">Redirigiendo al inicio de sesión...</span>
                        </div>
                    )}
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="rounded-md shadow-sm space-y-4">
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-slate-700">Nueva Contraseña</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading || !!message}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="text-sm font-medium text-slate-700">Confirmar Contraseña</label>
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type="password"
                                required
                                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                placeholder="********"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading || !!message}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${loading || !!message ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Guardando...' : 'Restablecer Contraseña'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
