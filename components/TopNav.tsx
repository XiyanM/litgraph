"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function TopNav({ onAddBook }: { onAddBook: () => void }) {
    const pathname = usePathname();
    const linkStyle = (active: boolean) => ({
        fontSize: 14,
        color: active ? "var(--color-text)" : "var(--color-text-muted)",
        fontWeight: active ? 600 : 400,
    });

    return (
        <nav
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                borderBottom: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                zIndex: 50,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                <img
                    src="/logosite.png"
                    alt="litgraph"
                    style={{ height: 26, width: "auto", display: "block" }}
                />
                <div style={{ display: "flex", gap: 20 }}>
                    <Link href="/" style={linkStyle(pathname === "/")}>Library</Link>
                    <Link href="/graph" style={linkStyle(pathname === "/graph")}>Graph</Link>
                </div>
            </div>
            <button
                onClick={onAddBook}
                style={{
                    fontSize: 13,
                    fontWeight: 500,
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    cursor: "pointer",
                }}
            >
                + Add Book
            </button>
        </nav>
    );
}