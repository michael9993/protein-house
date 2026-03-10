import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, FolderOpen, Folder } from "lucide-react";
import type { SourcedProduct } from "./types";

interface CategoryPreviewProps {
  products: SourcedProduct[];
}

interface TreeNode {
  name: string;
  count: number; // products at this exact node (leaf)
  children: Map<string, TreeNode>;
}

function buildTree(products: SourcedProduct[]): TreeNode {
  const root: TreeNode = { name: "Categories", count: 0, children: new Map() };

  for (const p of products) {
    const path = p.categoryPath && p.categoryPath.length > 0
      ? p.categoryPath
      : p.editCategory
        ? [p.editCategory]
        : [];

    if (path.length === 0) continue;

    let current = root;
    for (let i = 0; i < path.length; i++) {
      const seg = path[i];
      if (!current.children.has(seg)) {
        current.children.set(seg, { name: seg, count: 0, children: new Map() });
      }
      current = current.children.get(seg)!;
      if (i === path.length - 1) {
        current.count++;
      }
    }
  }

  return root;
}

function countTotal(node: TreeNode): number {
  let total = node.count;
  for (const child of node.children.values()) {
    total += countTotal(child);
  }
  return total;
}

function TreeNodeView({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = node.children.size > 0;
  const total = countTotal(node);
  const children = Array.from(node.children.values()).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <button
        onClick={() => hasChildren && setOpen(!open)}
        className={`flex items-center gap-1.5 w-full text-left py-0.5 hover:bg-gray-50 rounded transition-colors ${
          hasChildren ? "cursor-pointer" : "cursor-default"
        }`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          open ? <ChevronDown size={12} className="text-gray-400 shrink-0" /> : <ChevronRight size={12} className="text-gray-400 shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {hasChildren ? (
          open ? <FolderOpen size={14} className="text-brand shrink-0" /> : <Folder size={14} className="text-brand shrink-0" />
        ) : (
          <Folder size={14} className="text-gray-400 shrink-0" />
        )}
        <span className="text-xs text-text-primary truncate">{node.name}</span>
        <span className="text-[10px] text-text-muted ml-auto mr-2 shrink-0">
          {total}
        </span>
      </button>
      {open && hasChildren && (
        <div>
          {children.map((child) => (
            <TreeNodeView key={child.name} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CategoryPreview({ products }: CategoryPreviewProps) {
  const [collapsed, setCollapsed] = useState(false);

  const tree = useMemo(() => buildTree(products), [products]);
  const totalCategories = useMemo(() => {
    let count = 0;
    function walk(node: TreeNode) {
      for (const child of node.children.values()) {
        count++;
        walk(child);
      }
    }
    walk(tree);
    return count;
  }, [tree]);

  if (tree.children.size === 0) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-semibold text-text-primary">
          Category Tree ({totalCategories} categories)
        </span>
        {collapsed ? <ChevronRight size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {!collapsed && (
        <div className="px-2 py-2 max-h-[300px] overflow-y-auto">
          {Array.from(tree.children.values())
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <TreeNodeView key={child.name} node={child} depth={0} />
            ))}
        </div>
      )}
    </div>
  );
}
