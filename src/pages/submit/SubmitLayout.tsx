import { Outlet } from "react-router-dom";
import { SubmitWizardProvider } from "../../context/SubmitWizardContext";
import {
  VideoCompressProvider,
  useVideoCompress,
} from "../../context/VideoCompressContext";
import { CompressProgressBar } from "../../components/CompressProgressBar";

function SubmitChrome() {
  const { processing, processRatio } = useVideoCompress();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CompressProgressBar active={processing} ratio={processRatio} />
      <Outlet />
    </div>
  );
}

export function SubmitLayout() {
  return (
    <SubmitWizardProvider>
      <VideoCompressProvider>
        <SubmitChrome />
      </VideoCompressProvider>
    </SubmitWizardProvider>
  );
}
