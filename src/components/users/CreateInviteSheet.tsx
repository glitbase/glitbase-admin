import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { createInvite, type CreateInvitePayload } from "@/services/invitesApi";
import type { InviteMetadata, InviteRole } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SUPPORTED_COUNTRIES,
  normalizeLocalPhone,
  isValidLocalPhone,
  formatPhoneValidationMessage,
  type SupportedCountryName,
} from "@/lib/countries";

type InviteFormState = {
  role: InviteRole;
  email: string;
  expiresInDays: number;
  maxUses: number;
  sendEmail: boolean;
  metadata: {
    storeName: string;
    countryName: string;
    countryCode: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
};

const emptyMetadata = {
  storeName: "",
  countryName: "",
  countryCode: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
};

const emptyForm: InviteFormState = {
  role: "customer",
  email: "",
  expiresInDays: 7,
  maxUses: 1,
  sendEmail: false,
  metadata: { ...emptyMetadata },
};

interface CreateInviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteUrlCreated?: (url: string) => void;
}

function buildPayload(form: InviteFormState): CreateInvitePayload {
  const payload: CreateInvitePayload = {
    role: form.role,
    expiresInDays: form.expiresInDays,
    maxUses: form.maxUses,
    sendEmail: form.sendEmail,
  };

  if (form.email.trim()) payload.email = form.email.trim();

  const metadata: InviteMetadata = {};
  const m = form.metadata;

  if (m.storeName.trim()) metadata.storeName = m.storeName.trim();
  if (m.firstName.trim()) metadata.firstName = m.firstName.trim();
  if (m.lastName.trim()) metadata.lastName = m.lastName.trim();
  if (m.phoneNumber.trim()) metadata.phoneNumber = m.phoneNumber.trim();
  if (m.countryName.trim()) {
    metadata.countryName = m.countryName.trim();
    metadata.countryCode =
      m.countryCode.trim() ||
      SUPPORTED_COUNTRIES.find((c) => c.name === m.countryName)?.code ||
      "";
  }

  if (Object.keys(metadata).length > 0) payload.metadata = metadata;

  return payload;
}

