import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import SchemaField from './SchemaField';

interface SchemaBuilderProps {
    onSave: (schema: any) => void;
    initialSchema?: any;
}

export default function SchemaBuilder({ onSave, initialSchema }: SchemaBuilderProps) {
    const [name, setName] = useState(initialSchema?.name || '');
    const [description, setDescription] = useState(initialSchema?.description || '');
    const [mode, setMode] = useState<'visual' | 'json'>('visual');
    const [jsonError, setJsonError] = useState<string | null>(null);

    // Initial structure state
    const [structure, setStructure] = useState<any>(initialSchema?.structure || {
        "$schema": "http://json-schema.org/draft-07/schema#",
        title: initialSchema?.name || '',
        type: 'object',
        properties: {},
        required: []
    });

    const [jsonStructure, setJsonStructure] = useState(
        JSON.stringify(structure, null, 2)
    );

    // Sync name to structure title
    useEffect(() => {
        setStructure((prev: any) => ({ ...prev, title: name }));
    }, [name]);

    // Sync JSON when structure changes (if in visual mode)
    useEffect(() => {
        if (mode === 'visual') {
            setJsonStructure(JSON.stringify(structure, null, 2));
        }
    }, [structure, mode]);

    // Sync Structure when JSON changes (if in JSON mode)
    useEffect(() => {
        if (mode === 'json') {
            try {
                const parsed = JSON.parse(jsonStructure);
                setStructure(parsed);
                setJsonError(null);
            } catch (e) {
                setJsonError("Invalid JSON");
            }
        }
    }, [jsonStructure, mode]);

    const handleRootChange = (updates: { value?: any }) => {
        if (updates.value) {
            setStructure(updates.value);
        }
    };

    const handleSave = () => {
        if (jsonError && mode === 'json') return;

        const schema = {
            name,
            description,
            structure
        };

        onSave(schema);
    };

    return (
        <div className="h-full flex flex-col bg-white border-l border-slate-200 shadow-2xl w-[600px] max-w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h2 className="text-xl font-semibold text-slate-900">
                    {initialSchema ? `Edit ${initialSchema.name}` : 'Create New Schema'}
                </h2>
                <div className="flex bg-slate-200 rounded-lg p-1 border border-slate-300">
                    <button
                        onClick={() => setMode('visual')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'visual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        Visual
                    </button>
                    <button
                        onClick={() => setMode('json')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'json' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        JSON
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Schema Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 placeholder:text-slate-400"
                        placeholder="e.g. UserProfile"
                        disabled={!!initialSchema}
                    />
                    {initialSchema && <p className="text-xs text-indigo-600 mt-1">Editing creates a new version (v{initialSchema.version + 1})</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                        placeholder="Optional description for this schema..."
                        rows={2}
                    />
                </div>

                {mode === 'visual' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900">Structure</h3>
                        </div>

                        {/* We treat the root as a special SchemaField that is always an object and has no name/delete */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <SchemaField
                                value={structure}
                                onChange={handleRootChange}
                                onDelete={() => { }} // Root cannot be deleted
                                isItem={true} // Hides the name input for root
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2 h-[400px] flex flex-col">
                        <label className="block text-sm font-medium text-slate-500">JSON Schema Structure</label>
                        <textarea
                            value={jsonStructure}
                            onChange={(e) => setJsonStructure(e.target.value)}
                            className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs text-emerald-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            spellCheck={false}
                        />
                        {jsonError && <p className="text-red-500 text-sm">{jsonError}</p>}
                    </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
                <button
                    onClick={handleSave}
                    disabled={!name || (mode === 'json' && !!jsonError)}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    <Save className="w-4 h-4" /> Save Schema
                </button>
            </div>
        </div>
    );
}
