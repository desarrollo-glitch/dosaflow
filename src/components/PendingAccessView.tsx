import React from 'react';

interface PendingAccessViewProps {
    email?: string;
    status?: 'pending' | 'revoked' | 'unknown';
}

export const PendingAccessView: React.FC<PendingAccessViewProps> = ({ email, status = 'pending' }) => {
    const isRevoked = status === 'revoked';
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900 text-white px-4 text-center">
            <div className="max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">
                <div className="flex justify-center">
                    <svg className="w-16 h-16 text-brand-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm uppercase tracking-widest text-brand-secondary/80">
                        {isRevoked ? 'Acceso deshabilitado' : 'Acceso pendiente'}
                    </p>
                    <h1 className="text-3xl font-bold mt-1">
                        {isRevoked ? 'Contacto necesario' : 'Tu cuenta está en revisión'}
                    </h1>
                </div>
                <p className="text-sm text-gray-300">
                    {isRevoked ? (
                        <>El acceso para <span className="font-semibold">{email || 'tu cuenta'}</span> ha sido desactivado. Por favor contacta con un administrador para aclarar la situación.</>
                    ) : email ? (
                        <>Hemos recibido tu solicitud para <span className="font-semibold">{email}</span>. Un administrador debe aprobar tu acceso antes de que puedas ver el planificador.</>
                    ) : (
                        <>Hemos recibido tu solicitud. Un administrador debe aprobar tu acceso antes de que puedas ver el planificador.</>
                    )}
                </p>
                <div className="bg-white/10 rounded-lg p-4 text-left text-sm text-gray-200 space-y-2">
                    <p className="font-semibold text-white">{isRevoked ? 'Pasos recomendados' : '¿Qué puedo hacer ahora?'}</p>
                    <ul className="list-disc list-inside space-y-1">
                        {isRevoked ? (
                            <>
                                <li>Contacta con un administrador para resolver cualquier incidencia.</li>
                                <li>No compartas información sensible hasta que se restablezca el acceso.</li>
                                <li>Intenta iniciar sesión nuevamente cuando la situación esté resuelta.</li>
                            </>
                        ) : (
                            <>
                                <li>Revisa tu correo para confirmar la solicitud.</li>
                                <li>Contacta con un administrador para acelerar la aprobación.</li>
                                <li>Vuelve a iniciar sesión más tarde para comprobar el estado.</li>
                            </>
                        )}
                    </ul>
                </div>
                <p className="text-xs text-gray-400">
                    Si crees que esto es un error, por favor, comparte tu correo con el equipo de DOSA para que lo revisen cuanto antes.
                </p>
            </div>
        </div>
    );
};
