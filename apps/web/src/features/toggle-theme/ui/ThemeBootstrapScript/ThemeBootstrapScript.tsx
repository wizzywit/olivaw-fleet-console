import { themeStorageKey } from '../../types/theme';

// Runs before the first paint so a dark-mode user never sees a flash of the light theme.
const script = `(function(){try{var t=localStorage.getItem('${themeStorageKey}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;

export function ThemeBootstrapScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