export function CreateInviteSheet({
  open,
  onOpenChange,
  onInviteUrlCreated,
}: CreateInviteSheetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<InviteFormState>(emptyForm);
  const [profileOpen, setProfileOpen] = useState(false);

  const selectedCountry = SUPPORTED_COUNTRIES.find(
    (c) => c.name === form.metadata.countryName
  );

  const handleCountryChange = (countryName: SupportedCountryName) => {
    const country = SUPPORTED_COUNTRIES.find((c) => c.name === countryName);
    setForm({
      ...form,
      metadata: {
        ...form.metadata,
        countryName,
        countryCode: country?.code ?? "",
        phoneNumber: "",
      },
    });
  };

  const handlePrefillPhoneChange = (value: string) => {
    setForm({
      ...form,
      metadata: {
        ...form.metadata,
        phoneNumber: normalizeLocalPhone(value),
      },
    });
  };

  const createMutation = useMutation({
    mutationFn: createInvite,
    onSuccess: (response) => {
      const inviteUrl = response.data?.inviteUrl;
      const sentEmail = Boolean(form.email?.trim() && form.sendEmail);

      queryClient.invalidateQueries({ queryKey: ["admin-invites"] });

      if (sentEmail) {
        toast({
          title: "Invite sent",
          description: `Invitation email sent to ${form.email}`,
          variant: "success",
        });
        setForm(emptyForm);
        onOpenChange(false);
      } else if (inviteUrl) {
        onInviteUrlCreated?.(inviteUrl);
        setForm(emptyForm);
        onOpenChange(false);
      } else {
        toast({ title: "Invite created", variant: "success" });
        setForm(emptyForm);
        onOpenChange(false);
      }
    },
    onError: (err: Error) => {
      toast({
        title: "Error creating invite",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (form.sendEmail && !form.email?.trim()) {
      toast({
        title: "Validation",
        description: "Email is required when sending an invite email",
        variant: "destructive",
      });
      return;
    }

    const phone = form.metadata.phoneNumber.trim();
    const countryName = form.metadata.countryName;
    if (phone) {
      if (!countryName) {
        toast({
          title: "Validation",
          description: "Select a country when adding a prefilled phone number",
          variant: "destructive",
        });
        return;
      }
      if (!isValidLocalPhone(phone, countryName)) {
        toast({
          title: "Validation",
          description: formatPhoneValidationMessage(countryName),
          variant: "destructive",
        });
        return;
      }
    }

    createMutation.mutate(buildPayload(form));
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setForm(emptyForm);
      setProfileOpen(false);
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b border-border">
          <SheetTitle>New invite</SheetTitle>
          <SheetDescription>
            Send a targeted email or generate an open link for onboarding.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-6">
          <div className="flex gap-2 p-1 rounded-lg bg-muted">
            {(["customer", "vendor"] as InviteRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    role,
                    metadata:
                      role === "customer"
                        ? { ...form.metadata, storeName: "" }
                        : form.metadata,
                  })
                }
                className={cn(
                  "flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors",
                  form.role === role
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ci-email">Email</Label>
            <Input
              id="ci-email"
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Leave blank for an open invite link"
            />
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ci-expiry">Expires in (days)</Label>
              <Input
                id="ci-expiry"
                type="number"
                min={1}
                value={form.expiresInDays}
                onChange={(e) =>
                  setForm({ ...form, expiresInDays: parseInt(e.target.value, 10) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ci-uses">Max uses</Label>
              <Input
                id="ci-uses"
                type="number"
                min={1}
                value={form.maxUses ?? 1}
                onChange={(e) =>
                  setForm({ ...form, maxUses: parseInt(e.target.value, 10) || 1 })
                }
              />
            </div>
          </div>

          {form.role === "vendor" && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">Vendor defaults</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="ci-store">Store name</Label>
                  <Input
                    id="ci-store"
                    value={form.metadata.storeName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metadata: { ...form.metadata, storeName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={form.metadata.countryName || undefined}
                    onValueChange={(value) => handleCountryChange(value as SupportedCountryName)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCountry && (
                    <p className="text-xs text-muted-foreground">
                      Country code: {selectedCountry.code} · Dial code: {selectedCountry.dialCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Collapsible open={profileOpen} onOpenChange={setProfileOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                Prefill profile fields
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    profileOpen && "rotate-180"
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ci-first">First name</Label>
                  <Input
                    id="ci-first"
                    value={form.metadata.firstName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metadata: { ...form.metadata, firstName: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ci-last">Last name</Label>
                  <Input
                    id="ci-last"
                    value={form.metadata.lastName}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        metadata: { ...form.metadata, lastName: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {form.role === "customer" && (
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select
                    value={form.metadata.countryName || undefined}
                    onValueChange={(value) => handleCountryChange(value as SupportedCountryName)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.name}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCountry && (
                    <p className="text-xs text-muted-foreground">
                      Country code: {selectedCountry.code} · Dial code: {selectedCountry.dialCode}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ci-phone">Phone number</Label>
                <div className="flex gap-2">
                  <div className="flex h-10 min-w-[4.5rem] items-center justify-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground shrink-0">
                    {selectedCountry?.dialCode ?? "—"}
                  </div>
                  <Input
                    id="ci-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={form.metadata.phoneNumber}
                    onChange={(e) => handlePrefillPhoneChange(e.target.value)}
                    placeholder={selectedCountry?.phonePlaceholder ?? "11 digits"}
                    disabled={!form.metadata.countryName}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {form.metadata.countryName
                    ? selectedCountry?.phoneHint ?? "11 digits"
                    : "Select a country first to enter a phone number"}
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center gap-2 rounded-lg border border-border p-3">
            <Checkbox
              id="ci-send"
              checked={form.sendEmail ?? false}
              onCheckedChange={(checked) =>
                setForm({ ...form, sendEmail: checked === true })
              }
            />
            <Label htmlFor="ci-send" className="font-normal cursor-pointer leading-snug">
              Send invitation email (requires email above)
            </Label>
          </div>
        </div>

        <SheetFooter className="border-t border-border pt-4 sm:flex-col sm:space-x-0 gap-2">
          <Button className="w-full" onClick={handleSubmit} disabled={createMutation.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Creating…" : "Create invite"}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleOpenChange(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export async function copyInviteLink(url: string) {
  await navigator.clipboard.writeText(url);
}

export function InviteLinkBanner({
  url,
  onDismiss,
}: {
  url: string;
  onDismiss: () => void;
}) {
  const { toast } = useToast();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
      <Link2 className="h-5 w-5 text-primary shrink-0 hidden sm:block" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-medium text-foreground">Invite link ready</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{url}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            await copyInviteLink(url);
            toast({ title: "Link copied", variant: "success" });
          }}
        >
          Copy link
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
