import type { SupportedLanguage } from "@open-party-lab/protocol";
import { ControllerFrame } from "../controller-ui/layout/ControllerFrame.js";
import { getControllerText } from "../i18n/controllerText.js";

export function NotFoundPage({ language }: { language: SupportedLanguage }) {
  const text = getControllerText(language);

  return (
    <ControllerFrame title={text.notFoundTitle} subtitle={text.notFoundSubtitle}>
      <p style={{ margin: 0 }}>{text.notFoundBody}</p>
    </ControllerFrame>
  );
}
