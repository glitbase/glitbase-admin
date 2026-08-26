import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldPlus, Eye, EyeOff } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createAdmin, type CreateAdminPayload } from "@/services/adminsApi";
import { useToast } from "@/hooks/use-toast";
import {
  SUPPORTED_COUNTRIES,
  normalizeLocalPhone,
  isValidLocalPhone,
  formatPhoneValidationMessage,
  type SupportedCountryName,
} from "@/lib/countries";

const emptyForm: CreateAdminPayload = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  countryName: "",
  countryCode: "",
  mustChangePassword: true,
  sendWelcomeEmail: true,
  isSuperAdmin: false,
};

interface CreateAdminSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAdminSheet({ open, onOpenChange }: CreateAdminSheetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateAdminPayload>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<CreateAdminPayload | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
      setShowPassword(false);
      setConfirmOpen(false);
      setPendingPayload(null);
    }
  }, [open]);

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.name === form.countryName);

  const createMutation = useMutation({
    mutationFn: createAdmin,
    onSuccess: (response) => {
      const user = response.data?.user;
      toast({
        title: "Admin created",
        description: user?.email ?? "The admin account has been created.",
        variant: "success",
      });
      setConfirmOpen(false);
      setPendingPayload(null);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["admin-team"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Could not create admin",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCountryChange = (countryName: SupportedCountryName) => {
    const country = SUPPORTED_COUNTRIES.find((c) => c.name === countryName);
    setForm({
      ...form,
      countryName,
      countryCode: country?.code ?? "",
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.email.trim() || !form.password.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      toast({
        title: "Validation",
        description: "Email, password, first name, and last name are required",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 8) {
      toast({
        title: "Validation",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    if (!form.countryName || !form.countryCode) {
      toast({
        title: "Validation",
        description: "Select a supported country",
        variant: "destructive",
      });
      return;
    }

    if (!isValidLocalPhone(form.phoneNumber)) {
      toast({
        title: "Validation",
        description: formatPhoneValidationMessage(form.countryName),
        variant: "destructive",
      });
      return;
    }

    const payload: CreateAdminPayload = {
      ...form,
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phoneNumber: normalizeLocalPhone(form.phoneNumber),
    };

    setPendingPayload(payload);
    setConfirmOpen(true);
  };

  const handleConfirmCreate = () => {
    if (!pendingPayload) return;
    createMutation.mutate(pendingPayload);
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5" />
            Add admin
          </SheetTitle>
          <SheetDescription>
            Create a new backoffice admin account.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-first-name">First name</Label>
              <Input
                id="admin-first-name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-last-name">Last name</Label>
              <Input
                id="admin-last-name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={form.countryName} onValueChange={handleCountryChange}>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-phone">Phone number</Label>
            <Input
              id="admin-phone"
              value={form.phoneNumber}
              onChange={(e) =>
                setForm({ ...form, phoneNumber: normalizeLocalPhone(e.target.value) })
              }
              placeholder={selectedCountry?.phonePlaceholder}
            />
            {selectedCountry && (
              <p className="text-xs text-muted-foreground">{selectedCountry.phoneHint}</p>
            )}
          </div>

          <div className="space-y-3 rounded-md border border-border p-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="admin-must-change-password"
                checked={form.mustChangePassword ?? true}
                onCheckedChange={(checked) =>
                  setForm({ ...form, mustChangePassword: checked === true })
                }
              />
              <Label htmlFor="admin-must-change-password">Require password change on first login</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="admin-send-welcome-email"
                checked={form.sendWelcomeEmail ?? true}
                onCheckedChange={(checked) =>
                  setForm({ ...form, sendWelcomeEmail: checked === true })
                }
              />
              <Label htmlFor="admin-send-welcome-email">Send welcome email</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="admin-is-super-admin"
                checked={form.isSuperAdmin ?? false}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isSuperAdmin: checked === true })
                }
              />
              <Label htmlFor="admin-is-super-admin">Super admin</Label>
            </div>
          </div>

          <SheetFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create admin"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>

    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create admin account?</DialogTitle>
          <DialogDescription>
            {pendingPayload?.isSuperAdmin ? (
              <>
                <strong>{pendingPayload.email}</strong> will be created as a{" "}
                <strong>super admin</strong> with full backoffice privileges.
              </>
            ) : (
              <>
                <strong>{pendingPayload?.email}</strong> will be created as a regular admin with
                standard backoffice access.
              </>
            )}
            {pendingPayload?.sendWelcomeEmail && " A welcome email will be sent."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleConfirmCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating…" : "Create admin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
