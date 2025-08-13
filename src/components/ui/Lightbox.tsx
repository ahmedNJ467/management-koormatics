import { useState } from "react";

type LightboxProps = {
  src: string;
  alt?: string;
  className?: string;
};

export function Lightbox({ src, alt, className }: LightboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ cursor: "zoom-in" }}
        onClick={() => setOpen(true)}
      />
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      )}
    </>
  );
}

export default Lightbox;
