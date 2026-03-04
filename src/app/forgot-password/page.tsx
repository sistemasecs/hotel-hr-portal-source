"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('If an account exists, a reset link was sent.');
            } else {
                setError(data.error || 'Something went wrong.');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative">
            <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg border border-slate-100">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-slate-900 tracking-tight">
                        {t('forgotPassword') || 'Forgot Password?'}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Enter your email address and we will send you a link to reset your password.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {message && (
                        <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md text-center font-medium">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md text-center font-medium">
                            {error}
                        </div>
                    )}
                    <div>
                        <label htmlFor="email-address" className="sr-only">
                            {t('emailAddress')}
                        </label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="appearance-none rounded-md relative block w-full px-3 py-3 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                            placeholder={t('emailAddress') || 'Email Address'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link href="/" className="text-sm font-medium text-primary-600 hover:text-primary-500 mt-4 inline-block">
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
