import { useEffect, useMemo, useState } from "react";
import { Loader2Icon, SearchIcon, UserPlusIcon, XIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { User } from "@/lib/types";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { ScrollArea } from "../ui/scroll-area";

type CreateChatroomDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onCreate: (participantIds: string[]) => Promise<void>;
};

type DirectoryUser = User & { displayName: string };

const buildDisplayName = (user: User) => {
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  const nameParts = [first, last].filter(Boolean);
  return nameParts.length > 0 ? nameParts.join(" ") : user.email;
};

export const CreateChatroomDialog = ({
  open,
  onOpenChange,
  currentUserId,
  onCreate,
}: CreateChatroomDialogProps) => {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const userDirectoryQuery = useQuery({
    ...api.user.getAll(),
    enabled: open,
  });

  const availableUsers = useMemo<DirectoryUser[]>(() => {
    if (!userDirectoryQuery.data) return [];

    return userDirectoryQuery.data
      .filter((user) => user.id !== currentUserId)
      .map((user) => ({
        ...user,
        displayName: buildDisplayName(user),
      }));
  }, [userDirectoryQuery.data, currentUserId]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return availableUsers;
    const term = search.trim().toLowerCase();
    return availableUsers.filter((user) => {
      return (
        user.displayName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    });
  }, [availableUsers, search]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIds([]);
      setSubmitting(false);
    }
  }, [open]);

  const toggleUserSelection = (userId: string, nextState?: boolean) => {
    setSelectedIds((prev) => {
      const exists = prev.includes(userId);
      const shouldSelect = typeof nextState === "boolean" ? nextState : !exists;
      if (shouldSelect && !exists) {
        return [...prev, userId];
      }
      if (!shouldSelect && exists) {
        return prev.filter((id) => id !== userId);
      }
      return prev;
    });
  };

  const handleCreate = async () => {
    if (!selectedIds.length) return;
    setSubmitting(true);
    try {
      await onCreate(selectedIds);
      onOpenChange(false);
    } catch {
      // surfaced upstream via toast
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUsers = useMemo<DirectoryUser[]>(() => {
    return selectedIds
      .map((id) => availableUsers.find((user) => user.id === id))
      .filter((user): user is DirectoryUser => Boolean(user));
  }, [availableUsers, selectedIds]);

  const showEmptyState =
    !userDirectoryQuery.isLoading &&
    !userDirectoryQuery.isError &&
    filteredUsers.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5" />
            Start a new conversation
          </DialogTitle>
          <DialogDescription>
            Search for people, pick participants, then create a new chatroom.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex min-h-12 flex-1 flex-wrap items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 shadow-sm transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
                submitting && "opacity-70",
              )}
            >
              {selectedUsers.map((user) => (
                <span
                  key={user.id}
                  className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs font-medium text-muted-foreground"
                >
                  {user.displayName}
                  <button
                    type="button"
                    className="text-muted-foreground/70 transition hover:text-destructive"
                    onClick={() => toggleUserSelection(user.id, false)}
                    aria-label={`Remove ${user.displayName}`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <div className="flex flex-1 items-center gap-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.currentTarget.value)}
                  placeholder={
                    selectedUsers.length > 0
                      ? "Add more people..."
                      : "Search by name or email..."
                  }
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  disabled={submitting}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={selectedIds.length === 0 || submitting}
            >
              {submitting ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </div>

          <div className="rounded-lg border border-dashed p-4">
            {userDirectoryQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Loading people...
              </div>
            ) : null}

            {userDirectoryQuery.isError ? (
              <div className="flex items-center justify-between gap-2 text-sm text-destructive">
                <span>Failed to load people.</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => userDirectoryQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : null}

            {showEmptyState ? (
              <p className="text-sm text-muted-foreground">
                No people match "{search}".
              </p>
            ) : null}

            {!userDirectoryQuery.isLoading && !userDirectoryQuery.isError ? (
              <ScrollArea className="mt-2 h-64">
                <div className="divide-y">
                  {filteredUsers.map((user) => {
                    const checked = selectedIds.includes(user.id);
                    return (
                      <label
                        key={user.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition hover:bg-muted/50",
                          checked && "bg-muted/40",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleUserSelection(user.id, value === true)
                          }
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {user.displayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

