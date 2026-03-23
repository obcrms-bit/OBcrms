"use client";

import Header from "@/Header";

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="p-6">{children}</main>
        </div>
    );
}