import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Database, FileJson, Settings, Menu } from 'lucide-react';
import { cn } from './lib/utils';
import { useState } from 'react';


export default function Layout() {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
        { name: 'Namespaces', path: '/namespaces', icon: Database },
        { name: 'Schemas', path: '/schemas', icon: FileJson },
        { name: 'Configurations', path: '/configs', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex overflow-hidden">
            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200 transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            ConfigMaster
                        </span>
                    </div>

                    <nav className="space-y-1 flex-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                                        isActive
                                            ? "bg-indigo-50 text-indigo-600 border-l-2 border-indigo-600"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-500 group-hover:text-slate-700")} />
                                    <span className="font-medium">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">ConfigMaster v1.0</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white/80 backdrop-blur-md">
                    <span className="font-bold text-lg text-slate-900">ConfigMaster</span>
                    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 hover:text-slate-900">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {/* Background Gradients */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[100px]" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/5 blur-[100px]" />
                    </div>

                    <Outlet />
                </div>
            </main>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}
        </div>
    );
}
