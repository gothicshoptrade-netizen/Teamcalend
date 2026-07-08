import { useState } from "react";
import { useListEmployees, useCreateEmployee, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Loader2, UserPlus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { useQueryClient } from "@tanstack/react-query";

const COLORS = [
  "#d97706", "#dc2626", "#ea580c", "#65a30d", "#16a34a",
  "#0d9488", "#0891b2", "#0284c7", "#2563eb", "#4f46e5",
  "#7c3aed", "#9333ea", "#c026d3", "#db2777", "#e11d48",
  "#475569",
];

export function EmployeesDirectory() {
  const { data: employees, isLoading } = useListEmployees();
  const createEmployee = useCreateEmployee();
  const queryClient = useQueryClient();

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName(""); setRole(""); setDepartment(""); setColor(COLORS[0]); setFormError(null);
  };

  const handleSave = () => {
    if (!name.trim() || !role.trim() || !department.trim()) {
      setFormError("Заполните все поля");
      return;
    }
    createEmployee.mutate(
      { data: { name: name.trim(), role: role.trim(), department: department.trim(), color } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEmployeesQueryKey() });
          setIsAdding(false);
          resetForm();
        },
        onError: () => setFormError("Не удалось добавить сотрудника"),
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <header className="mb-6 md:mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Сотрудники</h1>
            <p className="text-muted-foreground mt-1 text-sm">Команда компании и их роли.</p>
          </div>
          <button
            onClick={() => { setIsAdding(!isAdding); resetForm(); }}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 md:px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{isAdding ? "Отмена" : "Добавить"}</span>
          </button>
        </header>

        {isAdding && (
          <div className="bg-card border border-primary/20 bg-accent/10 p-5 rounded-lg mb-6 shadow-sm">
            <h2 className="text-base font-semibold mb-4">Новый сотрудник</h2>
            {formError && (
              <p className="text-sm text-destructive mb-3">{formError}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Имя</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFormError(null); }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Иван Петров"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Должность</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => { setRole(e.target.value); setFormError(null); }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Менеджер"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Отдел</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => { setDepartment(e.target.value); setFormError(null); }}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Маркетинг"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wider">Цвет</label>
                <div className="flex flex-wrap gap-1 h-9 items-center">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-1 ring-primary scale-110" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={createEmployee.isPending}
                className="h-9 px-5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {createEmployee.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Сохранить
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {employees?.map((emp) => (
              <div
                key={emp.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                <Avatar employee={emp} className="h-11 w-11 text-sm shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground truncate">{emp.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{emp.role}</p>
                  <p className="text-xs font-mono text-muted-foreground/70 mt-0.5 uppercase truncate">
                    {emp.department}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
