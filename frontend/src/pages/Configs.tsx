import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Plus, Trash2, Edit2, X, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '../lib/utils';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function Configs() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingConfig, setEditingConfig] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();

    useEffect(() => {
        if (location.state?.create) {
            setIsCreating(true);
            window.history.replaceState({}, document.title);
        }
    }, [location]);
    const [selectedSchemaId, setSelectedSchemaId] = useState<string>('');
    const [selectedNamespaceId, setSelectedNamespaceId] = useState<string>('');
    const [configKey, setConfigKey] = useState('');

    // Fetch Data
    const { data: configs } = useQuery({ queryKey: ['configs'], queryFn: () => api.get('/configs/') });
    const { data: namespaces } = useQuery({ queryKey: ['namespaces'], queryFn: () => api.get('/namespaces/') });
    const { data: schemas } = useQuery({ queryKey: ['schemas'], queryFn: () => api.get('/schemas/') });

    const createConfigMutation = useMutation({
        mutationFn: (data: any) => api.post('/configs/', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['configs'] });
            closeForm();
        },
        onError: (error: Error) => alert(`Error: ${error.message}`),
    });

    const updateConfigMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/configs/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['configs'] });
            closeForm();
        },
        onError: (error: Error) => alert(`Error: ${error.message}`),
    });

    const deleteConfigMutation = useMutation({
        mutationFn: (id: number) => api.delete(`/configs/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['configs'] }),
    });

    const closeForm = () => {
        setIsCreating(false);
        setEditingConfig(null);
        setSelectedSchemaId('');
        setSelectedNamespaceId('');
        setConfigKey('');
    };

    const handleEdit = (config: any) => {
        setEditingConfig(config);
        setSelectedNamespaceId(config.namespace_id.toString());
        setSelectedSchemaId(config.schema_id.toString());
        setConfigKey(config.key);
        setIsCreating(true);
    };

    const selectedSchema = schemas?.find((s: any) => s.id.toString() === selectedSchemaId);

    const handleSubmit = ({ formData }: any) => {
        if (!selectedNamespaceId || !selectedSchemaId || !configKey) {
            alert('Please fill in all required fields');
            return;
        }

        if (editingConfig) {
            updateConfigMutation.mutate({
                id: editingConfig.id,
                data: {
                    value: formData
                }
            });
        } else {
            createConfigMutation.mutate({
                namespace_id: parseInt(selectedNamespaceId),
                schema_id: parseInt(selectedSchemaId),
                key: configKey,
                value: formData,
            });
        }
    };

    // Helper to get names
    const getNsName = (id: number) => namespaces?.find((n: any) => n.id === id)?.name || id;
    const getSchemaName = (id: number) => schemas?.find((s: any) => s.id === id)?.name || id;

    // Filter configs based on search term
    const filteredConfigs = useMemo(() => {
        if (!configs) return [];
        if (!searchTerm) return configs;

        const lowerTerm = searchTerm.toLowerCase();
        return configs.filter((config: any) => {
            const keyMatch = config.key.toLowerCase().includes(lowerTerm);
            const nsMatch = getNsName(config.namespace_id).toString().toLowerCase().includes(lowerTerm);
            const schemaMatch = getSchemaName(config.schema_id).toString().toLowerCase().includes(lowerTerm);
            return keyMatch || nsMatch || schemaMatch;
        });
    }, [configs, searchTerm, namespaces, schemas]);

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Configurations
                    </h1>
                    <p className="text-slate-500 mt-2">Manage your application configurations.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search configs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg pl-4 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 text-slate-900 placeholder:text-slate-400"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    </div>
                    <button
                        onClick={() => {
                            if (isCreating) closeForm();
                            else setIsCreating(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                        <Plus className="w-4 h-4" /> New Config
                    </button>
                </div>
            </div>

            {/* Config Editor Drawer */}
            <div className={cn(
                "fixed inset-y-0 right-0 z-50 w-[600px] max-w-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col",
                isCreating ? "translate-x-0" : "translate-x-full"
            )}>
                {isCreating && (
                    <>
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                            <h2 className="text-xl font-semibold text-slate-900">
                                {editingConfig ? 'Edit Configuration' : 'Create Configuration'}
                            </h2>
                            <button
                                onClick={closeForm}
                                className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Namespace</label>
                                    <select
                                        value={selectedNamespaceId}
                                        onChange={(e) => setSelectedNamespaceId(e.target.value)}
                                        disabled={!!editingConfig}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900"
                                    >
                                        <option value="">Select Namespace</option>
                                        {namespaces?.map((ns: any) => (
                                            <option key={ns.id} value={ns.id}>{ns.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Schema</label>
                                    <select
                                        value={selectedSchemaId}
                                        onChange={(e) => setSelectedSchemaId(e.target.value)}
                                        disabled={!!editingConfig}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900"
                                    >
                                        <option value="">Select Schema</option>
                                        {schemas?.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-500 mb-1">Key</label>
                                    <input
                                        type="text"
                                        value={configKey}
                                        onChange={(e) => setConfigKey(e.target.value)}
                                        placeholder="e.g. feature_flags"
                                        disabled={!!editingConfig}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 placeholder:text-slate-400"
                                    />
                                </div>

                                {selectedSchema && (
                                    <div className="border-t border-slate-200 pt-6">
                                        <h4 className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wider">Configuration Values</h4>
                                        <div className="rjsf-compact">
                                            <Form
                                                schema={selectedSchema.structure}
                                                formData={editingConfig ? editingConfig.value : undefined}
                                                validator={validator}
                                                onSubmit={handleSubmit}
                                                className="space-y-4"
                                            >
                                                <button
                                                    type="submit"
                                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium mt-4"
                                                >
                                                    {editingConfig ? 'Update Configuration' : 'Create Configuration'}
                                                </button>
                                            </Form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Backdrop */}
            {isCreating && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                    onClick={closeForm}
                />
            )}

            <div className="bg-white/50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="p-4 font-medium text-slate-500">Key</th>
                            <th className="p-4 font-medium text-slate-500">Namespace</th>
                            <th className="p-4 font-medium text-slate-500">Schema</th>
                            <th className="p-4 font-medium text-slate-500">Version</th>
                            <th className="p-4 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredConfigs?.map((config: any) => (
                            <tr key={config.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-medium text-slate-900">{config.key}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-xs font-medium">
                                        {getNsName(config.namespace_id)}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600">{getSchemaName(config.schema_id)}</td>
                                <td className="p-4 text-slate-500">v{config.version}</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(config)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this config?')) deleteConfigMutation.mutate(config.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredConfigs?.length === 0 && (
                    <div className="p-12 text-center text-slate-500 bg-slate-50">
                        {searchTerm ? 'No matching configurations found.' : 'No configurations found.'}
                    </div>
                )}
            </div>
        </div>
    );
}
