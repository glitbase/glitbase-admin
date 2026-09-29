import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendAdminUserEmail } from "@/services/usersApi";
import { useToast } from "@/hooks/use-toast";

const SUBJECT_MAX = 200;
const MESSAGE_MIN = 1;
const MESSAGE_MAX = 5000;

export interface SendUserEmailTarget {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  accountStatus?: string;
  deletedAt?: Date | string | null;
}

interface SendUserEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SendUserEmailTarget | null;
}

function getRecipientLabel(user: SendUserEmailTarget) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name ? `${name} (${user.email})` : user.email;
}

function isDeletedUser(user: SendUserEmailTarget) {
  return Boolean(user.deletedAt || user.accountStatus === "deleted");
}

export function SendUserEmailDialog({ open, onOpenChange, user }: SendUserEmailDialogProps) {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setSubject("");
      setMessage("");
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      sendAdminUserEmail(user!.id, {
        subject: subject.trim(),
        message: message.trim(),
      }),
    onSuccess: (response) => {
      const recipient = response.data?.recipient;
      toast({
        title: "Email sent",
        description: recipient
          ? `Message delivered to ${recipient.email}`
          : "The user will receive your email shortly.",
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not send email",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const trimmedSubject = subject.trim();
  const trimmedMessage = message.trim();
  const subjectValid = trimmedSubject.length > 0 && trimmedSubject.length <= SUBJECT_MAX;
  const messageValid =
    trimmedMessage.length >= MESSAGE_MIN && trimmedMessage.length <= MESSAGE_MAX;
  const deleted = user ? isDeletedUser(user) : false;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || deleted || !subjectValid || !messageValid) return;
    mutation.mutate();
  };

  const greetingName = user?.firstName?.trim() || "there";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Send email
          </DialogTitle>
          <DialogDescription>
            Sends a branded Glitbase notification email. The message opens with &quot;Hi {greetingName},&quot;
            followed by your text.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recipient
              </p>
              <p className="font-medium text-foreground mt-0.5 break-all">{getRecipientLabel(user)}</p>
            </div>

            {deleted && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 flex gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-destructive">
                  This account is deleted. Email cannot be sent to deleted users.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="user-email-subject">
                  Subject <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {trimmedSubject.length}/{SUBJECT_MAX}
                </span>
              </div>
              <Input
                id="user-email-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, SUBJECT_MAX))}
                placeholder="Regarding your account"
                disabled={deleted || mutation.isPending}
                maxLength={SUBJECT_MAX}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="user-email-message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <span className="text-xs text-muted-foreground">
                  {trimmedMessage.length}/{MESSAGE_MAX}
                </span>
              </div>
              <Textarea
                id="user-email-message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
                placeholder="We noticed an issue with your recent booking and wanted to reach out..."
                rows={8}
                disabled={deleted || mutation.isPending}
                className="resize-y min-h-[140px]"
              />
            </div>

            <div className="rounded-md border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Preview opening:</span> Hi {greetingName},
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={deleted || !subjectValid || !messageValid || mutation.isPending}
              >
                {mutation.isPending ? "Sending…" : "Send email"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
