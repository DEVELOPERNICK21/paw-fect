import { THEME_STORAGE_KEY } from "@/lib/theme";

/** Runs before paint to avoid light flash when dark mode is preferred. */
export function ThemeScript(): React.ReactElement {
  const script = `
(function() {
  try {
    var key = ${JSON.stringify(THEME_STORAGE_KEY)};
    var stored = localStorage.getItem(key);
    var dark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
