import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import Pagination from "@/components/common/Pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table as TableComponent,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building,
  Edit,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { z } from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type CompanyDto = {
  id: string;
  name: string;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usersCount: number;
  subscriptionsCount: number;
  chatSessionsCount: number;
};

type CompaniesListResponse = {
  data: CompanyDto[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

const onlyDigits = (value: string) => value.replace(/\D/g, "");

const formatCnpj = (value: string) => {
  const digits = onlyDigits(value).slice(0, 14);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 8),
    digits.slice(8, 12),
    digits.slice(12, 14),
  ];

  if (!digits) return "";
  if (digits.length <= 2) return parts[0];
  if (digits.length <= 5) return `${parts[0]}.${parts[1]}`;
  if (digits.length <= 8) return `${parts[0]}.${parts[1]}.${parts[2]}`;
  if (digits.length <= 12) return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}`;
  return `${parts[0]}.${parts[1]}.${parts[2]}/${parts[3]}-${parts[4]}`;
};

const formatPhoneBR = (value: string) => {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (digits.length <= 2) return `(${ddd}`;
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) {
    const p1 = rest.slice(0, 4);
    const p2 = rest.slice(4);
    return p2 ? `(${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}`;
  }
  const p1 = rest.slice(0, 5);
  const p2 = rest.slice(5);
  return p2 ? `(${ddd}) ${p1}-${p2}` : `(${ddd}) ${p1}`;
};

const companyFormSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  cnpj: z
    .string()
    .trim()
    .max(32, "CNPJ muito longo")
    .optional()
    .or(z.literal(""))
    .refine((v) => {
      const n = onlyDigits(v ?? "");
      return n.length === 0 || n.length === 14;
    }, "CNPJ deve ter 14 dígitos"),
  email: z
    .string()
    .trim()
    .max(255, "Email muito longo")
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(64, "Telefone muito longo")
    .optional()
    .or(z.literal(""))
    .refine((v) => {
      const n = onlyDigits(v ?? "");
      return n.length === 0 || n.length === 10 || n.length === 11;
    }, "Telefone deve ter 10 ou 11 dígitos"),
  website: z
    .string()
    .trim()
    .max(255, "Website muito longo")
    .url("Website inválido (use https://...)")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

const toTrimmedOrUndefined = (v: string | undefined) => {
  const s = (v ?? "").trim();
  return s ? s : undefined;
};

export default function Empresas() {
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CompanyDto | null>(null);

  const companyForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      website: "",
      is_active: true,
    },
    mode: "onSubmit",
  });

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage],
  );

  const fetchCompanies = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) setRefreshing(true);
        else setLoading(true);

        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(itemsPerPage),
        });
        if (searchTerm.trim()) params.append("search", searchTerm.trim());

        const res = await api.get(`/api/companies?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as CompaniesListResponse;
        setCompanies(Array.isArray(json.data) ? json.data : []);
        setTotalItems(json.meta?.total ?? 0);
      } catch (e) {
        setCompanies([]);
        setTotalItems(0);
        const msg = e instanceof Error ? e.message : "Erro desconhecido";
        toast.error(`Erro ao carregar empresas: ${msg}`);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentPage, itemsPerPage, searchTerm],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      void fetchCompanies();
    }, 250);
    return () => clearTimeout(t);
  }, [fetchCompanies]);

  const openCreate = () => {
    setEditing(null);
    companyForm.reset({
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      website: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEdit = (company: CompanyDto) => {
    setEditing(company);
    companyForm.reset({
      name: company.name ?? "",
      cnpj: formatCnpj(company.cnpj ?? ""),
      email: company.email ?? "",
      phone: formatPhoneBR(company.phone ?? ""),
      website: company.website ?? "",
      is_active: company.is_active,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    companyForm.reset({
      name: "",
      cnpj: "",
      email: "",
      phone: "",
      website: "",
      is_active: true,
    });
  };

  const getErrorMessageFromResponse = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data: unknown = await res.json().catch(() => undefined);
      if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        const msg = obj.message;
        if (typeof msg === "string" && msg.trim()) return msg;
        if (Array.isArray(msg)) {
          const asStrings = msg.filter((m) => typeof m === "string") as string[];
          if (asStrings.length) return asStrings.join("\n");
        }
      }
    }
    const text = await res.text().catch(() => "");
    return text || `HTTP ${res.status}`;
  };

  const onSubmitCompany = async (values: CompanyFormValues) => {
    companyForm.clearErrors("root");
    try {
      const base = {
        name: values.name.trim(),
        is_active: values.is_active,
      };

      const email = toTrimmedOrUndefined(values.email);
      const website = toTrimmedOrUndefined(values.website);

      const cnpjDigits = onlyDigits(values.cnpj ?? "");
      const phoneDigits = onlyDigits(values.phone ?? "");

      const payload = editing
        ? {
            ...base,
            cnpj: cnpjDigits ? cnpjDigits : null,
            email: email ?? null,
            phone: phoneDigits ? phoneDigits : null,
            website: website ?? null,
          }
        : {
            ...base,
            ...(cnpjDigits ? { cnpj: cnpjDigits } : {}),
            ...(email ? { email } : {}),
            ...(phoneDigits ? { phone: phoneDigits } : {}),
            ...(website ? { website } : {}),
          };

      const res = editing
        ? await api.put(`/api/companies/${encodeURIComponent(editing.id)}`, payload)
        : await api.post("/api/companies", payload);

      if (!res.ok) {
        const message = await getErrorMessageFromResponse(res);
        companyForm.setError("root", { type: "server", message });
        toast.error(message);
        return;
      }

      toast.success(editing ? "Empresa atualizada" : "Empresa criada");
      closeModal();
      void fetchCompanies(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido";
      companyForm.setError("root", { type: "client", message });
      toast.error(message);
    }
  };

  const toggleActive = async (company: CompanyDto) => {
    try {
      const res = await api.put(`/api/companies/${encodeURIComponent(company.id)}`, {
        is_active: !company.is_active,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      toast.success(company.is_active ? "Empresa desativada" : "Empresa ativada");
      void fetchCompanies(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error(`Falha ao atualizar status: ${msg}`);
    }
  };

  const deactivate = async (company: CompanyDto) => {
    try {
      const res = await api.delete(`/api/companies/${encodeURIComponent(company.id)}`);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      toast.success("Empresa desativada");
      void fetchCompanies(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      toast.error(`Falha ao desativar: ${msg}`);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Empresas"
        description="Gerencie as empresas do sistema"
        icon={Building}
        badges={[
          { label: `${totalItems} empresas`, icon: Building },
          { label: `Página ${currentPage} de ${totalPages}`, icon: Building },
        ]}
        actions={[
          {
            label: refreshing ? "Atualizando..." : "Atualizar",
            icon: refreshing ? Loader2 : RefreshCw,
            onClick: () => fetchCompanies(true),
            variant: "primary" as const,
            disabled: refreshing,
          },
          {
            label: "Nova Empresa",
            icon: Plus,
            onClick: openCreate,
            variant: "primary" as const,
          },
        ]}
      />

      <div className="container mx-auto px-4">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CNPJ ou email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Carregando empresas...</p>
            </CardContent>
          </Card>
        ) : totalItems > 0 ? (
          <>
            <Card>
              <CardContent className="p-0">
                <TableComponent>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.cnpj || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {c.email || "-"}
                        </TableCell>
                        <TableCell>{c.usersCount ?? 0}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                              c.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {c.is_active ? "Ativa" : "Inativa"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(c)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleActive(c)}>
                                <Building className="w-4 h-4 mr-2" />
                                {c.is_active ? "Desativar" : "Ativar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deactivate(c)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Desativar (remover)
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableComponent>
              </CardContent>
            </Card>

            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(n) => {
                    setItemsPerPage(n);
                    setCurrentPage(1);
                  }}
                  showPageSizeSelector={true}
                  pageSizeOptions={[5, 10, 25, 50]}
                  className="border-t pt-4"
                />
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm.trim()
                  ? "Tente ajustar o termo de busca."
                  : "Nenhuma empresa cadastrada no sistema."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize as informações da empresa."
                : "Preencha os campos para criar uma nova empresa."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4 py-2"
            onSubmit={companyForm.handleSubmit(onSubmitCompany)}
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="name"
                  autoFocus
                  {...companyForm.register("name")}
                />
                {companyForm.formState.errors.name?.message && (
                  <p className="text-sm text-red-600">
                    {companyForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cnpj" className="text-right">
                CNPJ
              </Label>
              <div className="col-span-3 space-y-1">
                <Controller
                  control={companyForm.control}
                  name="cnpj"
                  render={({ field }) => (
                    <Input
                      id="cnpj"
                      inputMode="numeric"
                      placeholder="00.000.000/0000-00"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(formatCnpj(e.target.value))}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
                {companyForm.formState.errors.cnpj?.message && (
                  <p className="text-sm text-red-600">
                    {companyForm.formState.errors.cnpj.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <div className="col-span-3 space-y-1">
                <Input id="email" type="email" {...companyForm.register("email")} />
                {companyForm.formState.errors.email?.message && (
                  <p className="text-sm text-red-600">
                    {companyForm.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Telefone
              </Label>
              <div className="col-span-3 space-y-1">
                <Controller
                  control={companyForm.control}
                  name="phone"
                  render={({ field }) => (
                    <Input
                      id="phone"
                      inputMode="tel"
                      placeholder="(00) 00000-0000"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
                {companyForm.formState.errors.phone?.message && (
                  <p className="text-sm text-red-600">
                    {companyForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="website" className="text-right">
                Website
              </Label>
              <div className="col-span-3 space-y-1">
                <Input id="website" placeholder="https://..." {...companyForm.register("website")} />
                {companyForm.formState.errors.website?.message && (
                  <p className="text-sm text-red-600">
                    {companyForm.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Ativa
              </Label>
              <div className="col-span-3 flex items-center justify-between">
                <Switch
                  id="is_active"
                  checked={companyForm.watch("is_active")}
                  onCheckedChange={(checked) => companyForm.setValue("is_active", checked)}
                />
              </div>
            </div>

            {companyForm.formState.errors.root?.message && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {companyForm.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={closeModal}
                disabled={companyForm.formState.isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={companyForm.formState.isSubmitting}>
                {companyForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>

        </DialogContent>
      </Dialog>
    </div>
  );
}
