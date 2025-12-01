import { useEffect, useMemo, useState } from "react";
import { Loader2Icon, UserPlusIcon, XIcon, CheckIcon } from "lucide-react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
      setSelectedId(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleCreate = async () => {
    if (!selectedId) return;
    setSubmitting(true);
    try {
      await onCreate([selectedId]);
      onOpenChange(false);
    } catch {
      // surfaced upstream via toast
    } finally {
      setSubmitting(false);
    }
  };

  const selectedUser = useMemo<DirectoryUser | null>(() => {
    return availableUsers.find((user) => user.id === selectedId) ?? null;
  }, [availableUsers, selectedId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5" />
            Start a new conversation
          </DialogTitle>
          <DialogDescription>
            Search for a person to start a 1:1 chat.
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
              {selectedUser ? (
                <span className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs font-medium text-muted-foreground">
                  {selectedUser.displayName}
                  <button
                    type="button"
                    className="text-muted-foreground/70 transition hover:text-destructive"
                    onClick={() => setSelectedId(null)}
                    aria-label={`Remove ${selectedUser.displayName}`}
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Select a person below
                </span>
              )}
            </div>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!selectedId || submitting}
            >
              {submitting ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create
            </Button>
          </div>

          <div className="rounded-lg border border-dashed p-0">
            {userDirectoryQuery.isLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Loading people...
              </div>
            ) : null}

            {userDirectoryQuery.isError ? (
              <div className="flex items-center justify-between gap-2 px-4 py-3 text-sm text-destructive">
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

            {!userDirectoryQuery.isLoading && !userDirectoryQuery.isError ? (
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search people..."
                  value={search}
                  onValueChange={setSearch}
                  disabled={submitting}
                />
                <CommandList>
                  <CommandEmpty className="px-4 py-3 text-sm text-muted-foreground">
                    No people match &quot;{search}&quot;.
                  </CommandEmpty>
                  <CommandGroup heading="People">
                    {filteredUsers.map((user) => {
                      const isSelected = selectedId === user.id;
                      return (
                        <CommandItem
                          key={user.id}
                          value={user.id}
                          onSelect={() => setSelectedId(user.id)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm",
                            isSelected && "bg-muted",
                          )}
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                            {user.displayName
                              .split(/\s+/)
                              .map((part) => part[0] ?? "")
                              .join("")
                              .toUpperCase()}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-foreground">
                              {user.displayName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckIcon className="h-4 w-4 text-primary" />
                          ) : null}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
