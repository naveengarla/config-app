import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Database, FileJson, Settings, Activity, ArrowRight, Plus } from 'lucide-react';

export default function Dashboard() {
    const navigate = useNavigate();
    const { data: namespaces } = useQuery({ queryKey: ['namespaces'], queryFn: () => api.get('/namespaces/') });
    const { data: schemas } = useQuery({ queryKey: ['schemas'], queryFn: () => api.get('/schemas/') });
    const { data: configs } = useQuery({ queryKey: ['configs'], queryFn: () => api.get('/configs/') });

    const stats = [
        { label: 'Namespaces', value: namespaces?.length || 0, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Schemas', value: schemas?.length || 0, icon: FileJson, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Configs', value: configs?.length || 0, icon: Settings, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Versions', value: schemas?.reduce((sum: number, s: any) => sum + s.version, 0) || 0, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    ];

    // Mock recent activity - in a real app this would come from an audit log API
    const recentActivity = [
        { action: 'Created schema', target: 'User Profile', time: '10 mins ago', user: 'Admin' },
        { action: 'Updated config', target: 'feature_flags', time: '2 hours ago', user: 'Admin' },
        { action: 'Added namespace', target: 'production', time: '5 hours ago', user: 'System' },
        { action: 'Deleted config', target: 'legacy_settings', time: '1 day ago', user: 'Admin' },
        { action: 'Updated schema', target: 'PaymentGateway', time: '2 days ago', user: 'Admin' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 text-sm">Overview of your configuration ecosystem.</p>
                </div>
            </div>

            {/* Compact Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-4 shadow-sm hover:border-indigo-300 transition-colors">
                            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</div>
                                <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions - Moved up and made compact */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm h-full">
                        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/schemas', { state: { create: true } })}
                                className="w-full group flex items-center justify-between p-3 rounded-md bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-200">
                                        <Plus className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-medium text-slate-900 group-hover:text-indigo-700">New Schema</span>
                                        <span className="block text-[10px] text-slate-500">Define data structure</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" />
                            </button>

                            <button
                                onClick={() => navigate('/configs', { state: { create: true } })}
                                className="w-full group flex items-center justify-between p-3 rounded-md bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-emerald-200">
                                        <Plus className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-medium text-slate-900 group-hover:text-emerald-700">New Config</span>
                                        <span className="block text-[10px] text-slate-500">Create configuration</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity - Takes more space but limited items */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-sm h-full flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Recent Activity</h2>
                            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline">
                                View History
                            </button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recentActivity.map((item, i) => (
                                <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                            {item.action}: <span className="text-indigo-600">{item.target}</span>
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            by {item.user}
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-400 whitespace-nowrap">
                                        {item.time}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t border-slate-100 bg-slate-50 rounded-b-lg text-center">
                            <span className="text-xs text-slate-400">Showing last 5 activities</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
