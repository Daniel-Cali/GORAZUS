import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Loader,
  useAppStore,
  ApiClientError,
} from '@gorazus/ui-kit';
// eslint-disable-next-line @nx/enforce-module-boundaries -- `shared/` se importa por ruta relativa dentro del mismo módulo, nunca por nombre de paquete (ver modules/auth/shared/package.json)
import { loginSchema } from '../../shared/contracts/login.schema';
// eslint-disable-next-line @nx/enforce-module-boundaries -- mismo motivo que arriba
import type { LoginInput } from '../../shared/contracts/login.types';
import { useLogin } from '../hooks/use-login';

/** Única pantalla fuera de `<RequireAuth>` junto a `/recuperar-password` (ROUTING.md §5.1) — sin `AppShell`. */
export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setSession = useAppStore((s) => s.setSession);
  const login = useLogin();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { tenantSlug: '', email: '', password: '' },
  });

  const onSubmit = (values: LoginInput) => {
    login.mutate(values, {
      onSuccess: (data) => {
        setSession(data.user, data.activeCompanyId, data.activeBranchId);
        const redirect = searchParams.get('redirect');
        navigate(redirect || '/dashboard', { replace: true });
      },
    });
  };

  const errorMessage =
    login.error instanceof ApiClientError
      ? login.error.message
      : login.error
        ? 'No se pudo iniciar sesión.'
        : null;

  return (
    <div className="flex h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>GORAZUS</CardTitle>
          <CardDescription>Ingresá con tu correo y contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="tenantSlug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organización</FormLabel>
                    <FormControl>
                      <Input autoComplete="organization" placeholder="mi-empresa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" autoComplete="current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {errorMessage && (
                <p className="text-sm font-medium text-destructive">{errorMessage}</p>
              )}

              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending && <Loader className="h-4 w-4" />}
                Iniciar sesión
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
