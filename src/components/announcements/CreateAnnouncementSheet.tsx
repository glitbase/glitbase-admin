import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createAnnouncement, type CreateAnnouncementPayload } from "@/services/announcementsApi";
import type {
  AnnouncementAudience,
  AnnouncementChannel,
  AnnouncementType,
} from "@/types/api";
import { useToast } from "@/hooks/use-toast";

type FormState = {
  title: string;
  body: string;
  type: AnnouncementType;
  audience: AnnouncementAudience[];
  channels: AnnouncementChannel[];
  imageUrl: string;
  actionUrl: string;
};

const emptyForm: FormState = {
  title: "",
  body: "",
  type: "announcement",
  audience: ["customers", "providers"],
  channels: ["email", "in_app", "push"],
  imageUrl: "",
  actionUrl: "",
};

const TYPE_OPTIONS: { value: AnnouncementType; label: string }[] = [
  { value: "announcement", label: "Announcement" },
  { value: "update", label: "Update" },
  { value: "promotion", label: "Promotion" },
];

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string; description: string }[] = [
  { value: "customers", label: "Customers", description: "Users with the customer role" },
  { value: "providers", label: "Providers", description: "Users with the vendor role" },
];

const CHANNEL_OPTIONS: { value: AnnouncementChannel; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "in_app", label: "In-app" },
  { value: "push", label: "Push" },
];

interface CreateAnnouncementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function CreateAnnouncementSheet({ open, onOpenChange }: CreateAnnouncementSheetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);

  const createMutation = useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      toast({
        title: "Broadcast queued",
        description: "Delivery has started in the background.",
        variant: "success",
      });
      setForm(emptyForm);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to send broadcast",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim() || !form.body.trim()) {
      toast({
        title: "Validation",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    if (form.audience.length === 0) {
      toast({
        title: "Validation",
        description: "Select at least one audience",
        variant: "destructive",
      });
      return;
    }

    if (form.channels.length === 0) {
      toast({
        title: "Validation",
        description: "Select at least one delivery channel",
        variant: "destructive",
      });
      return;
    }

    const payload: CreateAnnouncementPayload = {
      title: form.title.trim(),
      body: form.body.trim(),
      type: form.type,
      audience: form.audience,
      channels: form.channels,
    };

    if (form.imageUrl.trim()) payload.imageUrl = form.imageUrl.trim();
    if (form.actionUrl.trim()) payload.actionUrl = form.actionUrl.trim();

    createMutation.mutate(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            New broadcast
          </SheetTitle>
          <SheetDescription>
            Send an announcement to customers and/or providers via email, in-app, and push.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="announcement-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. New feature launch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-body">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="announcement-body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write the announcement message..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(value) => setForm({ ...form, type: value as AnnouncementType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>
              Audience <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2 rounded-md border border-border p-3">
              {AUDIENCE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <Checkbox
                    checked={form.audience.includes(option.value)}
                    onCheckedChange={() =>
                      setForm({ ...form, audience: toggleValue(form.audience, option.value) })
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>
              Channels <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-3 rounded-md border border-border p-3">
              {CHANNEL_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={form.channels.includes(option.value)}
                    onCheckedChange={() =>
                      setForm({ ...form, channels: toggleValue(form.channels, option.value) })
                    }
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-image">Image URL (optional)</Label>
            <Input
              id="announcement-image"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="announcement-action">Action URL (optional)</Label>
            <Input
              id="announcement-action"
              value={form.actionUrl}
              onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
              placeholder="/updates/group-bookings"
            />
            <p className="text-xs text-muted-foreground">
              Optional deep link opened when users tap the notification.
            </p>
          </div>

          <SheetFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Sending…" : "Send broadcast"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
