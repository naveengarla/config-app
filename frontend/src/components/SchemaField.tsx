import { Plus, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';

export type SchemaType = 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array';

export interface SchemaFieldProps {
    name?: string; // Key in the parent object (undefined for array items)
    value: any; // The schema object for this field
    required?: boolean;
    isItem?: boolean; // True if this is a direct child of an array
    onChange: (updates: { name?: string; value?: any; required?: boolean }) => void;
    onDelete: () => void;
}

export default function SchemaField({ name, value, required, isItem, onChange, onDelete }: SchemaFieldProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [localName, setLocalName] = useState(name || '');

    const type = value.type || 'string';

    // Sync local name with prop name when it changes externally
    useEffect(() => {
        setLocalName(name || '');
    }, [name]);

    const handleNameBlur = () => {
        if (localName !== name) {
            onChange({ name: localName });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            (e.currentTarget as HTMLInputElement).blur(); // Trigger blur to save
        }
    };

    const handleTypeChange = (newType: SchemaType) => {
        const newValue = { ...value, type: newType };

        // Reset properties/items when type changes
        if (newType === 'object') {
            newValue.properties = {};
            newValue.required = [];
            delete newValue.items;
        } else if (newType === 'array') {
            newValue.items = { type: 'string' };
            delete newValue.properties;
            delete newValue.required;
        } else {
            delete newValue.properties;
            delete newValue.required;
            delete newValue.items;
        }

        onChange({ value: newValue });
    };

    const handleAddProperty = () => {
        const newPropName = `field_${Object.keys(value.properties || {}).length + 1}`;
        const newProperties = {
            ...(value.properties || {}),
            [newPropName]: { type: 'string' }
        };
        onChange({ value: { ...value, properties: newProperties } });
    };

    const updateProperty = (oldKey: string, updates: { name?: string; value?: any; required?: boolean }) => {
        const newProperties = { ...value.properties };
        const newRequired = new Set(value.required || []);

        // Handle Rename
        if (updates.name && updates.name !== oldKey) {
            const propValue = newProperties[oldKey];
            delete newProperties[oldKey];
            newProperties[updates.name] = propValue;

            if (newRequired.has(oldKey)) {
                newRequired.delete(oldKey);
                newRequired.add(updates.name);
            }
        }

        const key = updates.name || oldKey;

        // Handle Value Update
        if (updates.value) {
            newProperties[key] = updates.value;
        }

        // Handle Required Update
        if (updates.required !== undefined) {
            if (updates.required) {
                newRequired.add(key);
            } else {
                newRequired.delete(key);
            }
        }

        onChange({
            value: {
                ...value,
                properties: newProperties,
                required: Array.from(newRequired)
            }
        });
    };

    const deleteProperty = (key: string) => {
        const newProperties = { ...value.properties };
        delete newProperties[key];

        const newRequired = (value.required || []).filter((k: string) => k !== key);

        onChange({
            value: {
                ...value,
                properties: newProperties,
                required: newRequired
            }
        });
    };

    const updateItem = (updates: { value?: any }) => {
        if (updates.value) {
            onChange({ value: { ...value, items: updates.value } });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-start bg-white p-2 rounded border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                {(type === 'object' || type === 'array') && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="mt-1.5 text-slate-400 hover:text-slate-600"
                    >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                )}

                {!isItem && (
                    <div className="flex-1 min-w-[150px]">
                        <input
                            type="text"
                            value={localName}
                            onChange={(e) => setLocalName(e.target.value)}
                            onBlur={handleNameBlur}
                            onKeyDown={handleKeyDown}
                            placeholder="Field Name"
                            className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                )}

                <div className="w-32">
                    <select
                        value={type}
                        onChange={(e) => handleTypeChange(e.target.value as SchemaType)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    >
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="object">Object</option>
                        <option value="array">Array</option>
                    </select>
                </div>

                {!isItem && (
                    <div className="flex items-center h-[34px]">
                        <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={required}
                                onChange={(e) => onChange({ required: e.target.checked })}
                                className="rounded border-slate-300 bg-slate-50 text-indigo-600 focus:ring-indigo-500"
                            />
                            Req
                        </label>
                    </div>
                )}

                <button onClick={onDelete} className="text-slate-400 hover:text-red-500 p-1.5 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Nested Object Properties */}
            {type === 'object' && isExpanded && (
                <div className="pl-6 border-l border-slate-200 ml-3 space-y-2">
                    {Object.entries(value.properties || {}).map(([propKey, propValue]) => (
                        <SchemaField
                            key={propKey}
                            name={propKey}
                            value={propValue}
                            required={(value.required || []).includes(propKey)}
                            onChange={(updates) => updateProperty(propKey, updates)}
                            onDelete={() => deleteProperty(propKey)}
                        />
                    ))}
                    <button
                        onClick={handleAddProperty}
                        className="flex items-center gap-2 text-xs text-indigo-600 hover:text-indigo-700 py-1"
                    >
                        <Plus className="w-3 h-3" /> Add Property
                    </button>
                </div>
            )}

            {/* Array Items */}
            {type === 'array' && isExpanded && (
                <div className="pl-6 border-l border-slate-200 ml-3">
                    <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Items Type</div>
                    <SchemaField
                        isItem
                        value={value.items || { type: 'string' }}
                        onChange={(updates) => updateItem(updates)}
                        onDelete={() => { }} // Cannot delete the items definition itself, only change it
                    />
                </div>
            )}
        </div>
    );
}
