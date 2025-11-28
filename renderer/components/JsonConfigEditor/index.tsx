'use client'
import React from "react"
import Editor from "@monaco-editor/react"

interface JsonConfigEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export default function JsonConfigEditor({ value, onChange }: JsonConfigEditorProps) {

    const handleChange = (newValue: string | undefined) => {
        if (typeof newValue === "string") {
            onChange(newValue);
        }
    };

    return (
        <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
            <Editor
                height="60vh"
                defaultLanguage="json"
                language="json"
                value={value}
                onChange={handleChange}
                options={{
                    minimap: { enabled: false },
                    formatOnPaste: true,
                    formatOnType: true,
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    tabSize: 2,
                }}
            />
        </div>
    );
}
