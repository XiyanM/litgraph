"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface GraphNode {
    id: string;
    name: string;
    type: "book" | "concept";
    degree: number;
    author?: string;
    x?: number;
    y?: number;
}

interface GraphLink {
    source: string;
    target: string;
    prominence: number;
    rationale: string;
}

interface ConceptPanelData {
    label: string;
    books: { id: string; title: string; rationale: string }[];
}

export function BookGraph() {
    const router = useRouter();
    const fgRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [neighborIds, setNeighborIds] = useState<Set<string>>(new Set());
    const [panel, setPanel] = useState<ConceptPanelData | null>(null);

    useEffect(() => {
        function updateSize() {
            if (containerRef.current) {
                setDimensions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
            }
        }
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    useEffect(() => {
        async function load() {
            const res = await fetch("/api/books");
            const books = await res.json();
            const nodeMap = new Map<string, GraphNode>();
            const links: GraphLink[] = [];

            for (const book of books) {
                if (!nodeMap.has(book.id)) {
                    nodeMap.set(book.id, { id: book.id, name: book.title, type: "book", degree: 0, author: book.author });
                }
                for (const bc of book.concepts) {
                    const c = bc.concept;
                    if (!nodeMap.has(c.id)) {
                        nodeMap.set(c.id, { id: c.id, name: c.label, type: "concept", degree: 0 });
                    }
                    links.push({ source: book.id, target: c.id, prominence: bc.prominence, rationale: bc.rationale });
                    nodeMap.get(book.id)!.degree += 1;
                    nodeMap.get(c.id)!.degree += 1;
                }
            }
            setData({ nodes: Array.from(nodeMap.values()), links });
        }
        load();
    }, []);

    const handleNodeHover = useCallback((node: any) => {
        if (!node) {
            setHoveredNodeId(null);
            setNeighborIds(new Set());
            return;
        }
        const neighbors = new Set<string>();
        for (const link of data.links) {
            const source = typeof link.source === "object" ? (link.source as any).id : link.source;
            const target = typeof link.target === "object" ? (link.target as any).id : link.target;
            if (source === node.id) neighbors.add(target);
            if (target === node.id) neighbors.add(source);
        }
        setHoveredNodeId(node.id);
        setNeighborIds(neighbors);
    }, [data.links]);

    const handleNodeClick = useCallback((node: any) => {
        if (node.type === "book") {
            router.push(`/books/${node.id}`);
            return;
        }
        const books = data.links
            .filter((link) => {
                const target = typeof link.target === "object" ? (link.target as any).id : link.target;
                return target === node.id;
            })
            .map((link) => {
                const source = typeof link.source === "object" ? (link.source as any) : data.nodes.find((n) => n.id === link.source)!;
                return { id: source.id, title: source.name, rationale: link.rationale };
            });
        setPanel({ label: node.name, books });
    }, [data]);

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
            <ForceGraph2D
                ref={fgRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={data}
                backgroundColor="#F8F8F6"
                d3VelocityDecay={0.3}
                d3AlphaDecay={0.02}
                onEngineStop={() => fgRef.current?.zoomToFit(600, 80)}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const isHovered = node.id === hoveredNodeId;
                    const isDimmed = hoveredNodeId && node.id !== hoveredNodeId && !neighborIds.has(node.id);
                    const radius = node.type === "book" ? 5 : 2.5 + Math.min(node.degree, 6) * 0.6;

                    ctx.globalAlpha = isDimmed ? 0.2 : 1;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
                    ctx.fillStyle = node.type === "book" ? "#181818" : "#9A9892";
                    ctx.shadowColor = "#3A5A40";
                    ctx.shadowBlur = isHovered ? 10 : 0;
                    ctx.fill();

                    if (globalScale > 2.2 || isHovered) {
                        ctx.font = node.type === "book" ? `${13 / globalScale}px Lora, serif` : `${11 / globalScale}px Inter, sans-serif`;
                        ctx.fillStyle = node.type === "book" ? "#181818" : "#6B6B68";
                        ctx.globalAlpha = isDimmed ? 0.2 : 1;
                        ctx.fillText(node.name, node.x + radius + 4, node.y + 3);
                    }
                }}
                linkColor={(link: any) => {
                    if (!hoveredNodeId) return "rgba(24,24,24,0.08)";
                    const source = typeof link.source === "object" ? link.source.id : link.source;
                    const target = typeof link.target === "object" ? link.target.id : link.target;
                    const isActive = source === hoveredNodeId || target === hoveredNodeId;
                    return isActive ? "rgba(58,90,61,0.5)" : "rgba(24,24,24,0.02)";
                }}
                onNodeHover={handleNodeHover}
                onNodeClick={handleNodeClick}
                onNodeDragEnd={(node: any) => { node.fx = undefined; node.fy = undefined; }}
            />

            {panel && (
                <div style={{ position: "absolute", top: 24, right: 24, width: 280, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 10, padding: 20, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}>
                    <button onClick={() => setPanel(null)} style={{ position: "absolute", top: 12, right: 12, border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "var(--color-text-muted)" }}>✕</button>
                    <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>Theme</div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, marginTop: 4, marginBottom: 16 }}>{panel.label}</div>
                    <div style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 8 }}>Appears in</div>
                    {panel.books.map((b) => (
                        <div key={b.id} style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{b.title}</div>
                            <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2, lineHeight: 1.5 }}>{b.rationale}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}