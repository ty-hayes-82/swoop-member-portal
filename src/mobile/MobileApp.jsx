import { MobileNavProvider } from './context/MobileNavContext';
import MobileShell from './MobileShell';

export default function MobileApp() {
  return (
    <MobileNavProvider>
      <MobileShell />
    </MobileNavProvider>
  );
}
