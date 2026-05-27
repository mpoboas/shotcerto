import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ChallengeFormInput, VideoRange } from "../lib/challenges";
import { drinkDuration } from "../lib/videoTrim";
import type { ChallengeType } from "../lib/pocketbase";
import type { VesselType } from "../lib/drinks";
import {
  resolvedQuantity,
  type QuantityChoice,
} from "../lib/quantity";
import { snapTargetSeconds } from "../lib/targetTime";

export interface SubmitWizardState {
  file: File | null;
  previewUrl: string | null;
  /** Clip final (cortado + comprimido). */
  processedBlob: Blob | null;
  processedPreviewUrl: string | null;
  videoDuration: number | null;
  /** Intervalo da bebida no vídeo original. */
  range: VideoRange;
  /** Intervalo cortado no ficheiro original (com ±1s). */
  trimRange: VideoRange | null;
  /** Posição da bebida dentro do clip guardado. */
  clipRange: VideoRange | null;
  type: ChallengeType;
  targetSeconds: number;
  quantityChoice: QuantityChoice;
  quantityCustom: number;
  drinkType: string;
  vessel: VesselType;
  title: string;
}

const DEFAULT: SubmitWizardState = {
  file: null,
  previewUrl: null,
  processedBlob: null,
  processedPreviewUrl: null,
  videoDuration: null,
  range: { start: 0, end: 0 },
  trimRange: null,
  clipRange: null,
  type: "exact_time",
  targetSeconds: 2,
  quantityChoice: "1",
  quantityCustom: 5,
  drinkType: "agua",
  vessel: "shot",
  title: "",
};

interface Ctx extends SubmitWizardState {
  patch: (
    partial:
      | Partial<SubmitWizardState>
      | ((prev: SubmitWizardState) => Partial<SubmitWizardState>),
  ) => void;
  setDrinkRange: (range: VideoRange) => void;
  reset: () => void;
  toChallengeForm: () => ChallengeFormInput;
  segmentDuration: number;
  quantity: number;
}

const SubmitWizardContext = createContext<Ctx | null>(null);

export function SubmitWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SubmitWizardState>(DEFAULT);

  const patch = useCallback(
    (
      partial:
        | Partial<SubmitWizardState>
        | ((prev: SubmitWizardState) => Partial<SubmitWizardState>),
    ) => {
      setState((s) => ({
        ...s,
        ...(typeof partial === "function" ? partial(s) : partial),
      }));
    },
    [],
  );

  const reset = useCallback(() => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    if (state.processedPreviewUrl) {
      URL.revokeObjectURL(state.processedPreviewUrl);
    }
    setState(DEFAULT);
  }, [state.previewUrl, state.processedPreviewUrl]);

  const setDrinkRange = useCallback(
    (range: VideoRange) => {
      setState((s) => {
        if (s.processedPreviewUrl) URL.revokeObjectURL(s.processedPreviewUrl);
        return {
          ...s,
          range,
          processedBlob: null,
          processedPreviewUrl: null,
          trimRange: null,
          clipRange: null,
        };
      });
    },
    [],
  );

  const segmentDuration = drinkDuration(state.range);
  const quantity = resolvedQuantity(
    state.quantityChoice,
    state.quantityCustom,
  );

  const toChallengeForm = useCallback(
    (): ChallengeFormInput => ({
      type: state.type,
      drink_type: state.drinkType,
      quantity,
      quantity_unit: state.vessel,
      target_seconds:
        state.type === "exact_time"
          ? snapTargetSeconds(state.targetSeconds)
          : undefined,
      range: state.range,
      title: state.title.trim() || undefined,
    }),
    [state, quantity],
  );

  const value = useMemo(
    () => ({
      ...state,
      patch,
      setDrinkRange,
      reset,
      toChallengeForm,
      segmentDuration,
      quantity,
    }),
    [state, patch, setDrinkRange, reset, toChallengeForm, segmentDuration, quantity],
  );

  return (
    <SubmitWizardContext.Provider value={value}>
      {children}
    </SubmitWizardContext.Provider>
  );
}

export function useSubmitWizard() {
  const ctx = useContext(SubmitWizardContext);
  if (!ctx) throw new Error("useSubmitWizard requires SubmitWizardProvider");
  return ctx;
}
