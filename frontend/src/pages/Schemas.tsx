import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Plus, Trash2, Code, Search, X } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import SchemaBuilder from '../components/SchemaBuilder';
import { cn } from '../lib/utils';
import { useLocation } from 'react-router-dom';

export default function Schemas() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingSchema, setViewingSchema] = useState<any>(null);
    const [editingSchema, setEditingSchema] = useState<any>(null);
    const location = useLocation();

    useEffect(() => {
        if (location.state?.create) {
            setIsCreating(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const { data: schemas, isLoading } = useQuery({
        queryKey: ['schemas'],
        queryFn: () => api.get('/schemas/'),
    });

    const filteredSchemas = useMemo(() => {
        if (!schemas) return [];
        return schemas.filter((s: any) =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [schemas, searchTerm]);

    const createSchemaMutation = useMutation({
        mutationFn: (newSchema: any) => api.post('/schemas/', newSchema),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schemas'] });
            setIsCreating(false);
            setEditingSchema(null);
        },
        onError: (error: Error) => {
            alert(`Error creating schema: ${error.message}`);
        },
    });

    const deleteSchemaMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/schemas/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schemas'] });
        },
    });

    if (isLoading) return <div className="text-slate-500">Loading schemas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Schemas
                    </h1>
                    <p className="text-slate-500 mt-1">Define the structure of your configurations.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search schemas..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-slate-900 placeholder:text-slate-400"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>
                    <button
                        onClick={() => {
                            if (isCreating) {
                                setIsCreating(false);
                            } else {
                                setIsCreating(true);
                                setEditingSchema(null);
                            }
                        }}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                            isCreating
                                ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
                                : "bg-indigo-600 text-white hover:bg-indigo-500"
                        )}
                    >
                        {isCreating ? 'Cancel' : <><Plus className="w-4 h-4" /> New Schema</>}
                    </button>
                </div>
            </div>

            {/* Schema Editor Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-[600px] max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-200",
                (isCreating || editingSchema) ? "translate-x-0" : "translate-x-full"
            )}>
                {(isCreating || editingSchema) && (
                    <div className="h-full flex flex-col">
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => { setIsCreating(false); setEditingSchema(null); }}
                                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <SchemaBuilder
                            initialSchema={editingSchema}
                            onSave={(schema) => createSchemaMutation.mutate(schema)}
                        />
                    </div>
                )}
            </div>

            {/* Backdrop */}
            {(isCreating || editingSchema) && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={() => { setIsCreating(false); setEditingSchema(null); }}
                />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSchemas?.map((schema: any) => (
                    <div key={schema.id} className="bg-white/50 border border-slate-200 rounded-xl p-4 hover:border-indigo-500/50 transition-all group flex flex-col shadow-sm">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-900 truncate" title={schema.name}>{schema.name}</h3>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                                    v{schema.version}
                                </span>
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this schema?')) {
                                        deleteSchemaMutation.mutate(schema.id);
                                    }
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <p className="text-sm text-slate-600 mb-4 line-clamp-2 h-10">
                            {schema.description || "No description provided."}
                        </p>

                        <div className="flex items-center gap-2 mt-auto">
                            <button
                                onClick={() => setViewingSchema(schema)}
                                className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                            >
                                <Code className="w-3 h-3" /> View JSON
                            </button>
                            <button
                                onClick={() => {
                                    setEditingSchema(schema);
                                    setIsCreating(false);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200"
                            >
                                <Plus className="w-3 h-3" /> Edit v{schema.version + 1}
                            </button>
                        </div>
                    </div>
                ))}

                {filteredSchemas?.length === 0 && !isCreating && (
                    <div className="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {searchTerm ? 'No schemas match your search.' : 'No schemas found. Create one to get started.'}
                    </div>
                )}
            </div>

            {/* JSON Viewer Modal */}
            {viewingSchema && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="font-semibold text-lg text-slate-900">{viewingSchema.name} Structure</h3>
                            <button onClick={() => setViewingSchema(null)} className="text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto flex-1 bg-slate-50">
                            <pre className="text-xs font-mono text-emerald-600 whitespace-pre-wrap">
                                {JSON.stringify(viewingSchema.structure, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
