import { useEffect } from "react";

interface VLibrasWidget {
  new (url: string): void;
}

interface VLibras {
  Widget: VLibrasWidget;
}

declare global {
  interface Window {
    VLibras: VLibras;
  }
}

export function VLibrasWidget() {
  useEffect(() => {
    const scriptId = "vlibras-script";
    const scriptSrc = "https://vlibras.gov.br/app/vlibras-plugin.js";

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = scriptSrc;
      script.async = true;
      script.onload = () => {
        if (window.VLibras) {
          new window.VLibras.Widget("https://vlibras.gov.br/app");
        }
      };
      document.body.appendChild(script);
    } else if (window.VLibras) {
      // If script is already loaded, ensure widget is initialized
      // (Though usually it initializes once and persists)
      new window.VLibras.Widget("https://vlibras.gov.br/app");
    }
  }, []);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <div vw class="enabled">
            <div vw-access-button class="active"></div>
            <div vw-plugin-wrapper>
              <div class="vw-plugin-top-wrapper"></div>
            </div>
          </div>
        `,
      }}
    />
  );
}
