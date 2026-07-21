import { useNavigate } from 'react-router-dom';
import { NotFoundPage } from '@gorazus/ui-kit';

/** Ruta comodín (`path: '*'`) a nivel raíz del router (ROUTING.md §7). */
export function NotFound() {
  const navigate = useNavigate();
  return <NotFoundPage onGoHome={() => navigate('/dashboard')} />;
}
