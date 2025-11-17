
import React, { useState } from 'react';
import { signUp, logIn, signInWithGoogle } from '../utils/auth';
import { SpinnerIcon, GoogleIcon } from './Icons';

export const LoginView: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<React.ReactNode | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isLogin) {
                await logIn(email, password);
            } else {
                await signUp(email, password);
            }
        } catch (err: any) {
            switch (err.code) {
                case 'auth/invalid-email':
                    setError('El formato del correo electrónico no es válido.');
                    break;
                case 'auth/user-not-found':
                    setError('No se encontró ningún usuario con este correo.');
                    break;
                case 'auth/wrong-password':
                    setError('La contraseña es incorrecta.');
                    break;
                case 'auth/email-already-in-use':
                    setError('Este correo electrónico ya está en uso.');
                    break;
                case 'auth/weak-password':
                     setError('La contraseña debe tener al menos 6 caracteres.');
                     break;
                default:
                    setError('Ha ocurrido un error. Por favor, inténtalo de nuevo.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
                console.error("Google Sign-In Error:", err);
                let userMessage: React.ReactNode = 'Ha ocurrido un error al iniciar sesión con Google.';
                switch (err.code) {
                    case 'auth/operation-not-allowed':
                        userMessage = 'El inicio de sesión con Google no está habilitado. Por favor, actívalo en la consola de Firebase (Authentication > Sign-in method).';
                        break;
                    case 'auth/unauthorized-domain':
                        userMessage = (
                            <>
                                <p className="font-semibold mb-2">Dominio no autorizado</p>
                                <p>Este dominio no está en la lista de dominios autorizados de tu proyecto de Firebase.</p>
                                <a 
                                    href="https://console.firebase.google.com/project/dosatic/authentication/settings" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="font-bold text-indigo-300 hover:underline mt-2 inline-block"
                                >
                                    Añadir dominio a Firebase
                                </a>
                            </>
                        );
                        break;
                    case 'auth/popup-blocked-by-browser':
                        userMessage = 'El navegador ha bloqueado la ventana emergente. Por favor, permite las ventanas emergentes para este sitio.';
                        break;
                    default:
                        // For other errors, show a more generic message but include the code for debugging.
                        userMessage = `Error inesperado con Google: ${err.code || err.message}`;
                        break;
                }
                setError(userMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200 overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-gray-900"></div>
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-3xl animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
            </div>

            <style>{`
                .animate-blob {
                    animation: blob 7s infinite;
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>
            
            <div className="relative z-10 w-full max-w-md p-8 space-y-6 bg-gray-800/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10">
                <div className="text-center">
                    <div className="flex justify-center items-center mb-4">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    {isLogin ? (
                        <h2 className="text-5xl font-bold text-white font-logo tracking-wider">DosaFlow</h2>
                    ) : (
                        <h2 className="text-3xl font-bold text-white">Crea tu Cuenta</h2>
                    )}
                    <p className="mt-2 text-sm text-gray-400">
                        {isLogin ? 'Accede a tu planificador de desarrollos' : 'Únete para empezar a organizar tu trabajo'}
                    </p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full px-4 py-3 border border-transparent placeholder-gray-400 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white/10"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full px-4 py-3 border border-transparent placeholder-gray-400 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary bg-white/10"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {error && <div className="text-sm text-red-400 text-center bg-red-900/20 p-3 rounded-md border border-red-500/50">{error}</div>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex justify-center w-full py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-brand-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                        >
                            {loading && <SpinnerIcon className="w-5 h-5 mr-3" />}
                            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                        </button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">O</span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white disabled:opacity-50 transition-all duration-300 transform hover:scale-105"
                    >
                        <GoogleIcon className="w-5 h-5 mr-3" />
                        {isLogin ? 'Iniciar Sesión con Google' : 'Registrarse con Google'}
                    </button>
                </div>
                
                <div className="text-sm text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                        className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        {isLogin ? '¿No tienes una cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
};
