"use client";

import { useState } from "react";
import { TopNav } from "@/components/TopNav";
import { AddBookPanel } from "@/components/AddBookPanel";

export function AppShell({ children }: { children: React.ReactNode }) {
    const [addBookOpen, setAddBookOpen] = useState(false);

    return (
        <>
            <TopNav onAddBook={() => setAddBookOpen(true)} />
            <div style={{ paddingTop: 56 }}>{children}</div>
            <AddBookPanel open={addBookOpen} onClose={() => setAddBookOpen(false)} />
        </>
    );
}