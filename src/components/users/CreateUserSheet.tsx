import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Eye, EyeOff } from "lucide-react";
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
import { createUser, type CreateUserPayload } from "@/services/usersApi";
import { useToast } from "@/hooks/use-toast";
import {
  SUPPORTED_COUNTRIES,
  normalizeLocalPhone,
  isValidLocalPhone,
  formatPhoneValidationMessage,
  type SupportedCountryName,
} from "@/lib/countries";

const emptyForm: CreateUserPayload = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  role: "customer",
  phoneNumber: "",
  countryName: "",
  countryCode: "",
  storeName: "",
  sendWelcomeEmail: true,
};

interface CreateUserSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserSheet({ open, onOpenChange }: CreateUserSheetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState<CreateUserPayload>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.name === form.countryName);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (response) => {
      const user = response.data?.user;
      toast({
        title: "User created",
        description: user
          ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
          : form.sendWelcomeEmail
            ? "Welcome email sent with login details."
            : "Account created successfully.",
        variant: "success",
      });
      setForm(emptyForm);
      setShowPassword(false);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: Error) => {
      toast({
        title: "Error creating user",
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

  const handlePhoneChange = (value: string) => {
    setForm({ ...form, phoneNumber: normalizeLocalPhone(value) });
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({
        title: "Validation",
        description: "First and last name are required",
        variant: "destructive",
      });
      return;
    }
    if (!form.email.trim()) {
      toast({
        title: "Validation",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    if (!form.password || form.password.length < 8) {
      toast({
        title: "Validation",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    if (form.role === "vendor" && !form.storeName?.trim()) {
      toast({
        title: "Validation",
        description: "Store name is required for vendor accounts",
        variant: "destructive",
      });
      return;
    }

    const phone = form.phoneNumber?.trim() ?? "";
    if (phone) {
      if (!form.countryName) {
        toast({
          title: "Validation",
          description: "Select a country when adding a phone number",
          variant: "destructive",
        });
        return;
      }
      if (!isValidLocalPhone(phone, form.countryName)) {
        toast({
          title: "Validation",
          description: formatPhoneValidationMessage(form.countryName),
          variant: "destructive",
        });
        return;
      }
    }

    const payload: CreateUserPayload = {
      email: form.email.trim(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role,
      sendWelcomeEmail: form.sendWelcomeEmail ?? false,
    };

    if (phone) payload.phoneNumber = phone;
    if (form.countryName) {
      payload.countryName = form.countryName;
      payload.countryCode = selectedCountry?.code ?? form.countryCode;
    }
    if (form.role === "vendor" && form.storeName?.trim()) {
      payload.storeName = form.storeName.trim();
    }

    createMutation.mutate(payload);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setForm(emptyForm);
      setShowPassword(false);
    }
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left pb-4 border-b border-border">
          <SheetTitle>Create user</SheetTitle>
          <SheetDescription>
            Manually onboard a customer or provider with login credentials.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cu-first">
                First name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cu-first"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-last">
                Last name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cu-last"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cu-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cu-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cu-password">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cu-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 8 characters"
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value: "customer" | "vendor") =>
                setForm({ ...form, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="vendor">Vendor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.role === "vendor" && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
              <Label htmlFor="cu-store">
                Store name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cu-store"
                value={form.storeName ?? ""}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="Provider store name"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Country</Label>
            <Select
              value={form.countryName || undefined}
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

          <div className="space-y-2">
            <Label htmlFor="cu-phone">Phone number</Label>
            <div className="flex gap-2">
              <div className="flex h-10 min-w-[4.5rem] items-center justify-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground shrink-0">
                {selectedCountry?.dialCode ?? "—"}
              </div>
              <Input
                id="cu-phone"
                type="tel"
                inputMode="numeric"
                maxLength={11}
                value={form.phoneNumber ?? ""}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={selectedCountry?.phonePlaceholder ?? "11 digits"}
                disabled={!form.countryName}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {form.countryName
                ? selectedCountry?.phoneHint ?? "11 digits"
                : "Select a country first, then enter an 11-digit local number"}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-border p-3">
            <Checkbox
              id="cu-welcome"
              checked={form.sendWelcomeEmail ?? false}
              onCheckedChange={(checked) =>
                setForm({ ...form, sendWelcomeEmail: checked === true })
              }
            />
            <Label htmlFor="cu-welcome" className="font-normal cursor-pointer leading-snug">
              Send welcome email with login details
            </Label>
          </div>
        </div>

        <SheetFooter className="border-t border-border pt-4 sm:flex-col sm:space-x-0 gap-2">
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {createMutation.isPending ? "Creating…" : "Create user"}
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
