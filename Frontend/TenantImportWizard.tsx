"use client";

import { useState } from "react";

const steps = ["Upload File", "Validate Data", "Preview", "Confirm", "Result"];

export default function TenantImportWizard() {
    const [currentStep, setCurrentStep] = useState(0);

    return (
        <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold">Tenant Import Wizard</h2>
            <div className="mt-4 flex gap-2">
                {steps.map((step, index) => (
                    <div
                        key={step}
                        className={`rounded px-3 py-2 text-sm ${index === currentStep
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700"
                            }`}
                    >
                        {step}
                    </div>
                ))}
            </div>
            <div className="mt-6 rounded border border-dashed p-6 text-sm text-gray-600">
                Current step: {steps[currentStep]}
            </div>
            <div className="mt-6 flex gap-3">
                <button type="button" className="rounded bg-gray-200 px-4 py-2 text-sm" onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}>
                    Back
                </button>
                <button type="button" className="rounded bg-blue-600 px-4 py-2 text-sm text-white" onClick={() => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))}>
                    Next
                </button>
            </div>
        </div>
    );
}