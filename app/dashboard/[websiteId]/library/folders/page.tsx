"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isValidObjectId } from "@/utils/validation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchWebsiteDetailsById } from "@/store/slices/websitesSlice";
import {
  fetchFolders,
  createFolder,
  renameFolder,
  deleteFolder,
} from "@/store/slices/foldersSlice";
import type { FolderItem } from "@/lib/api/repositories/foldersRepository";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
  Link2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";

export default function FoldersPage({
  params,
}: {
  params: Promise<{ websiteId: string }>;
}) {
  const { websiteId } = use(params);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { folders, loading, creating, renaming, deleting } = useAppSelector(
    (state) => state.folders,
  );
  const [renameTarget, setRenameTarget] = useState<FolderItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FolderItem | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  useEffect(() => {
    if (!isValidObjectId(websiteId)) {
      router.push("/dashboard");
      return;
    }
    dispatch(fetchWebsiteDetailsById(websiteId));
    dispatch(fetchFolders(websiteId));
  }, [websiteId, router, dispatch]);

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    if (renameValue.trim() === renameTarget.name) {
      setRenameTarget(null);
      return;
    }
    const result = await dispatch(
      renameFolder({
        websiteId,
        oldName: renameTarget.name,
        newName: renameValue.trim(),
      }),
    );
    if (renameFolder.fulfilled.match(result)) {
      toast.success("Folder renamed");
      setRenameTarget(null);
      dispatch(fetchFolders(websiteId));
    } else {
      toast.error(
        typeof result.payload === "string"
          ? result.payload
          : "Failed to rename",
      );
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) return;
    const result = await dispatch(
      createFolder({ websiteId, name: createName.trim() }),
    );
    if (createFolder.fulfilled.match(result)) {
      toast.success("Folder created");
      setCreateOpen(false);
      setCreateName("");
      dispatch(fetchFolders(websiteId));
    } else {
      toast.error(
        typeof result.payload === "string"
          ? result.payload
          : "Failed to create folder",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(
      deleteFolder({ websiteId, name: deleteTarget.name }),
    );
    if (deleteFolder.fulfilled.match(result)) {
      toast.success(`Moved ${deleteTarget.linkCount} link(s) to uncategorized`);
      setDeleteTarget(null);
      dispatch(fetchFolders(websiteId));
    } else {
      toast.error(
        typeof result.payload === "string"
          ? result.payload
          : "Failed to remove folder",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/${websiteId}/library/folders`}
          className="hover:text-foreground transition-colors"
        >
          Library
        </Link>
        <span>/</span>
        <span className="font-medium text-foreground">Folders</span>
      </nav>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-foreground font-semibold text-lg mb-1">
              Folders
            </h1>
            <p className="text-muted-foreground text-sm">
              Organize your links into folders. Create folders or add links in
              the Link Builder.
            </p>
          </div>
          <Button
            variant="stone"
            size="sm"
            className="shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Create folder
          </Button>
        </div>

        {folders.length === 0 ? (
          <Card className="border rounded-lg">
            <CardContent className="flex flex-col items-center justify-center py-16 px-6">
              <Folder className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-foreground font-semibold text-lg mb-2">
                No folders yet
              </h2>
              <p className="text-muted-foreground text-sm text-center max-w-md mb-4">
                Create a folder to organize your links, or add links in the Link
                Builder and assign them to folders.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  variant="stone"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Create folder
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/${websiteId}/links`}>
                    <Link2 className="h-4 w-4 mr-2" />
                    Create link
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border rounded-lg overflow-hidden">
            <CardHeader className="px-4 py-3 border-b bg-muted/30">
              <CardTitle className="text-sm">Your folders</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {folders.length} folder{folders.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {folders.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen className="h-5 w-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="font-medium text-foreground truncate">
                          {f.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {f.linkCount} link{f.linkCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setRenameTarget(f);
                          setRenameValue(f.name);
                        }}
                        title="Rename"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(f)}
                        title="Remove folder (links move to uncategorized)"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={!!renameTarget}
        onOpenChange={(o) => !o && setRenameTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={renaming || !renameValue.trim()}
            >
              {renaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Rename"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove folder?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            &quot;{deleteTarget?.name}&quot; will be removed.{" "}
            {deleteTarget?.linkCount || 0} link(s) will move to uncategorized.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create folder</DialogTitle>
          </DialogHeader>
          <Input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !createName.trim()}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
