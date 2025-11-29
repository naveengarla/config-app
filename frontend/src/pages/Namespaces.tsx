import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Plus, Trash2, Box } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function Namespaces() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    const { data: namespaces, isLoading } = useQuery({
        queryKey: ['namespaces'],
        queryFn: () => api.get('/namespaces/'),
    });

    const createNamespaceMutation = useMutation({
        mutationFn: (data: any) => api.post('/namespaces/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['namespaces'] });
            setIsCreating(false);
            setNewName('');
            setNewDesc('');
        },
        onError: (error: Error) => alert(`Error: ${error.message}`),
    });

    const deleteNamespaceMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/namespaces/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['namespaces'] }),
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createNamespaceMutation.mutate({ name: newName, description: newDesc });
    };

    if (isLoading) return <div className="text-slate-500">Loading namespaces...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Namespaces
                    </h1>
                    <p className="text-slate-500 mt-2">Organize your configurations into logical groups.</p>
                </div>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                        isCreating
                            ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            : "bg-indigo-600 text-white hover:bg-indigo-500"
                    )}
                >
                    {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> New Namespace</>}
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 shadow-sm">
                    <div className="grid gap-4 max-w-xl">
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Name</label>
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                required
                                placeholder="e.g. platform-core"
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-500 mb-1">Description</label>
                            <textarea
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                placeholder="Optional description"
                                className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg">
                                Create Namespace
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {namespaces?.map((ns: any) => (
                    <div key={ns.id} className="group bg-white/50 border border-slate-200 rounded-xl p-6 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                <Box className="w-5 h-5" />
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm('Delete this namespace?')) deleteNamespaceMutation.mutate(ns.id);
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">{ns.name}</h3>
                        <p className="text-slate-500 text-sm">{ns.description || 'No description provided.'}</p>
                    </div>
                ))}

                {namespaces?.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No namespaces found.
                    </div>
                )}
            </div>
        </div>
    );
}
