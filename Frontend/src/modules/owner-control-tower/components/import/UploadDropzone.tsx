'use client';

import { useRef, useState } from 'react';
import { Download, FileSpreadsheet, UploadCloud } from 'lucide-react';

type UploadDropzoneProps = {
  fileName?: string;
  onSelectFile: (file: File) => void;
  onDownloadTemplate: () => void;
};

export default function UploadDropzone({
  fileName,
  onSelectFile,
  onDownloadTemplate,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
          onSelectFile(file);
        }
      }}
      className={`rounded-[1.9rem] border-2 border-dashed p-8 text-center transition ${
        isDragging
          ? 'border-teal-400 bg-teal-50'
          : 'border-slate-300 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)]'
      }`}
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white">
        <UploadCloud className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-slate-950">
        Upload consultancy onboarding workbook
      </h3>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
        Support spreadsheet-style onboarding files with company info, branches, workflows,
        document checklist, partners, agents, role matrix, users, automations, and services.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="ds-button-primary"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Select file
        </button>
        <button type="button" onClick={onDownloadTemplate} className="ds-button-secondary">
          <Download className="h-4 w-4" />
          Download template
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onSelectFile(file);
          }
        }}
      />
      {fileName ? (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
          <FileSpreadsheet className="h-4 w-4" />
          {fileName}
        </div>
      ) : null}
    </div>
  );
}
