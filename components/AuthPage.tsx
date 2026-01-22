
import React, { useState } from 'react';
import { azureService } from '../services/azureService';

interface AuthPageProps {
    onLogin: (user: { name: string; email: string }) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLogin) {
                const user = await azureService.loginUser(email, password);
                onLogin({ name: user.name, email: user.email });
            } else {
                const user = await azureService.registerUser({ name, email, password });
                onLogin({ name: user.name, email: user.email });
            }
        } catch (err: any) {
            setError(err.message || 'Erro na autenticação');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Simulação rápida para o Google (em produção usaria um provider real)
            const user = await azureService.registerUser({
                name: 'Paulo (Google)',
                email: 'paulo.google@gmail.com'
            }).catch(() => azureService.loginUser('paulo.google@gmail.com'));

            onLogin({ name: user.name, email: user.email });
        } catch (err: any) {
            // Se já existir, apenas loga
            try {
                const user = await azureService.loginUser('paulo.google@gmail.com');
                onLogin({ name: user.name, email: user.email });
            } catch (e) {
                setError('Falha ao autenticar com Google');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 border border-white/10 rounded-3xl shadow-2xl mb-6 relative group scale-110">
                        <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
                        <img src="/logo.png" alt="Dr. Contador" className="w-12 h-12 object-contain relative z-10" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">
                        Neural Core <br />
                        <span className="text-indigo-400">Dr. Contador</span>
                    </h1>
                    <p className="mt-4 text-slate-500 text-[10px] uppercase tracking-[0.4em] font-bold">Acesso Restrito ao Sistema</p>
                </div>

                <div className="glass-panel border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold uppercase tracking-widest text-center animate-shake">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Seu nome"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-700"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Endereço de E-mail</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Senha Segura</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest text-xs mt-4"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                </div>
                            ) : (
                                isLogin ? 'Entrar no Sistema' : 'Criar Conta Neural'
                            )}
                        </button>
                    </form>

                    <div className="relative my-8 text-center">
                        <span className="h-px w-full bg-white/5 absolute top-1/2 left-0"></span>
                        <span className="relative bg-[#0b0c14] px-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Ou continue com</span>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-white text-slate-950 font-bold py-4 rounded-2xl transition-all hover:bg-slate-100 active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="text-sm">Acessar com Google</span>
                    </button>

                    <p className="mt-8 text-center text-xs text-slate-500">
                        {isLogin ? 'Não possui acesso?' : 'Já possui uma conta?'}
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="ml-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                        >
                            {isLogin ? 'Solicitar Registro' : 'Fazer Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
