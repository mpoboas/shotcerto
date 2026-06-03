import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ChangeEvent,
} from "react";

export type VideoFileInputsHandle = {
  pickFromGallery: () => void;
  pickFromCamera: () => void;
};

type VideoFileInputsProps = {
  onFile: (file: File) => void;
};

/**
 * Dois inputs separados (padrão mobile web):
 * - sem `capture` → galeria
 * - com `capture` → gravar na câmara
 */
export const VideoFileInputs = forwardRef<
  VideoFileInputsHandle,
  VideoFileInputsProps
>(function VideoFileInputs({ onFile }, ref) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    pickFromGallery: () => galleryRef.current?.click(),
    pickFromCamera: () => cameraRef.current?.click(),
  }));

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onFile(file);
  }

  return (
    <>
      <input
        ref={galleryRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={onInputChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={onInputChange}
      />
    </>
  );
});
